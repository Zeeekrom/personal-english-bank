import { describe, expect, it } from "vitest";
import { curatedImportSchema } from "./schemas.js";

const validPackage = {
  contractVersion: "1.0",
  source: {
    title: "Bank appointment",
    inputType: "audio",
    originalFileName: "bank-appointment.mp3",
    summaryCn: "咨询银行卡邮寄进度。",
  },
  evidence: {
    rawBilingualText: "Where my card?\n我的卡在哪里？",
    refinedBilingualText:
      "Could you tell me when my card will arrive?\n请问我的银行卡什么时候能寄到？",
  },
  sentences: [
    {
      rawEnglish: "Where my card?",
      rawChinese: "我的卡在哪里？",
      english: "Could you tell me when my card will arrive?",
      chinese: "请问我的银行卡什么时候能寄到？",
      mainIssue: "The original transcription is incomplete.",
    },
  ],
} as const;

describe("curatedImportSchema", () => {
  it("accepts a complete curated bilingual package", () => {
    expect(curatedImportSchema.safeParse(validPackage).success).toBe(true);
  });

  it("rejects a package without a source summary", () => {
    const invalid = {
      ...validPackage,
      source: { ...validPackage.source, summaryCn: "" },
    };
    expect(curatedImportSchema.safeParse(invalid).success).toBe(false);
  });

  it("rejects a package without refined sentences", () => {
    expect(
      curatedImportSchema.safeParse({ ...validPackage, sentences: [] }).success,
    ).toBe(false);
  });
});
