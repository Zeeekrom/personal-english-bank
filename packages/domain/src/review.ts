export const REVIEW_INTERVALS = [1, 3, 7, 14, 30] as const;
export const REVIEW_RATINGS = ["again", "hard", "good", "easy"] as const;

export type ReviewRating = (typeof REVIEW_RATINGS)[number];

export interface ReviewState {
  repetitions: number;
  intervalDays: number;
  learningStatus: string;
}

export interface ReviewResult extends ReviewState {
  nextReviewAt: Date;
}

function addUtcDays(date: Date, days: number): Date {
  const result = new Date(date);
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

export function scheduleFirstReview(now = new Date()): ReviewResult {
  return {
    repetitions: 0,
    intervalDays: REVIEW_INTERVALS[0],
    learningStatus: "ready",
    nextReviewAt: addUtcDays(now, REVIEW_INTERVALS[0])
  };
}

export function applyReviewRating(
  current: ReviewState,
  rating: ReviewRating,
  now = new Date()
): ReviewResult {
  if (rating === "again") {
    return {
      repetitions: 0,
      intervalDays: 1,
      learningStatus: "learning",
      nextReviewAt: addUtcDays(now, 1)
    };
  }

  const step = Math.min(current.repetitions + 1, REVIEW_INTERVALS.length - 1);
  let intervalDays: number = REVIEW_INTERVALS[step] ?? 30;

  if (rating === "hard") {
    intervalDays = Math.max(1, Math.round(intervalDays * 0.6));
  } else if (rating === "easy") {
    intervalDays = Math.min(60, Math.round(intervalDays * 1.5));
  }

  return {
    repetitions: step,
    intervalDays,
    learningStatus: step >= REVIEW_INTERVALS.length - 1 ? "active" : "learning",
    nextReviewAt: addUtcDays(now, intervalDays)
  };
}
