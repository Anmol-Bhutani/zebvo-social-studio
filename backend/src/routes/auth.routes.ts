import { Router } from "express";
import { authController } from "../controllers/auth.controller";
import { authRequired } from "../middleware/auth";
import { asyncHandler } from "../utils/asyncHandler";

export const authRoutes = Router();

authRoutes.post("/register", asyncHandler(authController.register));
authRoutes.post("/login", asyncHandler(authController.login));
authRoutes.post("/logout", asyncHandler(authController.logout));
authRoutes.get("/me", authRequired, asyncHandler(authController.me));
