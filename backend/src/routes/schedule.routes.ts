import { Router } from "express";
import { scheduleController } from "../controllers/schedule.controller";
import { authRequired } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const scheduleRoutes = Router();

scheduleRoutes.use(authRequired);

scheduleRoutes.get("/", asyncHandler(scheduleController.list));
scheduleRoutes.post("/", asyncHandler(scheduleController.create));
scheduleRoutes.patch("/:id", asyncHandler(scheduleController.update));
scheduleRoutes.delete("/:id", asyncHandler(scheduleController.remove));
