import { getTransformKey, redis } from "../../cache/redis";
import cloudinary from "../../config/cloudinary";
import { publishTransformJob, publishUploadJob } from "../../queue/bullmq";
import CustomError from "../../types/customError";
import { HttpStatusText } from "../../types/HTTPStatusText";
import { ImageModel } from "./image.model";
import { TransformationOptions } from "./image.type";

export class ImageService {
  static async uploadImage(file: Express.Multer.File, userId: number) {
    if (!file) {
      throw new CustomError("No image uploaded", 400, HttpStatusText.FAIL);
    }

    if (!userId) {
      throw new CustomError("Unauthorized", 401, HttpStatusText.FAIL);
    }

    const pendingImage = await ImageModel.createPending(userId);

    // We publish a job to the queue with the necessary data for the worker to process the upload.
    const job = {
      uploadId: pendingImage.id,
      userId,
      fileBuffer: file.buffer.toString("base64"),
    };

    // The image upload is handled asynchronously by a worker that processes jobs from the queue.
    await publishUploadJob(job);

    // The service returns a response indicating that the image upload has been enqueued and is being processed asynchronously,
    // along with the upload ID and initial status.
    // The client can use the upload ID to check the status of the upload later.
    return {
      uploadId: pendingImage.id,
      status: pendingImage.status,
      message: "Image upload enqueued, processing asynchronously",
    };
  }

  static async getImage(publicId: string) {
    // The service retrieves the image URL from Cloudinary using the provided public ID.
    if (!publicId || publicId.trim() === ":publicId") {
      throw new CustomError(
        "Image publicId is required",
        400,
        HttpStatusText.FAIL,
      );
    }

    const image = await ImageModel.findByPublicId(publicId);
    if (!image) {
      throw new CustomError("Image not found", 404, HttpStatusText.FAIL);
    }

    return cloudinary.url(publicId);
  }

