import express from "express";
import helmet from "helmet";
import cors from "cors";
import compression from "compression";
import swaggerUi from "swagger-ui-express";
import linkRoutes from "./routes/link.routes.js";
import { redirectLinkController } from "./controllers/link.controllers.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { requestLogger } from "./middlewares/requestLogger.js";
import { apiRateLimiter, redirectRateLimiter } from "./middlewares/rateLimit.js";
import { prisma } from "./lib/prisma.js";
import { openApiSpec } from "./docs/swagger.js";
import { corsOrigins, docsEnabled } from "./config/env.js";

export function createApp() {
  const app = express();

  app.set("trust proxy", 1);
  app.disable("x-powered-by");

  app.use(
    helmet({
      // Swagger UI needs inline scripts/styles to render. Rather than
      // weaken CSP for everyone, only relax it when the docs are actually
      // exposed (never in production by default — see docsEnabled).
      contentSecurityPolicy: docsEnabled ? false : undefined
    })
  );
  app.use(cors({ origin: corsOrigins }));
  app.use(compression());
  app.use(requestLogger);

  app.use(express.json());

  app.use("/api/links", apiRateLimiter, linkRoutes);

  if (docsEnabled) {
    app.get("/openapi.json", (_req, res) => {
      res.status(200).json(openApiSpec);
    });
    app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));
  }

  app.get("/health", async (req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      res.status(200).json({
        status: "ok",
        database: "connected"
      });
    } catch (error) {
      req.log.error({ err: error }, "Database health check failed");

      res.status(503).json({
        status: "error",
        database: "disconnected"
      });
    }
  });

  app.get("/:shortCode", redirectRateLimiter, redirectLinkController);

  app.use(notFoundHandler);

  app.use(errorHandler);

  return app;
}

export const app = createApp();
