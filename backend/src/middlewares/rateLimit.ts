import rateLimit from "express-rate-limit";
import { env } from "../config/env.js";

export const apiRateLimiter = rateLimit({
  windowMs: env.RATE_LIMIT_WINDOW_MS,
  max: env.RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: { error: { message: "Too many requests, please try again later." } }
});

export const redirectRateLimiter = rateLimit({
  windowMs: env.REDIRECT_RATE_LIMIT_WINDOW_MS,
  max: env.REDIRECT_RATE_LIMIT_MAX,
  standardHeaders: true,
  legacyHeaders: false,
  skip: () => env.NODE_ENV === "test",
  message: { error: { message: "Too many requests, please try again later." } }
});
