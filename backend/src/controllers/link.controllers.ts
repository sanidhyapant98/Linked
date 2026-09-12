import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { NotFoundError } from "../lib/errors.js";
import {
  createLink,
  getLinkByShortCode,
  getAllLinks,
  getLinkById,
  updateLink,
  deleteLink,
  incrementClickCount
} from "../services/link.services.js";

export const createLinkController = asyncHandler(
  async (req: Request, res: Response) => {
    const { originalUrl } = req.body;

    const link = await createLink(originalUrl);

    return res.status(201).json({
      id: link.id,
      shortCode: link.shortCode,
      originalUrl: link.originalUrl,
      createdAt: link.createdAt
    });
  }
);

export const getAllLinksController = asyncHandler(
  async (_req: Request, res: Response) => {
    const links = await getAllLinks();

    return res.status(200).json(links);
  }
);

export const getLinkByIdController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const link = await getLinkById(id);

    if (!link) {
      throw new NotFoundError("Link not found");
    }

    return res.status(200).json(link);
  }
);

export const updateLinkController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { originalUrl } = req.body;

    // Prisma throws P2025 (translated to 404 by errorHandler) if it doesn't exist
    const updated = await updateLink(id, originalUrl);

    return res.status(200).json(updated);
  }
);

export const deleteLinkController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    // Prisma throws P2025 (translated to 404 by errorHandler) if it doesn't exist
    await deleteLink(id);

    return res.status(204).send();
  }
);

export const redirectLinkController = asyncHandler(
  async (req: Request, res: Response) => {
    const shortCode = Array.isArray(req.params.shortCode)
      ? req.params.shortCode[0]
      : req.params.shortCode;

    const link = await getLinkByShortCode(shortCode);

    if (!link) {
      throw new NotFoundError("Short link not found");
    }

    await incrementClickCount(link.id);

    return res.redirect(302, link.originalUrl);
  }
);