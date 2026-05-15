import type { Request, Response } from "express";
import { exportService } from "../services/export.service";
import { ApiError } from "../utils/ApiError";

export const exportController = {
  async exportContent(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    const format = (req.query.format as string) || "pdf";
    const id = req.params.id;

    if (format === "pdf") return exportService.exportPdf(res, req.user.id, id);
    if (format === "md") return exportService.exportMarkdown(res, req.user.id, id);
    if (format === "json") return exportService.exportJson(res, req.user.id, id);
    throw ApiError.badRequest("format must be one of pdf | md | json");
  },

  async exportWorkspace(req: Request, res: Response) {
    if (!req.user) throw ApiError.unauthorized();
    return exportService.exportWorkspaceZip(res, req.user.id, req.params.id);
  },
};
