import { prisma } from "../lib/prisma.js";

export async function resetDb() {
  // Order matters: Click has a FK to Link.
  await prisma.click.deleteMany();
  await prisma.link.deleteMany();
}

export async function createTestLink(originalUrl = "https://example.com") {
  return prisma.link.create({
    data: {
      originalUrl,
      shortCode: `t${Math.random().toString(36).slice(2, 8)}`
    }
  });
}
