import { Router } from "express";
import { createLinkController } from "../controllers/link.controllers";

const router = Router();

router.post("/", createLinkController);

export default router;