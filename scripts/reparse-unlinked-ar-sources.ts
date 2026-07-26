import { prisma } from "@peb/database";
import { parseTranscript } from "../apps/api/src/import/transcript-parser.js";

async function main(): Promise<void> {
  const sources = await prisma.source.findMany({
    where: {
      sourceType: "real_conversation",
      learningLinks: { none: {} }
    },
    include: {
      transcripts: { where: { isCurrent: true } }
    }
  });

  let reparsed = 0;
  for (const source of sources) {
    const transcript = source.transcripts[0];
    if (!transcript) continue;
    const parsed = parseTranscript(transcript.originalText);

    await prisma.$transaction(async (tx) => {
      await tx.transcriptSpeaker.deleteMany({
        where: { transcriptId: transcript.id }
      });
      await tx.transcriptSegment.deleteMany({
        where: { transcriptId: transcript.id }
      });
      await tx.transcript.update({
        where: { id: transcript.id },
        data: {
          format: parsed.format,
          language: parsed.language,
          speakerMaps: {
            create: parsed.speakerLabels.map((label) => ({
              diarizationKey: label,
              displayLabel: label
            }))
          },
          segments: {
            create: parsed.segments.map((segment) => ({
              segmentIndex: segment.segmentIndex,
              diarizationKey: segment.diarizationKey,
              startMs: segment.startMs,
              text: segment.text,
              translationText: segment.translationText
            }))
          }
        }
      });
    });
    reparsed += 1;
  }

  process.stdout.write(`Reparsed ${reparsed} unlinked AR sources.\n`);
  await prisma.$disconnect();
}

void main();
