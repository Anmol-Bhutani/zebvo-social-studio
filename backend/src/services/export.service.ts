import PDFDocument from "pdfkit";
import archiver from "archiver";
import { prisma } from "../config/prisma";
import { ApiError } from "../utils/ApiError";
import type { Response } from "express";

export const exportService = {
  async getContent(userId: string, id: string) {
    const c = await prisma.content.findUnique({
      where: { id },
      include: { workspace: true },
    });
    if (!c || c.userId !== userId) throw ApiError.notFound("Content not found");
    return c;
  },

  async exportPdf(res: Response, userId: string, id: string) {
    const c = await this.getContent(userId, id);

    res.setHeader("Content-Type", "application/pdf");
    res.setHeader("Content-Disposition", `attachment; filename="${slug(c.title || c.type)}.pdf"`);

    const doc = new PDFDocument({ margin: 50, size: "A4" });
    doc.pipe(res);

    doc.fontSize(22).fillColor("#111").text(c.title || c.type, { underline: false });
    doc.moveDown(0.3);
    doc
      .fontSize(10)
      .fillColor("#666")
      .text(`Workspace: ${c.workspace.name}  •  Platform: ${c.platform}  •  Tone: ${c.tone}`);
    doc.text(`Generated: ${new Date(c.createdAt).toLocaleString()}`);
    doc.moveDown();
    doc.strokeColor("#ddd").lineWidth(1).moveTo(50, doc.y).lineTo(545, doc.y).stroke();
    doc.moveDown();
    doc.fontSize(12).fillColor("#222").text(c.body, { lineGap: 4 });

    if (c.metadata) {
      doc.moveDown();
      doc.fontSize(10).fillColor("#888").text("Structured Data:");
      doc.fontSize(10).fillColor("#444").text(c.metadata, { lineGap: 2 });
    }

    doc.end();
  },

  async exportMarkdown(res: Response, userId: string, id: string) {
    const c = await this.getContent(userId, id);
    const md = this.toMarkdown(c);
    res.setHeader("Content-Type", "text/markdown");
    res.setHeader("Content-Disposition", `attachment; filename="${slug(c.title || c.type)}.md"`);
    res.send(md);
  },

  async exportJson(res: Response, userId: string, id: string) {
    const c = await this.getContent(userId, id);
    res.setHeader("Content-Type", "application/json");
    res.setHeader("Content-Disposition", `attachment; filename="${slug(c.title || c.type)}.json"`);
    res.send(
      JSON.stringify(
        {
          id: c.id,
          title: c.title,
          type: c.type,
          platform: c.platform,
          tone: c.tone,
          body: c.body,
          metadata: c.metadata ? JSON.parse(c.metadata) : null,
          imageUrl: c.imageUrl,
          workspace: { id: c.workspace.id, name: c.workspace.name },
          createdAt: c.createdAt,
        },
        null,
        2,
      ),
    );
  },

  async exportWorkspaceZip(res: Response, userId: string, workspaceId: string) {
    const ws = await prisma.workspace.findUnique({
      where: { id: workspaceId },
      include: { contents: true },
    });
    if (!ws || ws.userId !== userId) throw ApiError.notFound("Workspace not found");

    res.setHeader("Content-Type", "application/zip");
    res.setHeader("Content-Disposition", `attachment; filename="${slug(ws.name)}-export.zip"`);

    const archive = archiver("zip", { zlib: { level: 9 } });
    archive.on("error", (err) => {
      console.error("[archiver-error]", err);
    });
    archive.pipe(res);

    // workspace manifest
    archive.append(
      JSON.stringify(
        {
          workspace: {
            id: ws.id,
            name: ws.name,
            description: ws.description,
            targetAudience: ws.targetAudience,
            industry: ws.industry,
            brandVoice: ws.brandVoice,
          },
          exportedAt: new Date().toISOString(),
          itemCount: ws.contents.length,
        },
        null,
        2,
      ),
      { name: "workspace.json" },
    );

    for (const c of ws.contents) {
      const base = `${slug(c.type)}_${c.id.slice(0, 6)}`;
      archive.append(this.toMarkdown({ ...c, workspace: ws }), { name: `markdown/${base}.md` });
      archive.append(
        JSON.stringify(
          {
            id: c.id,
            title: c.title,
            type: c.type,
            platform: c.platform,
            tone: c.tone,
            body: c.body,
            metadata: c.metadata ? JSON.parse(c.metadata) : null,
            createdAt: c.createdAt,
          },
          null,
          2,
        ),
        { name: `json/${base}.json` },
      );
    }

    archive.finalize();
  },

  toMarkdown(c: {
    title: string | null;
    type: string;
    platform: string;
    tone: string;
    body: string;
    metadata: string | null;
    imageUrl: string | null;
    createdAt: Date;
    workspace: { name: string };
  }): string {
    const lines: string[] = [];
    lines.push(`# ${c.title || c.type}`);
    lines.push("");
    lines.push(`> Workspace: **${c.workspace.name}**  •  Platform: \`${c.platform}\`  •  Tone: \`${c.tone}\`  •  Type: \`${c.type}\``);
    lines.push(`> Generated: ${new Date(c.createdAt).toISOString()}`);
    lines.push("");
    lines.push("---");
    lines.push("");
    lines.push(c.body);
    if (c.metadata) {
      lines.push("");
      lines.push("## Structured Output");
      lines.push("");
      lines.push("```json");
      lines.push(c.metadata);
      lines.push("```");
    }
    if (c.imageUrl) {
      lines.push("");
      lines.push("## Image");
      lines.push("");
      lines.push(`![generated](${c.imageUrl.startsWith("data:") ? c.imageUrl.slice(0, 80) + "...(base64 truncated)" : c.imageUrl})`);
    }
    return lines.join("\n");
  },
};

function slug(s: string): string {
  return s
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "")
    .slice(0, 60) || "content";
}
