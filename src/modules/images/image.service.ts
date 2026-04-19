import { getTransformKey, redis } from "../../cache/redis";
import cloudinary from "../../config/cloudinary";
import { publishTransformJob, publishUploadJob } from "../../queue/bullmq";
import CustomError from "../../types/customError";
import { HttpStatusText } from "../../types/HTTPStatusText";
import { decodePublicId } from "../../utils/publicId.codec";
import { ImageModel } from "./image.model";
import { TransformationOptions } from "./image.type";

export class ImageService {
  static async uploadImage(file: Express.Multer.File, userId: number) {
    if (!file) {
      throw new CustomError("No image uploaded", 400, HttpStatusText.FAIL);
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
    const image = await ImageModel.findByPublicId(publicId);
    if (!image) {
      throw new CustomError("Image not found", 404, HttpStatusText.FAIL);
    }

    if (!image.publicId) {
      throw new CustomError("Image not found", 404, HttpStatusText.FAIL);
    }

    return cloudinary.url(decodePublicId(image.publicId));
  }

  static async transform(transformations: TransformationOptions, id: string) {
    // The service first checks if the transformed image already exists in the cache (Redis) using a unique cache key generated from the image ID and transformation options.
    const image = await ImageModel.findByPublicId(id);
    if (!image) {
      throw new CustomError("Image not found", 404, HttpStatusText.FAIL);
    }

    if (!image.publicId) {
      throw new CustomError("Image not found", 404, HttpStatusText.FAIL);
    }

    const encodedPublicId = image.publicId;

    // If a cached version of the transformed image is found, it updates the image record in the database with the cached URL and returns the transformation result immediately, indicating that the transformation is completed.
    const cacheKey = getTransformKey(encodedPublicId, transformations);
    const cached = await redis.get(cacheKey);
    if (cached) {
      await ImageModel.updateStatus(image.id, {
        url: cached,
        status: "completed",
      });

      return {
        imageId: image.id,
        publicId: encodedPublicId,
        status: "completed",
        url: cached,
      };
    }
    // If no cached version is found, it updates the image record in the database to indicate that the transformation is in progress (status: "transforming") and then publishes a job to the queue with the necessary data for the worker to process the transformation asynchronously.
    await ImageModel.updateStatus(image.id, {
      status: "transforming",
    });

    // The image transformation is handled asynchronously by a worker that processes jobs from the queue.
    await publishTransformJob({ imageId: encodedPublicId, transformations });

    return {
      imageId: image.id,
      publicId: encodedPublicId,
      status: "transforming",
      url: image.url,
    };
  }

  static async getUploadStatus(uploadId: string) {
    const image =
      (await ImageModel.findById(uploadId)) || (await ImageModel.findByPublicId(uploadId));
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

    const p = Number(page);
    const l = Number(limit);

    // The service calculates the number of records to skip based on the current page and limit,
    // and then queries the database for the user's images using the ImageModel,
    // applying pagination and sorting by creation date in descending order.
    const skip = (p - 1) * l;

    return ImageModel.findByUserIdPaginated(userId, skip, l);
  }
}
