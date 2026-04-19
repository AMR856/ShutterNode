import { Queue } from "bullmq";
import IORedis from "ioredis";

export const IMAGE_TRANSFORM_QUEUE = "image_transform";
export const IMAGE_UPLOAD_QUEUE = "image_upload";
export const IMAGE_UPLOAD_DEAD_QUEUE = "image_upload_dead";

// Define TypeScript interfaces for the data structures used in the BullMQ queues, including upload and transform job data,
// as well as dead upload job data with error information.
export interface UploadJobData {
  uploadId: string;
  userId: number;
  fileBuffer: string;
}

export interface TransformJobData {
  imageId: string;
  transformations: unknown;
}

// This interface extends the UploadJobData to include additional fields for tracking the number of attempts and any error messages for failed upload jobs.
export interface DeadUploadJobData extends UploadJobData {
  attempts: number;
  error?: string;
}

const redisUrl = process.env.REDIS_URL || "redis://localhost:6379";

const queueConnection = new IORedis(redisUrl, {
  maxRetriesPerRequest: null,
});

export const imageUploadQueue = new Queue<UploadJobData>(IMAGE_UPLOAD_QUEUE, {
  connection: queueConnection,
  // Set default job options to retry failed jobs up to 3 times with an exponential backoff strategy, and automatically remove completed jobs from the queue.
  defaultJobOptions: {
    attempts: 3,
    backoff: {
      // It increases the delay between retries exponentially,
      // starting with a 2-second delay for the first retry,
      // then 4 seconds for the second retry, and so on.
      type: "exponential",
      delay: 2_000,
    },
    removeOnComplete: true, // Removes completed jobs
  },
});

export const imageTransformQueue = new Queue<TransformJobData>(
  IMAGE_TRANSFORM_QUEUE,
  {
    connection: queueConnection,
    defaultJobOptions: {
      // Add retries for transient failures
      attempts: 2, // Lower than upload (less likely to recover)
      backoff: {
        type: "exponential",
        delay: 1_000, // Shorter delay than upload
      },
      removeOnComplete: true,
    },
  },
);

export const imageUploadDeadQueue = new Queue<DeadUploadJobData>(
  IMAGE_UPLOAD_DEAD_QUEUE,
  {
    connection: queueConnection,
    defaultJobOptions: {
      removeOnComplete: false, // Keep failed jobs for inspection
    },
  },
);

// This function establishes connections to all the defined BullMQ queues (image upload, image transform, and dead upload queues) and waits until they are ready before proceeding with any operations.
// It ensures that the queues are fully initialized and ready to handle jobs before any processing begins.
export async function connectBullMQ() {
  await Promise.all([
    imageUploadQueue.waitUntilReady(),
    imageTransformQueue.waitUntilReady(),
    imageUploadDeadQueue.waitUntilReady(),
  ]);
}

export async function publishTransformJob(data: TransformJobData) {
  await imageTransformQueue.add("image-transform", data);
}

export async function publishUploadJob(data: UploadJobData) {
  await imageUploadQueue.add("image-upload", data);
}

// This function gracefully shuts down the BullMQ queues by closing their connections and quitting the Redis connection.
//  It ensures that all resources are properly released and that the queues are cleanly terminated when the application
// is shutting down or when the queues are no longer needed.
export async function disconnectBullMQ() {
  await Promise.all([
    imageUploadQueue.close(),
    imageTransformQueue.close(),
    imageUploadDeadQueue.close(),
  ]);

  await queueConnection.quit();
}
