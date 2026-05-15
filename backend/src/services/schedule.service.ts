import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";

export interface ScheduleInput {
  workspaceId: string;
  contentId: string;
  scheduledAt: string | Date;
  note?: string;
}

export const scheduleService = {
  async list(userId: string, workspaceId?: string) {
    return prisma.schedule.findMany({
      where: {
        userId,
        ...(workspaceId ? { workspaceId } : {}),
      },
      orderBy: { scheduledAt: "asc" },
      include: {
        content: { select: { id: true, title: true, type: true, platform: true, body: true, imageUrl: true } },
        workspace: { select: { id: true, name: true } },
      },
    });
  },

  async create(userId: string, data: ScheduleInput) {
    const [content, workspace] = await Promise.all([
      prisma.content.findUnique({ where: { id: data.contentId } }),
      prisma.workspace.findUnique({ where: { id: data.workspaceId } }),
    ]);
    if (!content || content.userId !== userId) throw ApiError.notFound("Content not found");
    if (!workspace || workspace.userId !== userId) throw ApiError.notFound("Workspace not found");

    const schedule = await prisma.schedule.create({
      data: {
        userId,
        workspaceId: workspace.id,
        contentId: content.id,
        scheduledAt: new Date(data.scheduledAt),
        note: data.note,
      },
      include: {
        content: { select: { id: true, title: true, type: true, platform: true, body: true, imageUrl: true } },
        workspace: { select: { id: true, name: true } },
      },
    });

    await prisma.content.update({ where: { id: content.id }, data: { status: "scheduled" } });
    return schedule;
  },

  async update(userId: string, id: string, data: { scheduledAt?: string | Date; note?: string; status?: string }) {
    const existing = await prisma.schedule.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) throw ApiError.notFound("Schedule not found");

    return prisma.schedule.update({
      where: { id },
      data: {
        ...(data.scheduledAt ? { scheduledAt: new Date(data.scheduledAt) } : {}),
        ...(data.note !== undefined ? { note: data.note } : {}),
        ...(data.status ? { status: data.status } : {}),
      },
      include: {
        content: { select: { id: true, title: true, type: true, platform: true, body: true, imageUrl: true } },
        workspace: { select: { id: true, name: true } },
      },
    });
  },

  async remove(userId: string, id: string) {
    const existing = await prisma.schedule.findUnique({ where: { id } });
    if (!existing || existing.userId !== userId) throw ApiError.notFound("Schedule not found");
    await prisma.schedule.delete({ where: { id } });
    return { ok: true };
  },
};
