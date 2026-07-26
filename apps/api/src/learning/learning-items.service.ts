import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@peb/database";
import {
  createLearningItemSchema,
  scheduleFirstReview,
  updateLearningItemSchema,
  usageEventSchema,
  type CreateLearningItemInput,
  type UpdateLearningItemInput,
  type UsageEventInput,
} from "@peb/domain";

@Injectable()
export class LearningItemsService {
  list(query?: string) {
    return prisma.learningItem.findMany({
      where: query
        ? {
            OR: [
              { title: { contains: query } },
              { refinedEnglish: { contains: query } },
              { refinedChinese: { contains: query } },
              { mainIssue: { contains: query } },
              {
                sources: {
                  some: { source: { title: { contains: query } } },
                },
              },
            ],
          }
        : undefined,
      include: {
        variants: { orderBy: { sortOrder: "asc" } },
        reviewSchedule: true,
        sources: {
          include: {
            source: { select: { id: true, title: true } },
            segment: { select: { id: true, text: true, startMs: true } },
          },
        },
        _count: { select: { usageEvents: true, reviewEvents: true } },
      },
      orderBy: [{ priority: "desc" }, { createdAt: "desc" }],
    });
  }

  async get(id: string) {
    const item = await prisma.learningItem.findUnique({
      where: { id },
      include: {
        variants: { orderBy: { sortOrder: "asc" } },
        reviewSchedule: true,
        reviewEvents: { orderBy: { reviewedAt: "desc" } },
        usageEvents: { orderBy: { usedAt: "desc" } },
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
            segment: true,
          },
        },
      },
    });
    if (!item) throw new NotFoundException("Learning item not found.");
    return item;
  }

  async create(input: CreateLearningItemInput) {
    const parsed = createLearningItemSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid learning item.",
        issues: parsed.error.issues,
      });
    }
    const data = parsed.data;
    const segment = await prisma.transcriptSegment.findUnique({
      where: { id: data.segmentId },
      include: { transcript: { select: { sourceId: true } } },
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
          sourceTranslation: segment.translationText,
          refinedEnglish: data.easyActiveVersion,
          refinedChinese: data.refinedChinese,
          mainIssue: data.mainIssue,
          explanationCn: data.explanationCn,
          usageMode: data.usageMode,
          learningStatus: "ready",
          variants: {
            create: [
              {
                variantType: "easy_active",
                content: data.easyActiveVersion,
                sortOrder: 0,
              },
              ...(data.minimumCorrection
                ? [
                    {
                      variantType: "minimum_correction",
                      content: data.minimumCorrection,
                      sortOrder: 1,
                    },
                  ]
                : []),
              ...(data.naturalVersion
                ? [
                    {
                      variantType: "natural",
                      content: data.naturalVersion,
                      sortOrder: 2,
                    },
                  ]
                : []),
            ],
          },
          sources: {
            create: {
              sourceId: segment.transcript.sourceId,
              segmentId: segment.id,
              relationType: "derived_from",
            },
          },
          reviewSchedule: {
            create: {
              nextReviewAt: firstReview.nextReviewAt,
              intervalDays: firstReview.intervalDays,
              repetitions: firstReview.repetitions,
            },
          },
        },
        include: {
          variants: true,
          reviewSchedule: true,
          sources: true,
        },
      });

      await tx.source.update({
        where: { id: segment.transcript.sourceId },
        data: { processingStatus: "processed" },
      });
      return item;
    });
  }

  async update(id: string, input: UpdateLearningItemInput) {
    const parsed = updateLearningItemSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid learning item update.",
        issues: parsed.error.issues,
      });
    }
    const existing = await prisma.learningItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Learning item not found.");

    const data = parsed.data;
    return prisma.$transaction(async (tx) => {
      const item = await tx.learningItem.update({
        where: { id },
        data: {
          title: data.title,
          refinedEnglish: data.refinedEnglish,
          refinedChinese: data.refinedChinese,
          chineseIntention: data.chineseIntention,
          mainIssue: data.mainIssue,
          explanationCn: data.explanationCn,
          learningStatus: data.learningStatus,
          priority: data.priority,
        },
      });
      if (data.refinedEnglish) {
        await tx.learningItemVariant.upsert({
          where: {
            learningItemId_variantType: {
              learningItemId: id,
              variantType: "easy_active",
            },
          },
          update: { content: data.refinedEnglish },
          create: {
            learningItemId: id,
            variantType: "easy_active",
            content: data.refinedEnglish,
          },
        });
      }
      return item;
    });
  }

  async remove(id: string) {
    const existing = await prisma.learningItem.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Learning item not found.");
    await prisma.$transaction([
      prisma.reviewEvent.deleteMany({ where: { learningItemId: id } }),
      prisma.usageEvent.deleteMany({ where: { learningItemId: id } }),
      prisma.reviewSchedule.deleteMany({ where: { learningItemId: id } }),
      prisma.learningItemVariant.deleteMany({ where: { learningItemId: id } }),
      prisma.learningItemSource.deleteMany({ where: { learningItemId: id } }),
      prisma.learningItem.delete({ where: { id } }),
    ]);
    return { id, deleted: true };
  }

  async recordUsage(id: string, input: UsageEventInput) {
    const parsed = usageEventSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid usage event.",
        issues: parsed.error.issues,
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
          notes: data.notes,
        },
      });
      await tx.learningItem.update({
        where: { id },
        data: { lastUsedAt: usedAt },
      });
      return event;
    });
  }
}
