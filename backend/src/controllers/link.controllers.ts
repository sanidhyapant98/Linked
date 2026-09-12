import { Request, Response } from "express";
import { createLink, getLinkByShortCode } from "../services/link.services";

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

export async function redirectLinkController(
  req: Request,
  res: Response
) {
  try {
    const { shortCode } = req.params;

    if (typeof shortCode !== "string") {
      return res.status(404).json({
        error: "Short link not found"
      });
    }

    const link = await getLinkByShortCode(shortCode);

    if (!link) {
      return res.status(404).json({
        error: "Short link not found"
      });
    }

    return res.redirect(302, link.originalUrl);
  } catch (error) {
    console.error("Failed to redirect:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}