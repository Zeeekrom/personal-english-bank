import { describe, expect, it } from "vitest";
import {
  inspectCuratedPackage,
  parseCuratedPackageText,
} from "./curated-import-client";

const validPackage = {
  contractVersion: "1.0",
  source: {
    title: "Bank appointment",
    inputType: "pretranscribed_text",
    originalFileName: "bank.txt",
    summaryCn: "一次银行咨询。",
  },
  evidence: {
    sourceText: "When will my card arrive?",
    rawBilingualText: "When will my card arrive?\n我的卡什么时候到？",
    refinedBilingualText:
      "Could you tell me when my card will arrive?\n请问我的银行卡什么时候能寄到？",
  },
  sentences: [
    {
      english: "Could you tell me when my card will arrive?",
      chinese: "请问我的银行卡什么时候能寄到？",
    },
  ],
};

describe("curated import browser recognition", () => {
  it("recognizes a valid package and reports its full-content counts", () => {
    expect(inspectCuratedPackage(validPackage)).toMatchObject({
      title: "Bank appointment",
      originalFileName: "bank.txt",
      inputType: "pretranscribed_text",
      curatedBy: "codex",
      sentenceCount: 1,
      sourceCharacters: 25,
    });
  });

  it("accepts a UTF-8 BOM before JSON", () => {
    expect(
      parseCuratedPackageText(`\uFEFF${JSON.stringify(validPackage)}`)
        .inspection.sentenceCount,
    ).toBe(1);
  });

  it("rejects Markdown-wrapped output", () => {
    expect(() =>
      parseCuratedPackageText(
        `\`\`\`json\n${JSON.stringify(validPackage)}\n\`\`\``,
      ),
    ).toThrow("无法解析 JSON");
  });

  it("rejects unsupported contract versions and empty sentence lists", () => {
    expect(() =>
      inspectCuratedPackage({ ...validPackage, contractVersion: "2.0" }),
    ).toThrow("contractVersion");
    expect(() =>
      inspectCuratedPackage({ ...validPackage, sentences: [] }),
    ).toThrow("1–500");
  });
});
