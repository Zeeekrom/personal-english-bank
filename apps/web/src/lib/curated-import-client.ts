const INPUT_TYPES = new Set(["audio", "video", "pretranscribed_text"]);

export interface PackageInspection {
  title: string;
  originalFileName: string;
  inputType: string;
  curatedBy: string;
  sourceCharacters: number;
  rawBilingualCharacters: number;
  refinedBilingualCharacters: number;
  sentenceCount: number;
}

function record(value: unknown, label: string): Record<string, unknown> {
  if (typeof value !== "object" || value === null || Array.isArray(value)) {
    throw new Error(`${label} 必须是 JSON 对象。`);
  }
  return value as Record<string, unknown>;
}

function requiredString(
  value: unknown,
  path: string,
  options: { trim?: boolean } = { trim: true },
): string {
  if (typeof value !== "string") {
    throw new Error(`${path} 必须是字符串。`);
  }
  const checked = options.trim === false ? value : value.trim();
  if (checked.length === 0) {
    throw new Error(`${path} 不能为空。`);
  }
  return value;
}

export function inspectCuratedPackage(value: unknown): PackageInspection {
  const root = record(value, "根节点");
  if (root.contractVersion !== "1.0") {
    throw new Error('contractVersion 必须是字符串 "1.0"。');
  }

  const source = record(root.source, "source");
  const evidence = record(root.evidence, "evidence");
  if (!Array.isArray(root.sentences)) {
    throw new Error("sentences 必须是数组。");
  }
  if (root.sentences.length < 1 || root.sentences.length > 500) {
    throw new Error("sentences 必须包含 1–500 条筛选后的句子。");
  }

  const title = requiredString(source.title, "source.title");
  const originalFileName = requiredString(
    source.originalFileName,
    "source.originalFileName",
  );
  const inputType = requiredString(source.inputType, "source.inputType");
  if (!INPUT_TYPES.has(inputType)) {
    throw new Error(
      "source.inputType 只支持 audio、video 或 pretranscribed_text。",
    );
  }
  const curatedBy =
    source.curatedBy === undefined
      ? "codex"
      : requiredString(source.curatedBy, "source.curatedBy");
  if (!["codex", "gpt", "manual", "other"].includes(curatedBy)) {
    throw new Error("source.curatedBy 只支持 codex、gpt、manual 或 other。");
  }
  requiredString(source.summaryCn, "source.summaryCn");

  const sourceText = requiredString(
    evidence.sourceText,
    "evidence.sourceText",
    { trim: false },
  );
  const rawBilingualText = requiredString(
    evidence.rawBilingualText,
    "evidence.rawBilingualText",
  );
  const refinedBilingualText = requiredString(
    evidence.refinedBilingualText,
    "evidence.refinedBilingualText",
  );

  root.sentences.forEach((item, index) => {
    const sentence = record(item, `sentences[${index}]`);
    requiredString(sentence.english, `sentences[${index}].english`);
    requiredString(sentence.chinese, `sentences[${index}].chinese`);
  });

  return {
    title,
    originalFileName,
    inputType,
    curatedBy,
    sourceCharacters: sourceText.length,
    rawBilingualCharacters: rawBilingualText.length,
    refinedBilingualCharacters: refinedBilingualText.length,
    sentenceCount: root.sentences.length,
  };
}

export function parseCuratedPackageText(text: string): {
  decoded: unknown;
  inspection: PackageInspection;
} {
  const normalized = text.replace(/^\uFEFF/, "");
  let decoded: unknown;
  try {
    decoded = JSON.parse(normalized);
  } catch {
    throw new Error(
      "无法解析 JSON。请确认 GPT 没有输出 Markdown 代码块、注释或多余说明。",
    );
  }
  return { decoded, inspection: inspectCuratedPackage(decoded) };
}
