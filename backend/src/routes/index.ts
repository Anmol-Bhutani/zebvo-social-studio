import "../types/express-augment";
import { Router } from "express";
import { authRoutes } from "./auth.routes";
import { workspaceRoutes } from "./workspace.routes";
import { contentRoutes } from "./content.routes";
import { scheduleRoutes } from "./schedule.routes";
import { templateRoutes } from "./template.routes";
import { exportRoutes } from "./export.routes";

export const apiRouter = Router();

apiRouter.use("/auth", authRoutes);
apiRouter.use("/workspaces", workspaceRoutes);
apiRouter.use("/contents", contentRoutes);
apiRouter.use("/schedules", scheduleRoutes);
apiRouter.use("/templates", templateRoutes);
apiRouter.use("/export", exportRoutes);

apiRouter.get("/health", (_req, res) => {
  res.json({ ok: true, service: "zebvo-api", time: new Date().toISOString() });
});
