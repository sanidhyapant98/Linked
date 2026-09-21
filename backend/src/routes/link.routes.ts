import { Router } from "express";
import {
  createLinkController,
  getAllLinksController,
  getLinkByIdController,
  updateLinkController,
  deleteLinkController,
  getLinkAnalyticsController,
  getLinkClicksController
} from "../controllers/link.controllers.js";
import { validate } from "../middlewares/validate.js";
import {
  createLinkSchema,
  updateLinkSchema,
  idParamSchema,
  listLinksSchema,
  listClicksSchema
} from "../validators/link.validator.js";

const router = Router();

router.post("/", validate(createLinkSchema), createLinkController);
router.get("/", validate(listLinksSchema), getAllLinksController);
router.get("/:id", validate(idParamSchema), getLinkByIdController);
router.get("/:id/analytics", validate(idParamSchema), getLinkAnalyticsController);
router.get("/:id/clicks", validate(listClicksSchema), getLinkClicksController);
router.put("/:id", validate(updateLinkSchema), updateLinkController);
router.delete("/:id", validate(idParamSchema), deleteLinkController);

export default router;
