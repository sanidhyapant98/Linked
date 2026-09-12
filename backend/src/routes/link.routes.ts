import { Router } from "express";
import {
  createLinkController,
  getAllLinksController,
  getLinkByIdController,
  updateLinkController,
  deleteLinkController
} from "../controllers/link.controllers.js";
import { validate } from "../middlewares/validate.js";
import {
  createLinkSchema,
  updateLinkSchema,
  idParamSchema
} from "../validators/link.validator.js";

const router = Router();

router.post("/", validate(createLinkSchema), createLinkController);
router.get("/", getAllLinksController);
router.get("/:id", validate(idParamSchema), getLinkByIdController);
router.put("/:id", validate(updateLinkSchema), updateLinkController);
router.delete("/:id", validate(idParamSchema), deleteLinkController);

export default router;