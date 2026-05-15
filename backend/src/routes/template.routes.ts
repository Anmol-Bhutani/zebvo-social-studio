import { Router } from "express";
import { templateController } from "../controllers/template.controller";
import { authRequired } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const templateRoutes = Router();

templateRoutes.use(authRequired);

templateRoutes.get("/", asyncHandler(templateController.list));
templateRoutes.post("/", asyncHandler(templateController.create));
templateRoutes.patch("/:id", asyncHandler(templateController.update));
templateRoutes.delete("/:id", asyncHandler(templateController.remove));
