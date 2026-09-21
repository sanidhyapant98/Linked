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
    id: z.string().regex(/^\d+$/, { message: "id must be a positive integer" })
  }),
  body: z.object({
    originalUrl: z
      .string({ message: "originalUrl is required" })
      .url({ message: "originalUrl must be a valid URL" })
  })
});

export const idParamSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, { message: "id must be a positive integer" })
  })
});

export const shortCodeParamSchema = z.object({
  params: z.object({
    shortCode: z.string().min(1, { message: "shortCode is required" })
  })
});

const pageSchema = z
  .string()
  .regex(/^\d+$/, { message: "page must be a positive integer" })
  .transform(Number)
  .refine((n) => n >= 1, { message: "page must be at least 1" })
  .optional()
  .default(1);

const limitSchema = z
  .string()
  .regex(/^\d+$/, { message: "limit must be a positive integer" })
  .transform(Number)
  .refine((n) => n >= 1 && n <= 100, {
    message: "limit must be between 1 and 100"
  })
  .optional()
  .default(20);

export const listLinksSchema = z.object({
  query: z.object({
    page: pageSchema,
    limit: limitSchema,
    sortBy: z
      .enum(["createdAt", "clickCount", "originalUrl"])
      .optional()
      .default("createdAt"),
    sortOrder: z.enum(["asc", "desc"]).optional().default("desc"),
    search: z.string().trim().min(1).optional()
  })
});

export const listClicksSchema = z.object({
  params: z.object({
    id: z.string().regex(/^\d+$/, { message: "id must be a positive integer" })
  }),
  query: z.object({
    page: pageSchema,
    limit: limitSchema
  })
});
