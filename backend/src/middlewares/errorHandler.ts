import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { AppError, ValidationError } from "../lib/errors.js";
import { logger } from "../lib/logger.js";

export function notFoundHandler(
  req: Request,
  res: Response,
  _next: NextFunction
) {
  res.status(404).json({
    error: {
      message: `Route not found: ${req.method} ${req.originalUrl}`
    }
  });
}

export function errorHandler(
  err: unknown,
  req: Request,
  res: Response,
  _next: NextFunction
) {
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      error: { message: err.message }
    };

    if (err instanceof ValidationError && err.details) {
      (body.error as Record<string, unknown>).details = err.details;
    }

    return res.status(err.statusCode).json(body);
  }

  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({ error: { message: "Resource not found" } });
    }
    if (err.code === "P2002") {
      return res.status(409).json({ error: { message: "Resource already exists" } });
    }
  }

  // req.log carries the request ID, so this error can be traced back
  // to the exact request that caused it.
  (req.log ?? logger).error({ err }, "Unhandled error");

  return res.status(500).json({
    error: { message: "Internal server error" }
  });
}