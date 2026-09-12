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

export async function incrementClickCount(id: number) {
  return prisma.link.update({
    where: {
      id
    },
    data: {
      clickCount: {
        increment: 1
      }
    }
  });
}