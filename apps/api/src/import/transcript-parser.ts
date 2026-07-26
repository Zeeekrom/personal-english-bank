export interface ParsedSegment {
  segmentIndex: number;
  diarizationKey?: string;
  startMs?: number;
  text: string;
  translationText?: string;
}

export interface ParsedTranscript {
  format: "speaker_timestamp" | "bilingual_blocks" | "plain";
  language: "en" | "zh" | "mixed" | "unknown";
  segments: ParsedSegment[];
  speakerLabels: string[];
}

const CJK_PATTERN = /[\u3400-\u9fff]/u;
const LATIN_PATTERN = /[A-Za-z]/u;
const SPEAKER_TIME_PATTERN =
  /^(?<speaker>(?:Speaker\s+\d+|Unknown speaker|[A-Za-z][A-Za-z0-9 _.-]{0,60}?))\s+(?<time>(?:\d{1,2}:)?\d{1,2}:\d{2})\s*$/i;

function timestampToMs(value: string): number {
  const parts = value.split(":").map(Number);
  if (parts.length === 2) {
    return ((parts[0] ?? 0) * 60 + (parts[1] ?? 0)) * 1000;
  }
  return (
    ((parts[0] ?? 0) * 3600 + (parts[1] ?? 0) * 60 + (parts[2] ?? 0)) *
    1000
  );
}

function detectLanguage(text: string): ParsedTranscript["language"] {
  const hasChinese = CJK_PATTERN.test(text);
  const hasLatin = LATIN_PATTERN.test(text);
  if (hasChinese && hasLatin) return "mixed";
  if (hasChinese) return "zh";
  if (hasLatin) return "en";
  return "unknown";
}

function parseSpeakerTimestamp(text: string): ParsedTranscript | undefined {
  const lines = text.replace(/\r\n?/g, "\n").split("\n");
  const segments: ParsedSegment[] = [];
  const speakerLabels = new Set<string>();
  let current:
    | { speaker: string; startMs: number; content: string[] }
    | undefined;

  const flush = () => {
    if (!current) return;
    const content = current.content.join(" ").replace(/\s+/g, " ").trim();
    if (content) {
      segments.push({
        segmentIndex: segments.length,
        diarizationKey: current.speaker,
        startMs: current.startMs,
        text: content
      });
    }
  };

  for (const line of lines) {
    const match = line.match(SPEAKER_TIME_PATTERN);
    if (match?.groups?.speaker && match.groups.time) {
      flush();
      const speaker = match.groups.speaker.trim();
      speakerLabels.add(speaker);
      current = {
        speaker,
        startMs: timestampToMs(match.groups.time),
        content: []
      };
      continue;
    }

    if (current && line.trim() && !/^Transcribed by /i.test(line.trim())) {
      current.content.push(line.trim());
    }
  }
  flush();

  if (segments.length === 0) return undefined;
  return {
    format: "speaker_timestamp",
    language: detectLanguage(segments.map((segment) => segment.text).join("\n")),
    segments,
    speakerLabels: [...speakerLabels]
  };
}

function isHeaderBlock(block: string): boolean {
  return (
    /^Translate\s+\d+$/i.test(block) ||
    /^unknown$/i.test(block) ||
    /^\d{1,2}\/\d{1,2}(?:\/\d{2,4})?$/.test(block)
  );
}

function parseBilingualBlocks(text: string): ParsedTranscript | undefined {
  const blocks = text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.trim())
    .filter(Boolean)
    .filter((block) => !isHeaderBlock(block));

  const segments: ParsedSegment[] = [];
  for (let index = 0; index < blocks.length; index += 1) {
    const block = blocks[index];
    if (!block) continue;
    const next = blocks[index + 1];
    const lines = block
      .split("\n")
      .map((line) => line.trim())
      .filter(Boolean);
    const firstChineseLine = lines.findIndex((line) => CJK_PATTERN.test(line));

    if (
      firstChineseLine > 0 &&
      lines.slice(0, firstChineseLine).every((line) => !CJK_PATTERN.test(line))
    ) {
      segments.push({
        segmentIndex: segments.length,
        diarizationKey: "unknown",
        text: lines.slice(0, firstChineseLine).join(" "),
        translationText: lines.slice(firstChineseLine).join(" ")
      });
      continue;
    }

    const normalizedBlock = block.replace(/\s+/g, " ").trim();
    const normalizedNext = next?.replace(/\s+/g, " ").trim();

    if (
      LATIN_PATTERN.test(normalizedBlock) &&
      !CJK_PATTERN.test(normalizedBlock) &&
      normalizedNext &&
      CJK_PATTERN.test(normalizedNext)
    ) {
      segments.push({
        segmentIndex: segments.length,
        diarizationKey: "unknown",
        text: normalizedBlock,
        translationText: normalizedNext
      });
      index += 1;
      continue;
    }

    if (LATIN_PATTERN.test(normalizedBlock)) {
      segments.push({
        segmentIndex: segments.length,
        diarizationKey: "unknown",
        text: normalizedBlock
      });
    }
  }

  if (segments.length < 2) return undefined;
  return {
    format: "bilingual_blocks",
    language: "mixed",
    segments,
    speakerLabels: ["unknown"]
  };
}

function parsePlain(text: string): ParsedTranscript {
  const blocks = text
    .replace(/\r\n?/g, "\n")
    .split(/\n\s*\n/)
    .map((block) => block.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  return {
    format: "plain",
    language: detectLanguage(text),
    segments: blocks.map((block, segmentIndex) => ({
      segmentIndex,
      diarizationKey: "unknown",
      text: block
    })),
    speakerLabels: ["unknown"]
  };
}

export function parseTranscript(input: string): ParsedTranscript {
  const text = input.replace(/^\uFEFF/, "").trim();
  return (
    parseSpeakerTimestamp(text) ??
    parseBilingualBlocks(text) ??
    parsePlain(text)
  );
}
