import { Router } from "express";
import { contentController } from "../controllers/content.controller";
import { authRequired } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const contentRoutes = Router();

contentRoutes.use(authRequired);

contentRoutes.get("/", asyncHandler(contentController.list));
contentRoutes.post("/generate", asyncHandler(contentController.generate));
contentRoutes.post("/generate/stream", asyncHandler(contentController.generateStream));
contentRoutes.get("/:id", asyncHandler(contentController.get));
contentRoutes.patch("/:id", asyncHandler(contentController.update));
contentRoutes.delete("/:id", asyncHandler(contentController.remove));
contentRoutes.post("/:id/regenerate", asyncHandler(contentController.regenerate));
