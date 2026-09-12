import { z } from "zod";

export const createLinkSchema = z.object({
  body: z.object({
    originalUrl: z
      .string({ message: "originalUrl is required" })
      .url({ message: "originalUrl must be a valid URL" })
  })
});

export const updateLinkSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, { message: "id must be a positive integer" })
  }),
  body: z.object({
    originalUrl: z
      .string({ message: "originalUrl is required" })
      .url({ message: "originalUrl must be a valid URL" })
  })
});

export const idParamSchema = z.object({
  params: z.object({
    id: z
      .string()
      .regex(/^\d+$/, { message: "id must be a positive integer" })
  })
});

export const shortCodeParamSchema = z.object({
  params: z.object({
    shortCode: z
      .string()
      .min(1, { message: "shortCode is required" })
  })
});