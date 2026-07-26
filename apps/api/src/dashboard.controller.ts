import { Controller, Get } from "@nestjs/common";
import { prisma } from "@peb/database";

@Controller("dashboard")
export class DashboardController {
  @Get()
  async getDashboard() {
    const now = new Date();
    const [
      sources,
      unprocessedSources,
      learningItems,
      dueReviews,
      usageEvents,
    ] = await Promise.all([
      prisma.source.count(),
      prisma.source.count({
        where: { processingStatus: { not: "processed" } },
      }),
      prisma.learningItem.count({
        where: { learningStatus: { not: "archived" } },
      }),
      prisma.reviewSchedule.count({
        where: { suspended: false, nextReviewAt: { lte: now } },
      }),
      prisma.usageEvent.count(),
    ]);

    return {
      sources,
      unprocessedSources,
      learningItems,
      dueReviews,
      usageEvents,
      dailyReviewLimit: Number(process.env.DAILY_REVIEW_LIMIT ?? 10),
    };
  }
}
