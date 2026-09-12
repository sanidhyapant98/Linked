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