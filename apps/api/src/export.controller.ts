import { Controller, Get, Header } from "@nestjs/common";
import { prisma } from "@peb/database";

function clean(value?: string | null): string {
  return value?.trim() || "—";
}

@Controller("exports")
export class ExportController {
  @Get("markdown")
  @Header("Content-Type", "text/markdown; charset=utf-8")
  @Header(
    "Content-Disposition",
    'attachment; filename="personal-english-bank.md"'
  )
  async exportMarkdown(): Promise<string> {
    const items = await prisma.learningItem.findMany({
      where: { learningStatus: { not: "archived" } },
      include: {
        variants: { orderBy: { sortOrder: "asc" } },
        sources: {
          include: {
            source: { select: { title: true } },
            segment: { select: { startMs: true } }
          }
        },
        reviewSchedule: true,
        _count: { select: { reviewEvents: true, usageEvents: true } }
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }]
    });

    const sections = items.map((item) => {
      const variants = item.variants
        .map(
          (variant) =>
            `- **${variant.variantType.replaceAll("_", " ")}:** ${variant.content}`
        )
        .join("\n");
      const source = item.sources[0];
      return [
        `## ${item.title}`,
        "",
        `- **Status:** ${item.learningStatus}`,
        `- **Usage mode:** ${item.usageMode}`,
        `- **Chinese intention:** ${clean(item.chineseIntention)}`,
        `- **Original:** ${clean(item.originalText)}`,
        variants,
        `- **Source:** ${clean(source?.source.title)}`,
        `- **Reviews:** ${item._count.reviewEvents}`,
        `- **Real uses:** ${item._count.usageEvents}`,
        `- **Next review:** ${item.reviewSchedule?.nextReviewAt.toISOString() ?? "—"}`,
        ""
      ].join("\n");
    });

    return [
      "# Personal English Bank",
      "",
      `> Exported at ${new Date().toISOString()}`,
      "> Generated from the local SQL Server source of truth.",
      "",
      ...sections
    ].join("\n");
  }
}
