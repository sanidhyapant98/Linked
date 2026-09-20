import { config } from "dotenv";
import path from "node:path";
import { afterAll } from "vitest";

// Load .env.test BEFORE anything else in this file (or the test file that
// follows it) imports lib/prisma.ts, so Prisma connects to the test DB.
// dotenv does not override already-set variables, so this must run first.
config({
  path: path.resolve(process.cwd(), ".env.test"),
  override: true
});

afterAll(async () => {
  const { prisma } = await import("../lib/prisma.js");
  await prisma.$disconnect();
});
