import express from "express";
import dotenv from "dotenv";
import { prisma } from "./lib/prisma.js";
import linkRoutes from "./routes/link.routes.js";

dotenv.config();

const app = express();

app.use(express.json());

const PORT = process.env.PORT || 3000;

app.use("/api/links", linkRoutes);

app.get("/health", async (_req, res) => {
  try {
    await prisma.$queryRaw`SELECT 1`;

    res.status(200).json({
      status: "ok",
      database: "connected"
    });
  } catch (error) {
    console.error("Database health check failed:", error);

    res.status(503).json({
      status: "error",
      database: "disconnected"
    });
  }
});

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