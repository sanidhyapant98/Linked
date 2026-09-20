import dotenv from "dotenv";
import { prisma } from "./lib/prisma.js";
import { app } from "./app.js";

dotenv.config();

const PORT = process.env.PORT || 3000;

async function startServer() {
  try {
    await prisma.$connect();

    console.log("Database connected successfully");

    app.listen(PORT, () => {
      console.log(`Server running on http://localhost:${PORT}`);
    });
  } catch (error) {
    console.error("Database connection failed:", error);
    process.exit(1);
  }
}

startServer();