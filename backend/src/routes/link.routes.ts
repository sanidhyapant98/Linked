import { Router } from "express";
import {
  createLinkController,
  getAllLinksController,
  getLinkByIdController,
  updateLinkController,
  deleteLinkController
} from "../controllers/link.controllers";

const router = Router();

router.post("/", createLinkController);
router.get("/", getAllLinksController);
router.get("/:id", getLinkByIdController);
router.put("/:id", updateLinkController);
router.delete("/:id", deleteLinkController);

export default router;