import { createHash } from "node:crypto";
import { promises as fs } from "node:fs";
import path from "node:path";
import { BadRequestException, Injectable } from "@nestjs/common";
import { prisma } from "@peb/database";
import { parseTranscript } from "./transcript-parser.js";

const SUPPORTED_EXTENSIONS = new Set(["", ".txt", ".md"]);

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
    })
  );
  return nested.flat();
}

function classify(relativePath: string, content: string) {
  const normalized = relativePath.toLowerCase();
  const fileName = path.basename(normalized);
  if (normalized.includes("ar glass")) {
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

@Injectable()
export class ImportService {
  private readonly translationRoot = translationRootFromEnvironment();

  async discover(): Promise<
    Array<{ relativePath: string; byteSize: number; extension: string }>
  > {
    const files = await walk(this.translationRoot);
    const supported = files.filter((file) =>
      SUPPORTED_EXTENSIONS.has(path.extname(file).toLowerCase())
    );
    const details = await Promise.all(
      supported.map(async (file) => {
        const stat = await fs.stat(file);
        return {
          relativePath: path.relative(this.translationRoot, file),
          byteSize: stat.size,
          extension: path.extname(file).toLowerCase()
        };
      })
    );
    return details.sort((a, b) => a.relativePath.localeCompare(b.relativePath));
  }

  async importRelativePaths(relativePaths: string[]): Promise<ImportResult[]> {
    if (relativePaths.length === 0 || relativePaths.length > 20) {
      throw new BadRequestException("Choose between 1 and 20 files per import.");
    }
    const results: ImportResult[] = [];
    for (const relativePath of relativePaths) {
      results.push(await this.importOne(relativePath));
    }
    return results;
  }

  private async importOne(relativePath: string): Promise<ImportResult> {
    const absolutePath = path.resolve(this.translationRoot, relativePath);
    const rootKey = normalizeForComparison(this.translationRoot);
    const fileKey = normalizeForComparison(absolutePath);
    if (!fileKey.startsWith(`${rootKey}${path.sep}`)) {
      throw new BadRequestException("Import path is outside the configured Translation root.");
    }

    const extension = path.extname(absolutePath).toLowerCase();
    if (!SUPPORTED_EXTENSIONS.has(extension)) {
      return { relativePath, status: "skipped", reason: "unsupported_extension" };
    }

    const bytes = await fs.readFile(absolutePath);
    const contentHash = createHash("sha256").update(bytes).digest("hex");
    const duplicate = await prisma.sourceAsset.findUnique({
      where: { contentHash }
    });
    if (duplicate) {
      return {
        relativePath,
        sourceId: duplicate.sourceId,
        status: "duplicate"
      };
    }

    const content = bytes.toString("utf8").replace(/^\uFEFF/, "");
    if (!content.trim()) {
      return { relativePath, status: "skipped", reason: "empty_file" };
    }

    const parsed = parseTranscript(content);
    if (parsed.segments.length === 0) {
      return { relativePath, status: "skipped", reason: "no_segments" };
    }

    const classification = classify(relativePath, content);
    const title = path.basename(relativePath, extension) || path.basename(relativePath);
    const source = await prisma.$transaction(async (tx) => {
      return tx.source.create({
        data: {
          title,
          sourceType: classification.sourceType,
          language: parsed.language,
          processingStatus: "needs_review",
          assets: {
            create: {
              originalName: path.basename(absolutePath),
              relativePath,
              externalPath: absolutePath,
              contentHash,
              mimeType: extension === ".md" ? "text/markdown" : "text/plain",
              byteSize: BigInt(bytes.byteLength),
              metadataJson: JSON.stringify({ importedReadOnly: true })
            }
          },
          transcripts: {
            create: {
              provider: classification.provider,
              format: parsed.format,
              language: parsed.language,
              originalText: content,
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
          }
        }
      });
    });

    return {
      relativePath,
      sourceId: source.id,
      status: "imported",
      segments: parsed.segments.length
    };
  }
}
