import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

export interface TemplateInput {
  workspaceId?: string;
  name: string;
  description?: string;
  contentType: string;
  platform: string;
  tone: string;
  promptBody: string;
}

export const templateService = {
  async list(userId: string, workspaceId?: string) {
    return prisma.promptTemplate.findMany({
      where: {
        userId,
        ...(workspaceId ? { OR: [{ workspaceId }, { workspaceId: null }] } : {}),
      },
      orderBy: { createdAt: "desc" },
    });
  },

  async create(userId: string, data: TemplateInput) {
    return prisma.promptTemplate.create({ data: { ...data, userId } });
  },

  async update(userId: string, id: string, data: Partial<TemplateInput>) {
    const existing = await prisma.promptTemplate.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) throw ApiError.notFound("Template not found");
    return prisma.promptTemplate.update({ where: { id }, data });
  },

  async remove(userId: string, id: string) {
    const existing = await prisma.promptTemplate.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) throw ApiError.notFound("Template not found");
    await prisma.promptTemplate.delete({ where: { id } });
    return { ok: true };
  },
};
