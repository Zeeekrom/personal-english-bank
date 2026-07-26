import { describe, expect, it } from "vitest";
import { applyReviewRating, scheduleFirstReview } from "./review.js";

describe("review scheduling", () => {
  const now = new Date("2026-07-26T12:00:00.000Z");

  it("schedules the first review one day later", () => {
    const result = scheduleFirstReview(now);
    expect(result.intervalDays).toBe(1);
    expect(result.nextReviewAt.toISOString()).toBe("2026-07-27T12:00:00.000Z");
  });

  it("resets an item after Again", () => {
    const result = applyReviewRating(
      { repetitions: 3, intervalDays: 14, learningStatus: "learning" },
      "again",
      now
    );
    expect(result.repetitions).toBe(0);
    expect(result.intervalDays).toBe(1);
  });

  it("moves a successful item through the fixed intervals", () => {
    const result = applyReviewRating(
      { repetitions: 1, intervalDays: 3, learningStatus: "learning" },
      "good",
      now
    );
    expect(result.repetitions).toBe(2);
    expect(result.intervalDays).toBe(7);
  });
});
