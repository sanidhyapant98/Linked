import { Request, Response } from "express";
import { createLink } from "../services/link.services";

export async function createLinkController(
  req: Request,
  res: Response
) {
  try {
    const { originalUrl } = req.body;

    if (!originalUrl) {
      return res.status(400).json({
        error: "originalUrl is required"
      });
    }

    try {
      new URL(originalUrl);
    } catch {
      return res.status(400).json({
        error: "Invalid URL"
      });
    }

    const link = await createLink(originalUrl);

    return res.status(201).json({
      id: link.id,
      shortCode: link.shortCode,
      originalUrl: link.originalUrl,
      createdAt: link.createdAt
    });
  } catch (error) {
    console.error("Failed to create link:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}