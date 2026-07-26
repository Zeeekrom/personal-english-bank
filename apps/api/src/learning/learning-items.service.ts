import {
  BadRequestException,
  Injectable,
  NotFoundException
} from "@nestjs/common";
import { prisma } from "@peb/database";
import {
  createLearningItemSchema,
  scheduleFirstReview,
  usageEventSchema,
  type CreateLearningItemInput,
  type UsageEventInput
} from "@peb/domain";

@Injectable()
export class LearningItemsService {
  list() {
    return prisma.learningItem.findMany({
      include: {
        variants: { orderBy: { sortOrder: "asc" } },
        reviewSchedule: true,
        sources: {
          include: {
            source: { select: { id: true, title: true } },
            segment: { select: { id: true, text: true, startMs: true } }
          }
        },
        _count: { select: { usageEvents: true, reviewEvents: true } }
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }]
    });
  }

  async create(input: CreateLearningItemInput) {
    const parsed = createLearningItemSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid learning item.",
        issues: parsed.error.issues
      });
    }
    const data = parsed.data;
    const segment = await prisma.transcriptSegment.findUnique({
      where: { id: data.segmentId },
      include: { transcript: { select: { sourceId: true } } }
    });
    if (!segment) throw new NotFoundException("Source segment not found.");

    const firstReview = scheduleFirstReview();
    return prisma.$transaction(async (tx) => {
      const item = await tx.learningItem.create({
        data: {
          title: data.title,
          itemType: data.itemType,
          chineseIntention: data.chineseIntention,
          originalText: segment.text,
          explanationCn: data.explanationCn,
          usageMode: data.usageMode,
          learningStatus: "ready",
          variants: {
            create: [
              {
                variantType: "easy_active",
                content: data.easyActiveVersion,
                sortOrder: 0
              },
              ...(data.minimumCorrection
                ? [
                    {
                      variantType: "minimum_correction",
                      content: data.minimumCorrection,
                      sortOrder: 1
                    }
                  ]
                : []),
              ...(data.naturalVersion
                ? [
                    {
                      variantType: "natural",
                      content: data.naturalVersion,
                      sortOrder: 2
                    }
                  ]
                : [])
            ]
          },
          sources: {
            create: {
              sourceId: segment.transcript.sourceId,
              segmentId: segment.id,
              relationType: "derived_from"
            }
          },
          reviewSchedule: {
            create: {
              nextReviewAt: firstReview.nextReviewAt,
              intervalDays: firstReview.intervalDays,
              repetitions: firstReview.repetitions
            }
          }
        },
        include: {
          variants: true,
          reviewSchedule: true,
          sources: true
        }
      });

      await tx.source.update({
        where: { id: segment.transcript.sourceId },
        data: { processingStatus: "processed" }
      });
      return item;
    });
  }

  async recordUsage(id: string, input: UsageEventInput) {
    const parsed = usageEventSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid usage event.",
        issues: parsed.error.issues
      });
    }
    const data = parsed.data;
    const item = await prisma.learningItem.findUnique({ where: { id } });
    if (!item) throw new NotFoundException("Learning item not found.");

    const usedAt = data.usedAt ?? new Date();
    return prisma.$transaction(async (tx) => {
      const event = await tx.usageEvent.create({
        data: {
          learningItemId: id,
          usedAt,
          scenario: data.scenario,
          outcome: data.outcome,
          notes: data.notes
        }
      });
      await tx.learningItem.update({
        where: { id },
        data: { lastUsedAt: usedAt }
      });
      return event;
    });
  }
}
