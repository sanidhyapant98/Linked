import { Request, Response, NextFunction } from "express";
import { ZodType, ZodError } from "zod";
import { ValidationError } from "../lib/errors.js";

export function validate(schema: ZodType) {
  return (req: Request, _res: Response, next: NextFunction) => {
    try {
      const parsed = schema.parse({
        body: req.body,
        params: req.params,
        query: req.query
      }) as { body?: unknown; params?: unknown; query?: Record<string, unknown> };

      // NOTE: In Express 5 `req.query` (and `req.params`) are getter-only
      // and return a fresh object on each access. `Object.assign(req.query, ...)`
      // therefore mutates a throwaway object and the parsed defaults
      // (page, limit, sortBy, sortOrder) never reach the controller,
      // leaving skip/take/sortBy as `undefined` -> Prisma throws
      // "Argument `skip` is missing".
      // Use defineProperty to actually override the value on the request.
      if (parsed.query) {
        Object.defineProperty(req, "query", {
          value: parsed.query,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }

      if (parsed.body !== undefined) {
        req.body = parsed.body;
      }

      if (parsed.params) {
        Object.defineProperty(req, "params", {
          value: parsed.params,
          writable: true,
          enumerable: true,
          configurable: true
        });
      }

      next();
    } catch (error) {
      if (error instanceof ZodError) {
        const details = error.issues.map((issue) => ({
          path: issue.path.join("."),
          message: issue.message
        }));

        return next(new ValidationError("Validation failed", details));
      }

      next(error);
    }
  };
}
