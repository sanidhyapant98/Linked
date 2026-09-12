import { Request, Response, NextFunction } from "express";
import { Prisma } from "../generated/prisma/client.js";
import { AppError, ValidationError } from "../lib/errors.js";

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
  _req: Request,
  res: Response,
  _next: NextFunction
) {
  // Known, operational errors we threw on purpose
  if (err instanceof AppError) {
    const body: Record<string, unknown> = {
      error: {
        message: err.message
      }
    };

    if (err instanceof ValidationError && err.details) {
      (body.error as Record<string, unknown>).details = err.details;
    }

    return res.status(err.statusCode).json(body);
  }

  // Prisma-specific errors get translated to sane HTTP responses
  if (err instanceof Prisma.PrismaClientKnownRequestError) {
    if (err.code === "P2025") {
      return res.status(404).json({
        error: { message: "Resource not found" }
      });
    }

    if (err.code === "P2002") {
      return res.status(409).json({
        error: { message: "Resource already exists" }
      });
    }
  }

  // Anything else is unexpected — log it, don't leak internals to the client
  console.error("Unhandled error:", err);

  return res.status(500).json({
    error: { message: "Internal server error" }
  });
}