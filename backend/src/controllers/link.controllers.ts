import { Request, Response } from "express";
import { asyncHandler } from "../middlewares/asyncHandler.js";
import { NotFoundError } from "../lib/errors.js";
import { getSkipTake, buildPaginatedResult } from "../lib/pagination.js";
import {
  createLink,
  getLinkByShortCode,
  getAllLinks,
  getLinkById,
  updateLink,
  deleteLink,
  recordClick,
  getLinkAnalytics,
  getClicksForLink
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
  async (req: Request, res: Response) => {
    const {
      page = 1,
      limit = 20,
      sortBy = "createdAt",
      sortOrder = "desc",
      search
    } = req.query as unknown as {
      page?: number;
      limit?: number;
      sortBy?: "createdAt" | "clickCount" | "originalUrl";
      sortOrder?: "asc" | "desc";
      search?: string;
    };

    const { skip, take } = getSkipTake({ page, limit });

    const { data, totalItems } = await getAllLinks({
      skip,
      take,
      sortBy,
      sortOrder,
      search
    });

    return res.status(200).json(
      buildPaginatedResult(data, totalItems, { page, limit })
    );
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

    const updated = await updateLink(id, originalUrl);

    return res.status(200).json(updated);
  }
);

export const deleteLinkController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    await deleteLink(id);

    return res.status(204).send();
  }
);

export const getLinkAnalyticsController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);

    const link = await getLinkById(id);

    if (!link) {
      throw new NotFoundError("Link not found");
    }

    const analytics = await getLinkAnalytics(id);

    return res.status(200).json({
      id: link.id,
      shortCode: link.shortCode,
      originalUrl: link.originalUrl,
      ...analytics
    });
  }
);

export const getLinkClicksController = asyncHandler(
  async (req: Request, res: Response) => {
    const id = Number(req.params.id);
    const { page = 1, limit = 20 } = req.query as unknown as {
      page?: number;
      limit?: number;
    };

    const link = await getLinkById(id);

    if (!link) {
      throw new NotFoundError("Link not found");
    }

    const { skip, take } = getSkipTake({ page, limit });

    const { data, totalItems } = await getClicksForLink({
      linkId: id,
      skip,
      take
    });

    return res.status(200).json(
      buildPaginatedResult(data, totalItems, { page, limit })
    );
  }
);

export const redirectLinkController = asyncHandler(
  async (req: Request, res: Response) => {
    const { shortCode } = req.params;

    if (typeof shortCode !== "string") {
      throw new NotFoundError("Short link not found");
    }

    const link = await getLinkByShortCode(shortCode);

    if (!link) {
      throw new NotFoundError("Short link not found");
    }

    await recordClick(link.id, {
      ipAddress: req.ip,
      userAgent: req.get("user-agent"),
      referrer: req.get("referer")
    });

    return res.redirect(302, link.originalUrl);
  }
);