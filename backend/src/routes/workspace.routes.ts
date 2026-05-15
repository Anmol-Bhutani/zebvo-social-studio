import { Router } from "express";
import { workspaceController } from "../controllers/workspace.controller";
import { authRequired } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const workspaceRoutes = Router();

workspaceRoutes.use(authRequired);

workspaceRoutes.get("/", asyncHandler(workspaceController.list));
workspaceRoutes.post("/", asyncHandler(workspaceController.create));
workspaceRoutes.get("/:id", asyncHandler(workspaceController.get));
workspaceRoutes.patch("/:id", asyncHandler(workspaceController.update));
workspaceRoutes.delete("/:id", asyncHandler(workspaceController.remove));
