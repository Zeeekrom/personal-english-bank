import path from "node:path";
import { prisma } from "@peb/database";

function classify(
  relativePath: string,
  originalName: string,
  content: string
): { sourceType: string; provider: string } {
  const normalizedPath = relativePath.toLowerCase();
  const fileName = path.basename(originalName).toLowerCase();

  if (normalizedPath.includes("ar glass")) {
    return { sourceType: "real_conversation", provider: "ar_glass_export" };
  }
  if (fileName.includes("otter") || /Transcribed by https:\/\/otter\.ai/i.test(content)) {
    return { sourceType: "lecture_or_meeting", provider: "otter" };
  }
  if (
    fileName.includes("notta") ||
    fileName.includes("_power") ||
    /Powered by notta\.ai|^Unknown speaker\s+\d{1,2}:\d{2}/im.test(content)
  ) {
    return { sourceType: "lecture_or_meeting", provider: "notta" };
  }
  if (fileName.includes("zoom")) {
    return { sourceType: "lecture_or_meeting", provider: "zoom" };
  }
  return { sourceType: "transcript_import", provider: "unknown_import" };
}

async function main(): Promise<void> {
  const sources = await prisma.source.findMany({
    include: {
      assets: { take: 1 },
      transcripts: { where: { isCurrent: true } }
    }
  });

  let updated = 0;
  for (const source of sources) {
    const asset = source.assets[0];
    const transcript = source.transcripts[0];
    if (!asset || !transcript) continue;
    const classification = classify(
      asset.relativePath,
      asset.originalName,
      transcript.originalText
    );
    await prisma.$transaction([
      prisma.source.update({
        where: { id: source.id },
        data: { sourceType: classification.sourceType }
      }),
      prisma.transcript.update({
        where: { id: transcript.id },
        data: { provider: classification.provider }
      })
    ]);
    updated += 1;
  }

  process.stdout.write(`Reclassified ${updated} imported sources.\n`);
  await prisma.$disconnect();
}

void main();
