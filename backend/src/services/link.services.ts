import { prisma } from "../lib/prisma.js";
import crypto from "crypto";
import { Prisma } from "../generated/prisma/client.js";

function generateShortCode(length = 6): string {
  return crypto.randomBytes(length).toString("base64url").slice(0, length);
}

export async function createLink(originalUrl: string) {
  let shortCode = generateShortCode();

  while (await prisma.link.findUnique({ where: { shortCode } })) {
    shortCode = generateShortCode();
  }

  const link = await prisma.link.create({
    data: {
      originalUrl,
      shortCode
    }
  });

  return link;
}

export async function getLinkByShortCode(shortCode: string) {
  return prisma.link.findUnique({
    where: {
      shortCode
    }
  });
}

export interface ListLinksParams {
  skip: number;
  take: number;
  sortBy: "createdAt" | "clickCount" | "originalUrl";
  sortOrder: "asc" | "desc";
  search?: string;
}

export async function getAllLinks({
  skip = 0,
  take = 20,
  sortBy = "createdAt",
  sortOrder = "desc",
  search
}: Partial<ListLinksParams>) {
  const where: Prisma.LinkWhereInput = search
    ? {
        OR: [
          { originalUrl: { contains: search, mode: "insensitive" } },
          { shortCode: { contains: search, mode: "insensitive" } }
        ]
      }
    : {};

  const [data, totalItems] = await prisma.$transaction([
    prisma.link.findMany({
      where,
      skip,
      take,
      orderBy: { [sortBy]: sortOrder }
    }),
    prisma.link.count({ where })
  ]);

  return { data, totalItems };
}

export async function getLinkById(id: number) {
  return prisma.link.findUnique({
    where: {
      id
    }
  });
}

export async function updateLink(id: number, originalUrl: string) {
  return prisma.link.update({
    where: {
      id
    },
    data: {
      originalUrl
    }
  });
}

export async function deleteLink(id: number) {
  return prisma.link.delete({
    where: {
      id
    }
  });
}

export interface ClickMetadata {
  ipAddress?: string | null;
  userAgent?: string | null;
  referrer?: string | null;
}

export async function recordClick(linkId: number, metadata: ClickMetadata) {
  const [click] = await prisma.$transaction([
    prisma.click.create({
      data: {
        linkId,
        ipAddress: metadata.ipAddress ?? null,
        userAgent: metadata.userAgent ?? null,
        referrer: metadata.referrer ?? null
      }
    }),
    prisma.link.update({
      where: { id: linkId },
      data: { clickCount: { increment: 1 } }
    })
  ]);

  return click;
}

export interface ClicksByDay {
  day: string;
  count: number;
}

export async function getLinkAnalytics(linkId: number) {
  const [totalClicks, recentClicks, clicksByDay] = await Promise.all([
    prisma.click.count({ where: { linkId } }),

    prisma.click.findMany({
      where: { linkId },
      orderBy: { createdAt: "desc" },
      take: 10,
      select: {
        id: true,
        createdAt: true,
        referrer: true,
        userAgent: true
      }
    }),

    prisma.$queryRaw<ClicksByDay[]>`
      SELECT
        TO_CHAR(DATE_TRUNC('day', "createdAt"), 'YYYY-MM-DD') AS day,
        CAST(COUNT(*) AS INTEGER) AS count
      FROM "Click"
      WHERE "linkId" = ${linkId}
        AND "createdAt" >= NOW() - INTERVAL '30 days'
      GROUP BY 1
      ORDER BY 1 ASC
    `
  ]);

  return {
    totalClicks,
    recentClicks,
    clicksByDay
  };
}

export interface ListClicksParams {
  linkId: number;
  skip: number;
  take: number;
}

export async function getClicksForLink({ linkId, skip, take }: ListClicksParams) {
  const [data, totalItems] = await prisma.$transaction([
    prisma.click.findMany({
      where: { linkId },
      skip,
      take,
      orderBy: { createdAt: "desc" },
      select: {
        id: true,
        createdAt: true,
        referrer: true,
        userAgent: true,
        ipAddress: true
      }
    }),
    prisma.click.count({ where: { linkId } })
  ]);

  return { data, totalItems };
}
