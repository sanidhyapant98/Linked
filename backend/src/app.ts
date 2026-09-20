import express from "express";
import swaggerUi from "swagger-ui-express";
import linkRoutes from "./routes/link.routes.js";
import { redirectLinkController } from "./controllers/link.controllers.js";
import { notFoundHandler, errorHandler } from "./middlewares/errorHandler.js";
import { prisma } from "./lib/prisma.js";
import { openApiSpec } from "./docs/swagger.js";

export function createApp() {
  const app = express();

  // Trust the first proxy hop so req.ip reflects the real client IP
  // once this sits behind nginx/ALB/ingress (Phases 10-13).
  app.set("trust proxy", 1);

  app.use(express.json());

  app.use("/api/links", linkRoutes);

  app.get("/openapi.json", (_req, res) => {
    res.status(200).json(openApiSpec);
  });
  app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(openApiSpec));

  app.get("/health", async (_req, res) => {
    try {
      await prisma.$queryRaw`SELECT 1`;

      res.status(200).json({
        status: "ok",
        database: "connected"
      });
    } catch (error) {
      console.error("Database health check failed:", error);

      res.status(503).json({
        status: "error",
        database: "disconnected"
      });
    }
  });

  app.get("/:shortCode", redirectLinkController);

  // Unmatched routes -> 404
  app.use(notFoundHandler);

  // Centralized error handler -> must be registered last, after all routes
  app.use(errorHandler);

  return app;
}

export const app = createApp();