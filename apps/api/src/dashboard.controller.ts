import { Controller, Get } from "@nestjs/common";
import { prisma } from "@peb/database";

@Controller("dashboard")
export class DashboardController {
  @Get()
  async getDashboard() {
    const now = new Date();
    const [sources, curatedSources, learningItems, dueReviews, usageEvents] =
      await Promise.all([
        prisma.source.count({ where: { processingStatus: "processed" } }),
        prisma.source.count({ where: { processingStatus: "processed" } }),
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
      curatedSources,
      learningItems,
      dueReviews,
      usageEvents,
      dailyReviewLimit: Number(process.env.DAILY_REVIEW_LIMIT ?? 10),
    };
  }
}
