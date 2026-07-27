import "dotenv/config";

import { promises as fs } from "node:fs";
import path from "node:path";

const apiUrl = process.env.API_URL ?? "http://localhost:3001";
const translationRoot = process.env.TRANSLATION_ROOT
  ? path.resolve(process.env.TRANSLATION_ROOT)
  : undefined;

interface DiscoveredPackage {
  relativePath: string;
}

interface SourceSummary {
  id: string;
  assets: Array<{ relativePath: string }>;
}

interface SourceDetail {
  title: string;
  transcripts: Array<{
    sourceText: string | null;
    originalText: string;
    cleanedText: string | null;
    segments: Array<{ text: string; translationText: string | null }>;
  }>;
}

async function get<T>(endpoint: string): Promise<T> {
  const response = await fetch(`${apiUrl}/api${endpoint}`);
  if (!response.ok) {
    throw new Error(`${endpoint}: ${response.status} ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

async function main(): Promise<void> {
  if (!translationRoot) {
    throw new Error("TRANSLATION_ROOT must be configured.");
  }
  const [discovered, sources] = await Promise.all([
    get<DiscoveredPackage[]>("/imports/discover"),
    get<SourceSummary[]>("/sources"),
  ]);
  const sourceByPackage = new Map<string, SourceSummary>();
  for (const source of sources) {
    for (const asset of source.assets) {
      sourceByPackage.set(asset.relativePath.toLocaleLowerCase(), source);
    }
  }

  let sourceCharacters = 0;
  let rawBilingualCharacters = 0;
  let refinedBilingualCharacters = 0;
  let selectedSentences = 0;
  let largest:
    | {
        title: string;
        sourceCharacters: number;
        sourceId: string;
      }
    | undefined;

  for (const item of discovered) {
    const source = sourceByPackage.get(item.relativePath.toLocaleLowerCase());
    if (!source) {
      throw new Error(`Package is not imported: ${item.relativePath}`);
    }
    const packagePath = path.join(translationRoot, item.relativePath);
    const curatedPackage = JSON.parse(
      (await fs.readFile(packagePath, "utf8")).replace(/^\uFEFF/, ""),
    ) as {
      evidence: {
        sourceText: string;
        rawBilingualText: string;
        refinedBilingualText: string;
      };
      sentences: Array<{ english: string; chinese: string }>;
    };
    const detail = await get<SourceDetail>(`/sources/${source.id}`);
    const transcript = detail.transcripts[0];
    if (!transcript) {
      throw new Error(`Imported source has no transcript: ${detail.title}`);
    }
    if (
      transcript.sourceText !== curatedPackage.evidence.sourceText ||
      transcript.originalText !== curatedPackage.evidence.rawBilingualText ||
      transcript.cleanedText !== curatedPackage.evidence.refinedBilingualText
    ) {
      throw new Error(`Full preview mismatch: ${detail.title}`);
    }
    if (transcript.segments.length !== curatedPackage.sentences.length) {
      throw new Error(`Review sentence count mismatch: ${detail.title}`);
    }
    const fullyPaired = transcript.segments.every(
      (segment) => segment.text.trim() && segment.translationText?.trim(),
    );
    if (!fullyPaired) {
      throw new Error(
        `Imported bilingual sentence is incomplete: ${detail.title}`,
      );
    }

    sourceCharacters += transcript.sourceText.length;
    rawBilingualCharacters += transcript.originalText.length;
    refinedBilingualCharacters += transcript.cleanedText?.length ?? 0;
    selectedSentences += transcript.segments.length;
    if (!largest || transcript.sourceText.length > largest.sourceCharacters) {
      largest = {
        title: detail.title,
        sourceCharacters: transcript.sourceText.length,
        sourceId: source.id,
      };
    }
  }

  process.stdout.write(
    `${JSON.stringify(
      {
        discoveredPackages: discovered.length,
        importedSources: sources.length,
        exactFullPreviews: discovered.length,
        sourceCharacters,
        rawBilingualCharacters,
        refinedBilingualCharacters,
        selectedSentences,
        largest,
      },
      null,
      2,
    )}\n`,
  );
}

void main();
