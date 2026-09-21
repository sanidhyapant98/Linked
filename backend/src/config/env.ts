import "dotenv/config";
import { z } from "zod";

const envSchema = z.object({
  NODE_ENV: z.enum(["development", "production", "test"]).default("development"),
  PORT: z.coerce.number().int().positive().default(3000),
  DATABASE_URL: z
    .string({ message: "DATABASE_URL is not set. Check backend/.env" })
    .min(1),

  // Comma-separated list of allowed origins, or "*" to allow all.
  CORS_ORIGIN: z.string().default("*"),

  // General API rate limit (per IP).
  RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  RATE_LIMIT_MAX: z.coerce.number().int().positive().default(100),

  // The public redirect endpoint carries most real traffic and needs headroom.
  REDIRECT_RATE_LIMIT_WINDOW_MS: z.coerce.number().int().positive().default(60_000),
  REDIRECT_RATE_LIMIT_MAX: z.coerce.number().int().positive().default(300),

  LOG_LEVEL: z
    .enum(["fatal", "error", "warn", "info", "debug", "trace", "silent"])
    .default("info"),

  // Swagger UI / openapi.json exposes the full schema and error shapes.
  // Off by default in production unless explicitly opted into.
  ENABLE_API_DOCS: z
    .enum(["true", "false"])
    .optional()
    .transform((v) => v === "true")
});

function loadEnv() {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    console.error("Invalid environment configuration:");
    console.error(parsed.error.format());
    process.exit(1);
  }

  return parsed.data;
}

export const env = loadEnv();

export const corsOrigins =
  env.CORS_ORIGIN === "*"
    ? true
    : env.CORS_ORIGIN.split(",").map((origin) => origin.trim());

export const docsEnabled = env.ENABLE_API_DOCS ?? env.NODE_ENV !== "production";
