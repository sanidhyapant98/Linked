import { Request, Response } from "express";
import {
  createLink,
  getLinkByShortCode,
  getAllLinks,
  getLinkById,
  updateLink,
  deleteLink,
  incrementClickCount
} from "../services/link.services.js";

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

export async function getAllLinksController(
  _req: Request,
  res: Response
) {
  try {
    const links = await getAllLinks();

    return res.status(200).json(links);
  } catch (error) {
    console.error("Failed to fetch links:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}

export async function getLinkByIdController(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid id"
      });
    }

    const link = await getLinkById(id);

    if (!link) {
      return res.status(404).json({
        error: "Link not found"
      });
    }

    return res.status(200).json(link);
  } catch (error) {
    console.error("Failed to fetch link:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}

export async function updateLinkController(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid id"
      });
    }

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

    const existing = await getLinkById(id);

    if (!existing) {
      return res.status(404).json({
        error: "Link not found"
      });
    }

    const updated = await updateLink(id, originalUrl);

    return res.status(200).json(updated);
  } catch (error) {
    console.error("Failed to update link:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}

export async function deleteLinkController(
  req: Request,
  res: Response
) {
  try {
    const id = Number(req.params.id);

    if (!Number.isInteger(id) || id <= 0) {
      return res.status(400).json({
        error: "Invalid id"
      });
    }

    const existing = await getLinkById(id);

    if (!existing) {
      return res.status(404).json({
        error: "Link not found"
      });
    }

    await deleteLink(id);

    return res.status(204).send();
  } catch (error) {
    console.error("Failed to delete link:", error);

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
      return res.status(400).json({
        error: "Invalid short code"
      });
    }

    const link = await getLinkByShortCode(shortCode);

    if (!link) {
      return res.status(404).json({
        error: "Short link not found"
      });
    }

    await incrementClickCount(link.id);

    return res.redirect(302, link.originalUrl);
  } catch (error) {
    console.error("Failed to redirect:", error);

    return res.status(500).json({
      error: "Internal server error"
    });
  }
}