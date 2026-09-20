import { prisma } from "../lib/prisma.js";
import crypto from "crypto";

function generateShortCode(length = 6): string {
  return crypto
    .randomBytes(length)
    .toString("base64url")
    .slice(0, length);
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

export async function getAllLinks() {
  return prisma.link.findMany({
    orderBy: {
      createdAt: "desc"
    }
  });
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
  // Atomic: write the event AND bump the denormalized counter together,
  // so they never drift out of sync even if one write fails.
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