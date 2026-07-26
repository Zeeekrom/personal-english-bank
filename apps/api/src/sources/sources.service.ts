import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from "@nestjs/common";
import { prisma } from "@peb/database";
import { updateSourceSchema, type UpdateSourceInput } from "@peb/domain";

@Injectable()
export class SourcesService {
  async list(query?: string) {
    const sources = await prisma.source.findMany({
      where: {
        processingStatus: "processed",
        ...(query
          ? {
              OR: [
                { title: { contains: query } },
                {
                  transcripts: {
                    some: {
                      segments: {
                        some: {
                          OR: [
                            { text: { contains: query } },
                            { translationText: { contains: query } },
                          ],
                        },
                      },
                    },
                  },
                },
                { summaryCn: { contains: query } },
              ],
            }
          : {}),
      },
      include: {
        _count: { select: { transcripts: true, learningLinks: true } },
        assets: { select: { relativePath: true, byteSize: true } },
      },
      orderBy: [{ processingPriority: "desc" }, { importedAt: "desc" }],
    });
    return sources.map((source) => ({
      ...source,
      assets: source.assets.map((asset) => ({
        ...asset,
        byteSize: Number(asset.byteSize),
      })),
    }));
  }

  async get(id: string) {
    const source = await prisma.source.findUnique({
      where: { id },
      include: {
        assets: true,
        transcripts: {
          where: { isCurrent: true },
          include: {
            speakerMaps: { include: { speaker: true } },
            segments: {
              include: { speaker: true },
              orderBy: { segmentIndex: "asc" },
            },
          },
        },
        interactionLogs: { orderBy: { createdAt: "desc" } },
        learningLinks: {
          include: {
            learningItem: {
              select: {
                id: true,
                refinedEnglish: true,
                refinedChinese: true,
                mainIssue: true,
                learningStatus: true,
              },
            },
          },
        },
      },
    });
    if (!source) throw new NotFoundException("Source not found.");
    return {
      ...source,
      assets: source.assets.map((asset) => ({
        ...asset,
        byteSize: Number(asset.byteSize),
      })),
    };
  }

  async update(id: string, input: UpdateSourceInput) {
    const parsed = updateSourceSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid source update.",
        issues: parsed.error.issues,
      });
    }
    const existing = await prisma.source.findUnique({ where: { id } });
    if (!existing) throw new NotFoundException("Source not found.");
    return prisma.source.update({ where: { id }, data: parsed.data });
  }

  async remove(id: string) {
    const source = await prisma.source.findUnique({
      where: { id },
      include: {
        transcripts: { select: { id: true } },
        learningLinks: { select: { learningItemId: true } },
      },
    });
    if (!source) throw new NotFoundException("Source not found.");

    const transcriptIds = source.transcripts.map((item) => item.id);
    const learningItemIds = [
      ...new Set(source.learningLinks.map((item) => item.learningItemId)),
    ];
    const orphanIds: string[] = [];
    for (const learningItemId of learningItemIds) {
      const otherSources = await prisma.learningItemSource.count({
        where: { learningItemId, sourceId: { not: id } },
      });
      if (otherSources === 0) orphanIds.push(learningItemId);
    }

    await prisma.$transaction(async (tx) => {
      if (orphanIds.length > 0) {
        await tx.reviewEvent.deleteMany({
          where: { learningItemId: { in: orphanIds } },
        });
        await tx.reviewSchedule.deleteMany({
          where: { learningItemId: { in: orphanIds } },
        });
        await tx.learningItemVariant.deleteMany({
          where: { learningItemId: { in: orphanIds } },
        });
      }
      await tx.usageEvent.deleteMany({
        where: {
          OR: [
            { sourceId: id },
            ...(orphanIds.length > 0
              ? [{ learningItemId: { in: orphanIds } }]
              : []),
          ],
        },
      });
      await tx.learningItemSource.deleteMany({ where: { sourceId: id } });
      if (orphanIds.length > 0) {
        await tx.learningItem.deleteMany({ where: { id: { in: orphanIds } } });
      }
      await tx.interactionLog.deleteMany({ where: { sourceId: id } });
      if (transcriptIds.length > 0) {
        await tx.transcriptSpeaker.deleteMany({
          where: { transcriptId: { in: transcriptIds } },
        });
        await tx.transcriptSegment.deleteMany({
          where: { transcriptId: { in: transcriptIds } },
        });
        await tx.transcript.deleteMany({
          where: { id: { in: transcriptIds } },
        });
      }
      await tx.sourceAsset.deleteMany({ where: { sourceId: id } });
      await tx.source.delete({ where: { id } });
    });

    return { id, deleted: true, deletedLearningItems: orphanIds.length };
  }

  async assignSpeaker(
    segmentId: string,
    input: {
      displayName: string;
      role?: string;
      isMe?: boolean;
      applyToDiarizationKey?: boolean;
    },
  ) {
    const segment = await prisma.transcriptSegment.findUnique({
      where: { id: segmentId },
    });
    if (!segment) throw new NotFoundException("Segment not found.");

    return prisma.$transaction(async (tx) => {
      let speaker = input.isMe
        ? await tx.speaker.findFirst({ where: { isMe: true } })
        : undefined;
      speaker ??= await tx.speaker.create({
        data: {
          displayName: input.displayName.trim(),
          role: input.role ?? (input.isMe ? "evan" : "unknown"),
          isMe: input.isMe ?? false,
        },
      });

      const where =
        input.applyToDiarizationKey && segment.diarizationKey
          ? {
              transcriptId: segment.transcriptId,
              diarizationKey: segment.diarizationKey,
            }
          : { id: segment.id };

      await tx.transcriptSegment.updateMany({
        where,
        data: { speakerId: speaker.id, manuallyVerified: true },
      });

      if (input.applyToDiarizationKey && segment.diarizationKey) {
        await tx.transcriptSpeaker.updateMany({
          where: {
            transcriptId: segment.transcriptId,
            diarizationKey: segment.diarizationKey,
          },
          data: { speakerId: speaker.id, manuallyMapped: true },
        });
      }
      return speaker;
    });
  }

  async createInteraction(
    sourceId: string,
    input: {
      eventTitle?: string;
      scenario?: string;
      whatHappened?: string;
      whatTheySaid?: string;
      whatISaid?: string;
      whatIIntended?: string;
      whatWentWrong?: string;
      betterVersion?: string;
      followUp?: string;
      reflection?: string;
    },
  ) {
    const source = await prisma.source.findUnique({ where: { id: sourceId } });
    if (!source) throw new NotFoundException("Source not found.");
    const eventTitle = input.eventTitle?.trim() || source.title;
    return prisma.interactionLog.create({
      data: {
        sourceId,
        eventTitle,
        scenario: input.scenario?.trim() || undefined,
        whatHappened: input.whatHappened?.trim() || undefined,
        whatTheySaid: input.whatTheySaid?.trim() || undefined,
        whatISaid: input.whatISaid?.trim() || undefined,
        whatIIntended: input.whatIIntended?.trim() || undefined,
        whatWentWrong: input.whatWentWrong?.trim() || undefined,
        betterVersion: input.betterVersion?.trim() || undefined,
        followUp: input.followUp?.trim() || undefined,
        reflection: input.reflection?.trim() || undefined,
      },
    });
  }
}
