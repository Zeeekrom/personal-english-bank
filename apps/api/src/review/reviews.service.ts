import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@peb/database";
import {
  applyReviewRating,
  reviewSubmissionSchema,
  type ReviewSubmission,
} from "@peb/domain";

@Injectable()
export class ReviewsService {
  due() {
    const limit = Math.max(
      1,
      Math.min(50, Number(process.env.DAILY_REVIEW_LIMIT ?? 10)),
    );
    return prisma.reviewSchedule.findMany({
      where: {
        suspended: false,
        nextReviewAt: { lte: new Date() },
        learningItem: { learningStatus: { not: "archived" } },
      },
      include: {
        learningItem: {
          include: {
            variants: { orderBy: { sortOrder: "asc" } },
            sources: {
              include: {
                source: {
                  select: {
                    id: true,
                    title: true,
                    capturedAt: true,
                    summaryCn: true,
                  },
                },
                segment: {
                  select: {
                    id: true,
                    text: true,
                    translationText: true,
                    startMs: true,
                  },
                },
              },
            },
          },
        },
      },
      orderBy: [
        { nextReviewAt: "asc" },
        { learningItem: { priority: "desc" } },
      ],
      take: limit,
    });
  }

  async submit(learningItemId: string, input: ReviewSubmission) {
    return this.submitWithMode(learningItemId, input, "rated");
  }

  complete(
    learningItemId: string,
    input: { responseText?: string; notes?: string },
  ) {
    return this.submitWithMode(
      learningItemId,
      {
        rating: "good",
        responseText: input.responseText,
        notes: input.notes,
      },
      input.responseText ? "voice_transcript" : "manual_complete",
    );
  }

  private async submitWithMode(
    learningItemId: string,
    input: ReviewSubmission,
    completionMode: string,
  ) {
    const parsed = reviewSubmissionSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid review submission.",
        issues: parsed.error.issues,
      });
    }
    const data = parsed.data;
    const schedule = await prisma.reviewSchedule.findUnique({
      where: { learningItemId },
      include: { learningItem: true },
    });
    if (!schedule) throw new NotFoundException("Review schedule not found.");

    const result = applyReviewRating(
      {
        repetitions: schedule.repetitions,
        intervalDays: schedule.intervalDays,
        learningStatus: schedule.learningItem.learningStatus,
      },
      data.rating,
    );

    return prisma.$transaction(async (tx) => {
      const previousStatus = schedule.learningItem.learningStatus;
      await tx.learningItem.update({
        where: { id: learningItemId },
        data: { learningStatus: result.learningStatus },
      });
      await tx.reviewSchedule.update({
        where: { learningItemId },
        data: {
          repetitions: result.repetitions,
          intervalDays: result.intervalDays,
          nextReviewAt: result.nextReviewAt,
        },
      });
      return tx.reviewEvent.create({
        data: {
          learningItemId,
          rating: data.rating,
          responseText: data.responseText,
          notes: data.notes,
          previousStatus,
          newStatus: result.learningStatus,
          nextReviewAt: result.nextReviewAt,
          intervalDays: result.intervalDays,
          completionMode,
        },
      });
    });
  }
}
