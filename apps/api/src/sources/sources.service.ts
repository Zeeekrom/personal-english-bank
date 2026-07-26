import { Injectable, NotFoundException } from "@nestjs/common";
import { prisma } from "@peb/database";

@Injectable()
export class SourcesService {
  async list(query?: string) {
    const sources = await prisma.source.findMany({
      where: query
        ? {
            OR: [
              { title: { contains: query } },
              {
                transcripts: {
                  some: { segments: { some: { text: { contains: query } } } }
                }
              }
            ]
          }
        : undefined,
      include: {
        _count: { select: { transcripts: true, learningLinks: true } },
        assets: { select: { relativePath: true, byteSize: true } }
      },
      orderBy: [{ processingPriority: "desc" }, { importedAt: "desc" }]
    });
    return sources.map((source) => ({
      ...source,
      assets: source.assets.map((asset) => ({
        ...asset,
        byteSize: Number(asset.byteSize)
      }))
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
              orderBy: { segmentIndex: "asc" }
            }
          }
        },
        interactionLogs: { orderBy: { createdAt: "desc" } }
      }
    });
    if (!source) throw new NotFoundException("Source not found.");
    return {
      ...source,
      assets: source.assets.map((asset) => ({
        ...asset,
        byteSize: Number(asset.byteSize)
      }))
    };
  }

  async assignSpeaker(
    segmentId: string,
    input: {
      displayName: string;
      role?: string;
      isMe?: boolean;
      applyToDiarizationKey?: boolean;
    }
  ) {
    const segment = await prisma.transcriptSegment.findUnique({
      where: { id: segmentId }
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
          isMe: input.isMe ?? false
        }
      });

      const where =
        input.applyToDiarizationKey && segment.diarizationKey
          ? {
              transcriptId: segment.transcriptId,
              diarizationKey: segment.diarizationKey
            }
          : { id: segment.id };

      await tx.transcriptSegment.updateMany({
        where,
        data: { speakerId: speaker.id, manuallyVerified: true }
      });

      if (input.applyToDiarizationKey && segment.diarizationKey) {
        await tx.transcriptSpeaker.updateMany({
          where: {
            transcriptId: segment.transcriptId,
            diarizationKey: segment.diarizationKey
          },
          data: { speakerId: speaker.id, manuallyMapped: true }
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
    }
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
        reflection: input.reflection?.trim() || undefined
      }
    });
  }
}
