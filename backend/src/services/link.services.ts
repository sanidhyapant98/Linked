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

  // Make sure the generated code isn't already being used
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