  static async transform(
    transformations: TransformationOptions,
    id: string,
  ): Promise<string> {
    // Checking the images exist, transformations are provided, and validating the input parameters before applying transformations to the image.
    if (!id) {
      throw new CustomError("Image id is required", 400, HttpStatusText.FAIL);
    }
    if (!transformations) {
      throw new CustomError(
        "Transformations are required",
        400,
        HttpStatusText.FAIL,
      );
    }

    const image = await ImageModel.findByPublicId(id);
    if (!image) {
      throw new CustomError("Image not found", 404, HttpStatusText.FAIL);
    }

    // Checking the cache before applying transformations to see if the transformed image URL is already stored in Redis.
    const cacheKey = getTransformKey(id, transformations);
    const cached = await redis.get(cacheKey);
    if (cached) return cached;

    const t: any[] = [];
    console.log("Applying transformations:", transformations);
    // The service constructs a transformation array based on the provided transformation options, which can include resizing, cropping, rotating, flipping, applying filters, adding watermarks, and adjusting quality or format.
    if (transformations.resize) {
      const {
        width,
        height,
        crop = "fill",
        gravity = "auto",
        zoom,
      } = transformations.resize;
      const layer: any = { crop };

      if (width) layer.width = Number(width);
      if (height) layer.height = Number(height);
      if (gravity) layer.gravity = gravity;
      if (zoom !== undefined) layer.zoom = zoom;

      t.push(layer);
    }

    // Checking rotation
    if (transformations.rotate && transformations.rotate !== 0) {
      t.push({ angle: Number(transformations.rotate) });
    }

    // Checking flip options and adding corresponding transformations for horizontal, vertical, or both flips based on the provided flip option in the transformation settings.
    if (transformations.flip) {
      switch (transformations.flip) {
        case "horizontal":
          t.push({ angle: "hflip" });
          break;
        case "vertical":
          t.push({ angle: "vflip" });
          break;
        case "both":
          t.push({ angle: "hflip" });
          t.push({ angle: "vflip" });
          break;
      }
    }

    if (transformations.adjustments) {
      const adj = transformations.adjustments;

      // The service checks for various adjustment options such as brightness, contrast, saturation, hue, vibrance, gamma, sharpen, and unsharp mask, and adds corresponding effect transformations to the transformation array based on the provided adjustment values in the transformation settings.
      if (adj.brightness !== undefined)
        t.push({ effect: `brightness:${adj.brightness}` });
      if (adj.contrast !== undefined)
        t.push({ effect: `contrast:${adj.contrast}` });
      if (adj.saturation !== undefined)
        t.push({ effect: `saturation:${adj.saturation}` });
      if (adj.hue !== undefined) t.push({ effect: `hue:${adj.hue}` });
      if (adj.vibrance !== undefined)
        t.push({ effect: `vibrance:${adj.vibrance}` });
      if (adj.gamma !== undefined) t.push({ effect: `gamma:${adj.gamma}` });
      if (adj.sharpen !== undefined)
        t.push({ effect: `sharpen:${adj.sharpen}` });
      if (adj.unsharpMask !== undefined)
        t.push({ effect: `unsharp_mask:${adj.unsharpMask}` });
    }

    // The service checks for various filter options such as grayscale, sepia, blur, pixelate, vignette, oil paint, cartoonify, negate, and artistic style filters, and adds corresponding effect transformations to the transformation array based on the provided filter settings in the transformation options.
    if (transformations.filters) {
      const f = transformations.filters;

      if (f.grayscale) t.push({ effect: "grayscale" });
      if (f.sepia) t.push({ effect: "sepia" });
      if (f.negate) t.push({ effect: "negate" });
      if (f.blur !== undefined) t.push({ effect: `blur:${f.blur}` });
      if (f.pixelate !== undefined)
        t.push({ effect: `pixelate:${f.pixelate}` });
      if (f.vignette !== undefined)
        t.push({ effect: `vignette:${f.vignette}` });
      if (f.oilPaint !== undefined)
        t.push({ effect: `oil_paint:${f.oilPaint}` });
      if (f.art) t.push({ effect: `art:${f.art}` });

      if (f.cartoonify !== undefined) {
        t.push({
          effect:
            typeof f.cartoonify === "number"
              ? `cartoonify:${f.cartoonify}`
              : "cartoonify",
        });
      }
    }

    // The service checks for a corner radius transformation and adds it to the transformation array if provided.
    if (transformations.radius !== undefined) {
      t.push({ radius: transformations.radius });
    }

    // The service checks for a border transformation and adds it to the transformation array if provided.
    if (transformations.border) {
      const { width, color } = transformations.border;
      t.push({ border: `${width}px_solid_${color}` });
    }

    // The service checks for a background color transformation and adds it to the transformation array if provided.
    if (transformations.background) {
      t.push({ background: transformations.background });
    }

    // The service checks for a watermark transformation and adds it to the transformation array if provided.
    if (transformations.watermark) {
      const wm = transformations.watermark;
      t.push({
        overlay: {
          font_family: wm.fontFamily ?? "Arial",
          font_size: wm.fontSize ?? 40,
          text: wm.text,
          ...(wm.fontColor ? { font_color: wm.fontColor } : {}),
        },
        gravity: wm.gravity ?? "south_east",
        x: wm.x ?? 10,
        y: wm.y ?? 10,
        opacity: wm.opacity ?? 60,
      });
    }

    // The service checks for a quality transformation and adds it to the transformation array if provided.
    if (transformations.quality !== undefined) {
      t.push({ quality: transformations.quality });
    }

    // Dpr is handled as a separate parameter since it doesn't fit into the standard transformation syntax and is applied as a separate transformation option when generating the transformed image URL.
    if (transformations.dpr !== undefined) {
      t.push({ dpr: transformations.dpr });
    }

    const url = cloudinary.url(id, {
      transformation: t,
      ...(transformations.format ? { format: transformations.format } : {}),
      ...(transformations.fetchFormat
        ? { fetch_format: transformations.fetchFormat }
        : {}),
      secure: true,
    });

    // Caching the transformation
    await redis.set(cacheKey, url);
    // Publishing a job to the queue with the necessary data for the worker to process the image transformation asynchronously, allowing for efficient handling of potentially time-consuming transformations without blocking the main application thread.
    await publishTransformJob({ imageId: id, transformations, url });

    return url;
  }

  static async getUploadStatus(uploadId: string) {
    if (!uploadId) {
      throw new CustomError("Upload ID is required", 400, HttpStatusText.FAIL);
    }

    const image = await ImageModel.findById(uploadId);
    if (!image) {
      throw new CustomError("Upload not found", 404, HttpStatusText.FAIL);
    }

    return {
      id: image.id,
      status: image.status,
      publicId: image.publicId,
      url: image.url,
    };
  }

  static async getImages(userId: number, page: number, limit: number) {
    // The service retrieves a paginated list of images for the authenticated user,
    // allowing clients to specify pagination parameters (page and limit) to control the number of results returned per page and navigate through the user's image collection efficiently.
    if (!userId || Number.isNaN(userId)) {
      throw new CustomError("Unauthorized", 401, HttpStatusText.FAIL);
    }

    const p = Number(page);
    const l = Number(limit);

    if (!Number.isInteger(p) || p < 1 || !Number.isInteger(l) || l < 1) {
      throw new CustomError(
        "Invalid pagination parameters",
        400,
        HttpStatusText.FAIL,
      );
    }

    // The service calculates the number of records to skip based on the current page and limit,
    // and then queries the database for the user's images using the ImageModel,
    // applying pagination and sorting by creation date in descending order.
    const skip = (p - 1) * l;

    return ImageModel.findByUserIdPaginated(userId, skip, l);
  }
}
