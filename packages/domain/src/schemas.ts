import { z } from "zod";
import { REVIEW_RATINGS } from "./review.js";

export const createLearningItemSchema = z.object({
  segmentId: z.string().min(1),
  title: z.string().trim().min(1).max(500),
  chineseIntention: z.string().trim().max(4000).optional(),
  easyActiveVersion: z.string().trim().min(1).max(4000),
  minimumCorrection: z.string().trim().max(4000).optional(),
  naturalVersion: z.string().trim().max(4000).optional(),
  explanationCn: z.string().trim().max(4000).optional(),
  itemType: z.string().trim().max(50).default("my_better_version"),
  usageMode: z.enum(["active_use", "understand_only"]).default("active_use"),
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
export type ReviewSubmission = z.infer<typeof reviewSubmissionSchema>;
export type UsageEventInput = z.infer<typeof usageEventSchema>;
