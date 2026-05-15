import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

export interface WorkspaceInput {
  name: string;
  description?: string;
  targetAudience?: string;
  industry?: string;
  brandVoice?: string;
  colorTheme?: string;
}

export const workspaceService = {
  async list(userId: string) {
    return prisma.workspace.findMany({
      where: { userId },
      orderBy: { createdAt: "desc" },
      include: {
        _count: { select: { contents: true, schedules: true } },
      },
    });
  },

  async get(userId: string, id: string) {
    const ws = await prisma.workspace.findUnique({
      where: { id },
      include: { _count: { select: { contents: true, schedules: true } } },
    });
    if (!ws || ws.userId !== userId) throw ApiError.notFound("Workspace not found");
    return ws;
  },

  async create(userId: string, data: WorkspaceInput) {
    return prisma.workspace.create({
      data: { ...data, userId },
    });
  },

  async update(userId: string, id: string, data: Partial<WorkspaceInput>) {
    await this.get(userId, id);
    return prisma.workspace.update({ where: { id }, data });
  },

  async remove(userId: string, id: string) {
    await this.get(userId, id);
    await prisma.workspace.delete({ where: { id } });
    return { ok: true };
  },
};
