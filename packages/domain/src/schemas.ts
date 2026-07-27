import { z } from "zod";
import { REVIEW_RATINGS } from "./review.js";

export const createLearningItemSchema = z.object({
  segmentId: z.string().min(1),
  title: z.string().trim().min(1).max(500),
  chineseIntention: z.string().trim().max(4000).optional(),
  easyActiveVersion: z.string().trim().min(1).max(4000),
  refinedChinese: z.string().trim().min(1).max(4000),
  mainIssue: z.string().trim().max(4000).optional(),
  minimumCorrection: z.string().trim().max(4000).optional(),
  naturalVersion: z.string().trim().max(4000).optional(),
  explanationCn: z.string().trim().max(4000).optional(),
  itemType: z.string().trim().max(50).default("my_better_version"),
  usageMode: z.enum(["active_use", "understand_only"]).default("active_use"),
});

export const updateLearningItemSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    refinedEnglish: z.string().trim().min(1).max(4000).optional(),
    refinedChinese: z.string().trim().min(1).max(4000).optional(),
    chineseIntention: z.string().trim().max(4000).nullable().optional(),
    mainIssue: z.string().trim().max(4000).nullable().optional(),
    explanationCn: z.string().trim().max(4000).nullable().optional(),
    learningStatus: z
      .enum(["ready", "learning", "active", "mastered", "archived"])
      .optional(),
    priority: z.number().int().min(0).max(100).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });

export const updateSourceSchema = z
  .object({
    title: z.string().trim().min(1).max(500).optional(),
    summaryCn: z.string().trim().min(1).max(4000).nullable().optional(),
    scenario: z.string().trim().max(100).nullable().optional(),
    capturedAt: z.coerce.date().nullable().optional(),
    processingStatus: z.enum(["processed", "archived"]).optional(),
  })
  .refine((value) => Object.keys(value).length > 0, {
    message: "At least one field is required.",
  });

const curatedSentenceSchema = z.object({
  english: z.string().trim().min(1).max(4000),
  chinese: z.string().trim().min(1).max(4000),
  rawEnglish: z.string().trim().max(4000).optional(),
  rawChinese: z.string().trim().max(4000).optional(),
  startMs: z.number().int().min(0).optional(),
  endMs: z.number().int().min(0).optional(),
  speakerLabel: z.string().trim().max(100).optional(),
  mainIssue: z.string().trim().max(4000).optional(),
  intentionCn: z.string().trim().max(4000).optional(),
  explanationCn: z.string().trim().max(4000).optional(),
  curationNotes: z.string().trim().max(4000).optional(),
  priority: z.number().int().min(0).max(100).default(0),
});

export const curatedImportSchema = z.object({
  contractVersion: z.literal("1.0"),
  source: z.object({
    title: z.string().trim().min(1).max(500),
    inputType: z.enum(["audio", "video", "pretranscribed_text"]),
    originalFileName: z.string().trim().min(1).max(500),
    relativePath: z.string().trim().max(1000).optional(),
    capturedAt: z.coerce.date().optional(),
    scenario: z.string().trim().max(100).optional(),
    summaryCn: z.string().trim().min(1).max(4000),
    language: z.string().trim().min(1).max(30).default("en-zh"),
  }),
  evidence: z.object({
    sourceText: z.string().min(1),
    rawBilingualText: z.string().trim().min(1),
    refinedBilingualText: z.string().trim().min(1),
    transcriptionTool: z.string().trim().max(100).optional(),
    uncertaintyNotes: z.string().trim().max(4000).optional(),
  }),
  sentences: z.array(curatedSentenceSchema).min(1).max(500),
});

export const reviewSubmissionSchema = z.object({
  rating: z.enum(REVIEW_RATINGS),
  responseText: z.string().trim().max(4000).optional(),
  notes: z.string().trim().max(4000).optional(),
});

export const usageEventSchema = z.object({
  scenario: z.string().trim().max(200).optional(),
  outcome: z.enum(["used", "partly_used", "missed", "needs_revision"]),
  notes: z.string().trim().max(4000).optional(),
  usedAt: z.coerce.date().optional(),
});

export type CreateLearningItemInput = z.infer<typeof createLearningItemSchema>;
export type UpdateLearningItemInput = z.infer<typeof updateLearningItemSchema>;
export type UpdateSourceInput = z.infer<typeof updateSourceSchema>;
export type CuratedImportInput = z.infer<typeof curatedImportSchema>;
export type ReviewSubmission = z.infer<typeof reviewSubmissionSchema>;
export type UsageEventInput = z.infer<typeof usageEventSchema>;
