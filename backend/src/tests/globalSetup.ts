import { execSync } from "node:child_process";
import path from "node:path";
import { config } from "dotenv";

export default async function globalSetup() {
  const { parsed } = config({
    path: path.resolve(process.cwd(), ".env.test")
  });

  if (!parsed?.DATABASE_URL) {
    throw new Error(
      "Missing DATABASE_URL in backend/.env.test — copy .env.test.example and fill it in."
    );
  }

  execSync("npx prisma migrate deploy", {
    stdio: "inherit",
    cwd: process.cwd(),
    env: { ...process.env, ...parsed }
  });
}
