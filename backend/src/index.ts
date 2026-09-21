import { prisma } from "./lib/prisma.js";
import { app } from "./app.js";
import { env } from "./config/env.js";
import { logger } from "./lib/logger.js";

async function startServer() {
  try {
    await prisma.$connect();
    logger.info("Database connected successfully");

    const server = app.listen(env.PORT, () => {
      logger.info(`Server running on http://localhost:${env.PORT}`);
    });

    const shutdown = (signal: string) => {
      logger.info(`${signal} received, shutting down gracefully`);

      server.close(async (err) => {
        if (err) {
          logger.error({ err }, "Error while closing HTTP server");
        }

        await prisma.$disconnect();
        logger.info("Database connection closed");
        process.exit(err ? 1 : 0);
      });

      // Don't hang forever waiting for in-flight connections to drain.
      setTimeout(() => {
        logger.error("Forced shutdown after timeout");
        process.exit(1);
      }, 10_000).unref();
    };

    process.on("SIGTERM", () => shutdown("SIGTERM"));
    process.on("SIGINT", () => shutdown("SIGINT"));

    process.on("unhandledRejection", (reason) => {
      logger.error({ reason }, "Unhandled promise rejection");
    });

    process.on("uncaughtException", (err) => {
      logger.error({ err }, "Uncaught exception");
      process.exit(1);
    });
  } catch (error) {
    logger.error({ error }, "Database connection failed");
    process.exit(1);
  }
}

startServer();