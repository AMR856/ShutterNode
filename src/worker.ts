import dotenv from "dotenv";
dotenv.config();
import { Worker } from "bullmq";
import cloudinary from "./config/cloudinary";
import { ImageModel } from "./modules/images/image.model";
import IORedis from "ioredis";

import {
  IMAGE_TRANSFORM_QUEUE,
  IMAGE_UPLOAD_QUEUE,
  imageUploadDeadQueue,
  TransformJobData,
  UploadJobData,
} from "./queue/bullmq";
import { TransformationOptions } from "./modules/images/image.type";
import { getTransformKey, redis } from "./cache/redis";
import CustomError from "./types/customError";
import { HttpStatusText } from "./types/HTTPStatusText";
import { decodePublicId, encodePublicId } from "./utils/publicId.codec";

export interface WorkerRuntime {
  close: () => Promise<void>;
}

export async function startWorker(): Promise<WorkerRuntime> {
  const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";
  const uploadWorkerConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });
  const transformWorkerConnection = new IORedis(redisUrl, {
    maxRetriesPerRequest: null,
  });

  const uploadWorker = new Worker<UploadJobData>(
    IMAGE_UPLOAD_QUEUE,
    async (job) => {
      // Job data is expected to contain the upload ID, user ID, and the file buffer (encoded as a base64 string) for the image that needs to be uploaded to Cloudinary.
      const { uploadId, userId, fileBuffer }: UploadJobData = job.data;

      const buffer = Buffer.from(fileBuffer, "base64");

      // The worker processes the upload job by uploading the image to Cloudinary using the provided file buffer.
      const uploadResult: any = await new Promise((resolve, reject) => {
        cloudinary.uploader
          // The image is uploaded to a specific folder in Cloudinary based on the user ID,
          // and the result of the upload (including the public ID and secure URL) is returned upon successful completion.
          // If there is an error during the upload process,
          // it is rejected and handled in the job's failure logic.
          .upload_stream({ folder: `images/${userId}` }, (error, result) => {
            if (error) reject(error);
            else resolve(result);
          })
          .end(buffer);
      });

      // Updating the image record in the database with the Cloudinary public ID, secure URL, and marking the status as "completed" once the upload is successful.
      await ImageModel.updateStatus(uploadId, {
        publicId: encodePublicId(uploadResult.public_id),
        url: uploadResult.secure_url,
        status: "completed",
      });

      console.log("Upload job completed", uploadResult.public_id);
    },
    {
      connection: uploadWorkerConnection,
    },
  );

  uploadWorker.on("failed", async (job, err) => {
    // If a job fails, the worker checks if the maximum number of retry attempts has been reached.
    // If it has, the image record in the database is updated to mark the status as "failed".
    // Additionally, a new job is added to a separate "dead" queue for failed uploads,
    // which includes details about the failure such as the number of attempts and the error message.
    // This allows for monitoring and handling of failed upload jobs separately from successful ones.
    if (!job) return;
    const maxAttempts = job.opts.attempts ?? 1;
    if (job.attemptsMade >= maxAttempts) {
      await ImageModel.updateStatus(job.data.uploadId, {
        status: "failed",
      });

      await imageUploadDeadQueue.add("dead-upload", {
        ...job.data,
        attempts: job.attemptsMade,
        error: err.message,
      });
    }

    console.error("Error processing upload job", err);
  });

  // Creating a separate worker for processing image transformation jobs from the IMAGE_TRANSFORM_QUEUE.
  const transformWorker = new Worker(
    IMAGE_TRANSFORM_QUEUE,
    async (job) => {
      const { imageId, transformations } = job.data as TransformJobData & {
        transformations: TransformationOptions;
      };

      const image = await ImageModel.findByPublicId(imageId);
      const cloudinaryPublicId = decodePublicId(imageId);

      if (!image) {
        throw new CustomError(
          `Image not found for transform job: ${imageId}`,
          404,
          HttpStatusText.FAIL,
        );
      }

      // The worker first checks if a cached version of the transformed image already exists in Redis using a unique cache key generated from the image ID and transformation options.
      const cacheKey = getTransformKey(imageId, transformations);
      const cached = await redis.get(cacheKey);
      if (cached) {
        await ImageModel.updateStatus(image.id, {
          url: cached,
          status: "completed",
        });
        return;
      }

      const t: any[] = [];

      // If a cached version is not found, the worker processes the transformation by applying the specified transformations to the image using Cloudinary's transformation features.
      // Resize transformations are applied based on the provided options, allowing for resizing the image with different cropping and gravity settings, as well as zooming capabilities.
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

      if (transformations.rotate && transformations.rotate !== 0) {
        t.push({ angle: Number(transformations.rotate) });
      }

      // Flips are applied based on the specified options in the transformations, allowing for horizontal, vertical, or both flips to be applied to the image as needed.
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

      // Adjustments are applied based on the specified options in the transformations, allowing for modifications to brightness, contrast, saturation, hue, vibrance, gamma, sharpen, and unsharp mask effects.
      if (transformations.adjustments) {
        const adj = transformations.adjustments;

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

      // Filters are applied based on the specified options in the transformations, allowing for effects such as grayscale, sepia, blur, pixelate, vignette, oil paint, art filters, and cartoonify.
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

      // Radius
      if (transformations.radius !== undefined) {
        t.push({ radius: transformations.radius });
      }

      // ! There is an error in the border and background properties
      // TODO: Check the error and fix it
      if (transformations.border) {
        const { width, color } = transformations.border;
        t.push({ border: `${width}px_solid_${color}` });
      }

      if (transformations.background) {
        t.push({ background: transformations.background });
      }

      // Watermarks are applied based on the specified options in the transformations, allowing for overlaying text watermarks with customizable font, size, color, position, and opacity settings.
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

      if (transformations.quality !== undefined) {
        t.push({ quality: transformations.quality });
      }

      if (transformations.dpr !== undefined) {
        t.push({ dpr: transformations.dpr });
      }

      const url = cloudinary.url(cloudinaryPublicId, {
        transformation: t,
        ...(transformations.format ? { format: transformations.format } : {}),
        ...(transformations.fetchFormat
          ? { fetch_format: transformations.fetchFormat }
          : {}),
        secure: true,
      });

      // Once the transformation is applied and the URL for the transformed image is generated, it is cached in Redis using the same unique cache key for future requests with the same transformation options.
      await redis.set(cacheKey, url);

      await ImageModel.updateStatus(image.id, {
        url,
        status: "completed",
      });

      console.log("Transform job completed", imageId);
    },
    {
      connection: transformWorkerConnection,
    },
  );

  // Creating a close function that gracefully shuts down both the upload and transform workers, as well as their respective Redis connections, when the application is terminating.
  return {
    close: async () => {
      await Promise.all([uploadWorker.close(), transformWorker.close()]);
      await Promise.all([
        uploadWorkerConnection.quit(),
        transformWorkerConnection.quit(),
      ]);
    },
  };
}

if (require.main === module) {
  startWorker()
    // If the worker is started directly (e.g., via `ts-node src/worker.ts`), it will initialize the worker and set up signal handlers for graceful shutdown.
    .then((workerRuntime) => {
      const shutdown = async () => {
        await workerRuntime.close();
        process.exit(0);
      };

      process.on("SIGTERM", shutdown);
      process.on("SIGINT", shutdown);
    })
    .catch((err) => {
      console.error("Worker bootstrap failed:", err);
      process.exit(1);
    });
}
