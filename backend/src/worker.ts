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
  UploadJobData,
} from "./queue/bullmq";

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
          //  and the result of the upload (including the public ID and secure URL) is returned upon successful completion.
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
        publicId: uploadResult.public_id,
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
    console.log('Got here');
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
      console.log("Processing image transform job:", job.data);
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

// nodemon --watch 'src/worker.ts' --exec 'ts-node' src/worker.ts
