import "dotenv/config";

import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { promises as fs } from "node:fs";
import path from "node:path";
import { curatedImportSchema } from "@peb/domain";

const translationRoot = process.env.TRANSLATION_ROOT
  ? path.resolve(process.env.TRANSLATION_ROOT)
  : undefined;
const outputRoot = translationRoot
  ? path.join(translationRoot, "processed", "curated")
  : undefined;
const docxPython = process.env.DOCX_PYTHON ?? "python";

interface SourceAudit {
  relativePath: string;
  status: "completed" | "unfinished";
  packageRelativePath: string;
  sourceCharacters?: number;
  reviewSentences?: number;
}

async function walk(directory: string): Promise<string[]> {
  const entries = await fs.readdir(directory, { withFileTypes: true });
  const nested = await Promise.all(
    entries.map(async (entry) => {
      const fullPath = path.join(directory, entry.name);
      if (
        entry.isDirectory() &&
        path.resolve(fullPath) === path.resolve(translationRoot!, "processed")
      ) {
        return [];
      }
      return entry.isDirectory() ? walk(fullPath) : [fullPath];
    }),
  );
  return nested.flat();
}

function supported(file: string): boolean {
  const extension = path.extname(file).toLocaleLowerCase();
  return extension === "" || extension === ".txt" || extension === ".docx";
}

function decodeText(bytes: Buffer): string {
  if (bytes[0] === 0xff && bytes[1] === 0xfe) {
    return bytes.subarray(2).toString("utf16le");
  }
  const utf8 = bytes.toString("utf8").replace(/^\uFEFF/, "");
  if ((utf8.match(/\uFFFD/g)?.length ?? 0) > 3) {
    return new TextDecoder("windows-1252").decode(bytes);
  }
  return utf8;
}

async function readSource(file: string): Promise<string> {
  if (path.extname(file).toLocaleLowerCase() !== ".docx") {
    return decodeText(await fs.readFile(file)).trim();
  }
  const result = execFileSync(
    docxPython,
    [path.resolve("scripts/extract-docx-text.py"), file],
    {
      encoding: "utf8",
      maxBuffer: 50 * 1024 * 1024,
    },
  );
  return (JSON.parse(result) as { text: string }).text.trim();
}

function packagePathForSource(relativePath: string): string {
  const extension = path.extname(relativePath);
  const withoutExtension = extension
    ? relativePath.slice(0, -extension.length)
    : relativePath;
  const digest = createHash("sha1")
    .update(relativePath)
    .digest("hex")
    .slice(0, 8);
  const safeParts = withoutExtension.split(path.sep).map((part) =>
    part
      .replace(/[<>:"/\\|?*]/g, "_")
      .replace(/\s+/g, " ")
      .trim()
      .slice(0, 80),
  );
  safeParts[safeParts.length - 1] =
    `${safeParts[safeParts.length - 1]}_${digest}`;
  return path.join(...safeParts, "package.curated.json");
}

function markdownTable(items: SourceAudit[]): string {
  const unfinishedItems = items.filter((item) => item.status === "unfinished");
  const rows = unfinishedItems.map(
    (item, index) =>
      `| ${index + 1} | ${item.relativePath.replaceAll("|", "\\|")} | ${path.extname(item.relativePath) || "无扩展名"} |`,
  );
  return [
    "# Translation 语料处理状态",
    "",
    "> 此报告只记录文件名与处理状态，不包含语料正文。原文件保持只读。",
    "",
    `- 原文件：${items.length}`,
    `- 已完成：${items.filter((item) => item.status === "completed").length}`,
    `- 未完成：${items.filter((item) => item.status === "unfinished").length}`,
    "",
    "## 未完成文件（交由后续 GPT 处理）",
    "",
    "| # | Translation 下的相对路径 | 类型 |",
    "|---:|---|---|",
    ...rows,
    "",
  ].join("\n");
}

async function main(): Promise<void> {
  if (!translationRoot || !outputRoot) {
    throw new Error("TRANSLATION_ROOT must be configured.");
  }

  const files = (await walk(translationRoot))
    .filter(supported)
    .sort((left, right) => left.localeCompare(right));
  const audits: SourceAudit[] = [];
  let selectedSentences = 0;
  let completedCharacters = 0;

  for (const file of files) {
    const relativePath = path.relative(translationRoot, file);
    const packageRelativePath = packagePathForSource(relativePath);
    const packagePath = path.join(outputRoot, packageRelativePath);
    try {
      const packageBytes = await fs.readFile(packagePath, "utf8");
      const decoded = curatedImportSchema.parse(
        JSON.parse(packageBytes.replace(/^\uFEFF/, "")),
      );
      const sourceText = await readSource(file);
      if (decoded.evidence.sourceText !== sourceText) {
        throw new Error(`Full source mismatch: ${relativePath}`);
      }
      const paired = decoded.sentences.every(
        (sentence) => sentence.english.trim() && sentence.chinese.trim(),
      );
      if (!paired) {
        throw new Error(`Empty bilingual review sentence: ${relativePath}`);
      }
      completedCharacters += sourceText.length;
      selectedSentences += decoded.sentences.length;
      audits.push({
        relativePath,
        packageRelativePath,
        status: "completed",
        sourceCharacters: sourceText.length,
        reviewSentences: decoded.sentences.length,
      });
    } catch (error) {
      if ((error as NodeJS.ErrnoException).code !== "ENOENT") {
        throw error;
      }
      audits.push({
        relativePath,
        packageRelativePath,
        status: "unfinished",
      });
    }
  }

  const reportDirectory = path.resolve("local-reports");
  const reportPath = path.join(reportDirectory, "translation-corpus-status.md");
  await fs.mkdir(reportDirectory, { recursive: true });
  await fs.writeFile(reportPath, markdownTable(audits), "utf8");

  const completed = audits.filter((item) => item.status === "completed");
  const unfinished = audits.filter((item) => item.status === "unfinished");
  process.stdout.write(
    `${JSON.stringify(
      {
        originalFiles: audits.length,
        completedPackages: completed.length,
        unfinishedFiles: unfinished.length,
        completedSourceCharacters: completedCharacters,
        selectedReviewSentences: selectedSentences,
        reportPath,
        unfinished: unfinished.map((item) => item.relativePath),
      },
      null,
      2,
    )}\n`,
  );
}

void main();
