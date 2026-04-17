import dotenv from "dotenv";
dotenv.config();

import app from "./app";
import { connectBullMQ, disconnectBullMQ } from "./queue/bullmq";
import { startWorker, WorkerRuntime } from "./worker";

const PORT = process.env.PORT || 5000;
const SINGLE_PROCESS = process.env.SINGLE_PROCESS === "true";

async function bootstrap() {
  await connectBullMQ(); // Establish connections to the BullMQ queues before starting the server and worker.
  let workerRuntime: WorkerRuntime | null = null;

  // If the application is running in single-process mode, start the worker within the same process as the server.
  // This is useful for development or simple deployments where running separate processes for the server and worker is not necessary.
  if (SINGLE_PROCESS) {
    workerRuntime = await startWorker();
  }

  const server = app.listen(PORT, () =>
    console.log(`Server started on http://localhost:${PORT}`),
  );

  const shutdown = (signal: string) => {
    console.info(`Received ${signal}. Shutting down gracefully...`);
    server.close(async () => {
      // If the worker is running in the same process, close it gracefully before disconnecting from BullMQ.
      if (workerRuntime) {
        await workerRuntime.close();
      }
      await disconnectBullMQ();
      console.log("HTTP server closed");
      process.exit(0);
    });

    // !NOT GRACEFUL: If the server doesn't close within 10 seconds, forcefully exit the process to prevent hanging.
    setTimeout(() => {
      console.error("Could not close connections in time, forcing shutdown");
      process.exit(1);
    }, 10_000);
  };

  process.on("SIGTERM", () => shutdown("SIGTERM"));
  process.on("SIGINT", () => shutdown("SIGINT"));
}

bootstrap().catch((err) => {
  console.error("Bootstrap failed:", err);
  process.exit(1);
});
