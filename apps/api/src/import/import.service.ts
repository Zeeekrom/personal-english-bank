import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { BadRequestException, Injectable } from "@nestjs/common";
import { prisma } from "@peb/database";
import {
  curatedImportSchema,
  scheduleFirstReview,
  type CuratedImportInput,
} from "@peb/domain";

const CURATED_SUFFIX = ".curated.json";

function translationRootFromEnvironment(): string {
  const configured = process.env.TRANSLATION_ROOT;
  if (!configured) {
    throw new Error("TRANSLATION_ROOT must be configured.");
  }
  return path.resolve(configured);
}

export interface ImportResult {
  relativePath: string;
  sourceId?: string;
  status: "imported" | "duplicate" | "skipped";
  segments?: number;
  reason?: string;
}

function normalizeForComparison(value: string): string {
  return path.resolve(value).toLocaleLowerCase("en-US");
}

async function walk(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      return entry.isDirectory() ? walk(fullPath) : [fullPath];
    }),
  );
  return nested.flat();
}

function contentHash(input: CuratedImportInput): string {
  return createHash("sha256")
    .update(
      JSON.stringify({
        contractVersion: input.contractVersion,
        originalFileName: input.source.originalFileName,
        sourceText: input.evidence.sourceText,
        rawBilingualText: input.evidence.rawBilingualText,
        refinedBilingualText: input.evidence.refinedBilingualText,
        sentences: input.sentences,
      }),
    )
    .digest("hex");
}

@Injectable()
export class ImportService {
  private readonly translationRoot = translationRootFromEnvironment();

  async discover(): Promise<
    Array<{ relativePath: string; byteSize: number; extension: string }>
  > {
    const files = await walk(this.translationRoot);
    const supported = files.filter((file) =>
      file.toLowerCase().endsWith(CURATED_SUFFIX),
    );
    const details = await Promise.all(
      supported.map(async (file) => {
        const stat = await fs.stat(file);
        return {
          relativePath: path.relative(this.translationRoot, file),
          byteSize: stat.size,
          extension: CURATED_SUFFIX,
        };
      }),
    );
    return details.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  async importRelativePaths(relativePaths: string[]): Promise<ImportResult[]> {
    if (relativePaths.length === 0 || relativePaths.length > 20) {
      throw new BadRequestException(
        "Choose between 1 and 20 curated packages.",
      );
    }
    const results: ImportResult[] = [];
    for (const relativePath of relativePaths) {
      results.push(await this.importOne(relativePath));
    }
    return results;
  }

  async importCurated(input: unknown): Promise<ImportResult> {
    const parsed = curatedImportSchema.safeParse(input);
    if (!parsed.success) {
      throw new BadRequestException({
        message: "Invalid curated import package.",
        issues: parsed.error.issues,
      });
    }
    return this.persist(parsed.data, "api://curated-import");
  }

  private async importOne(relativePath: string): Promise<ImportResult> {
    const absolutePath = path.resolve(this.translationRoot, relativePath);
    const rootKey = normalizeForComparison(this.translationRoot);
    const fileKey = normalizeForComparison(absolutePath);
    if (!fileKey.startsWith(`${rootKey}${path.sep}`)) {
      throw new BadRequestException(
        "Import path is outside the configured Translation root.",
      );
    }
    if (!absolutePath.toLowerCase().endsWith(CURATED_SUFFIX)) {
      return {
        relativePath,
        status: "skipped",
        reason: "not_a_curated_package",
      };
    }

    const content = await fs.readFile(absolutePath, "utf8");
    let decoded: unknown;
    try {
      decoded = JSON.parse(content.replace(/^\uFEFF/, ""));
    } catch {
      return { relativePath, status: "skipped", reason: "invalid_json" };
    }

    const parsed = curatedImportSchema.safeParse(decoded);
    if (!parsed.success) {
      return {
        relativePath,
        status: "skipped",
        reason: "invalid_curated_contract",
      };
    }
    return this.persist(parsed.data, absolutePath, relativePath);
  }

  private async persist(
    input: CuratedImportInput,
    externalPath: string,
    packageRelativePath = input.source.relativePath ??
      input.source.originalFileName,
  ): Promise<ImportResult> {
    const hash = contentHash(input);
    const duplicate = await prisma.sourceAsset.findUnique({
      where: { contentHash: hash },
    });
    if (duplicate) {
      return {
        relativePath: packageRelativePath,
        sourceId: duplicate.sourceId,
        status: "duplicate",
      };
    }

    const source = await prisma.$transaction(async (tx) => {
      const createdSource = await tx.source.create({
        data: {
          title: input.source.title,
          sourceType: input.source.inputType,
          language: input.source.language,
          scenario: input.source.scenario,
          summaryCn: input.source.summaryCn,
          curatedBy: "codex_manual",
          capturedAt: input.source.capturedAt,
          processingStatus: "processed",
        },
      });

      await tx.sourceAsset.create({
        data: {
          sourceId: createdSource.id,
          assetType: "curated_package",
          originalName: input.source.originalFileName,
          relativePath: packageRelativePath,
          externalPath,
          contentHash: hash,
          mimeType: "application/json",
          byteSize: BigInt(Buffer.byteLength(JSON.stringify(input), "utf8")),
          metadataJson: JSON.stringify({
            inputType: input.source.inputType,
            transcriptionTool: input.evidence.transcriptionTool,
            uncertaintyNotes: input.evidence.uncertaintyNotes,
            contractVersion: input.contractVersion,
          }),
        },
      });

      const transcript = await tx.transcript.create({
        data: {
          sourceId: createdSource.id,
          provider: "codex_manual",
          format: "curated_bilingual_v1",
          language: input.source.language,
          sourceText: input.evidence.sourceText,
          originalText: input.evidence.rawBilingualText,
          cleanedText: input.evidence.refinedBilingualText,
        },
      });

      for (const [index, sentence] of input.sentences.entries()) {
        const segment = await tx.transcriptSegment.create({
          data: {
            transcriptId: transcript.id,
            segmentIndex: index,
            startMs: sentence.startMs,
            endMs: sentence.endMs,
            diarizationKey: sentence.speakerLabel,
            text: sentence.english,
            translationText: sentence.chinese,
            rawText: sentence.rawEnglish,
            rawTranslationText: sentence.rawChinese,
            curationDecision: "keep",
            curationNotes: sentence.curationNotes,
            manuallyVerified: true,
          },
        });
        const firstReview = scheduleFirstReview();
        await tx.learningItem.create({
          data: {
            title: `${input.source.title} · ${index + 1}`.slice(0, 500),
            itemType: "curated_sentence",
            chineseIntention: sentence.intentionCn ?? sentence.chinese,
            originalText: sentence.rawEnglish ?? sentence.english,
            sourceTranslation: sentence.rawChinese,
            refinedEnglish: sentence.english,
            refinedChinese: sentence.chinese,
            mainIssue: sentence.mainIssue,
            explanationCn: sentence.explanationCn,
            learningStatus: "ready",
            priority: sentence.priority,
            variants: {
              create: {
                variantType: "easy_active",
                content: sentence.english,
                sortOrder: 0,
              },
            },
            sources: {
              create: {
                sourceId: createdSource.id,
                segmentId: segment.id,
                relationType: "curated_from",
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
        });
      }
      return createdSource;
    });

    return {
      relativePath: packageRelativePath,
      sourceId: source.id,
      status: "imported",
      segments: input.sentences.length,
    };
  }
}
