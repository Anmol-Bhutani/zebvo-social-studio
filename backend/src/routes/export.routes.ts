import { Router } from "express";
import { exportController } from "../controllers/export.controller";
import { authRequired } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const exportRoutes = Router();

exportRoutes.use(authRequired);

exportRoutes.get("/content/:id", asyncHandler(exportController.exportContent));
exportRoutes.get("/workspace/:id", asyncHandler(exportController.exportWorkspace));
