"use client";

import { useEffect, useState } from "react";
import { api } from "../../lib/api";

interface DueReview {
  learningItemId: string;
  nextReviewAt: string;
  intervalDays: number;
  learningItem: {
    id: string;
    title: string;
    refinedEnglish?: string;
    refinedChinese?: string;
    chineseIntention?: string;
    originalText?: string;
    variants: Array<{ variantType: string; content: string }>;
    sources: Array<{
      source: { title: string; capturedAt?: string; summaryCn?: string };
    }>;
  };
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState<DueReview[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [responseText, setResponseText] = useState("");
  const [message, setMessage] = useState("");

  const load = () => api<DueReview[]>("/reviews/due").then(setReviews);
  useEffect(() => {
    load().catch((error: Error) => setMessage(error.message));
  }, []);

  const current = reviews[0];
  const answer =
    current?.learningItem.refinedEnglish ??
    current?.learningItem.variants.find(
      (variant) => variant.variantType === "easy_active",
    )?.content;

  async function complete() {
    if (!current) return;
    await api(`/reviews/${current.learningItemId}/complete`, {
      method: "POST",
      body: JSON.stringify({
        responseText: responseText.trim() || undefined,
      }),
    });
    setRevealed(false);
    setResponseText("");
    setReviews((items) => items.slice(1));
    setMessage("Review completed. The response was recorded without grading.");
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Daily spaced review</p>
          <h1>{reviews.length} due today</h1>
          <p>
            Say the sentence once, optionally paste the speech-to-text result,
            then mark it complete. The system does not judge your speech.
          </p>
        </div>
      </section>
      {message ? <p className="notice">{message}</p> : null}
      {current ? (
        <article className="review-card">
          <div className="card-topline">
            <span>{current.learningItem.sources[0]?.source.title}</span>
            <span>Current interval: {current.intervalDays} day(s)</span>
          </div>
          <p className="eyebrow">Say this in English</p>
          <h2>
            {current.learningItem.refinedChinese ??
              current.learningItem.chineseIntention}
          </h2>
          <label>
            Optional voice transcription
            <textarea
              onChange={(event) => setResponseText(event.target.value)}
              placeholder="Paste the output from Whisper or another voice tool. It will be stored, not graded."
              rows={3}
              value={responseText}
            />
          </label>
          <div className="segment-actions">
            <button
              className="quiet-button"
              onClick={() => setRevealed((value) => !value)}
              type="button"
            >
              {revealed ? "Hide reference" : "Show reference"}
            </button>
            <button
              className="primary-button"
              onClick={() => void complete()}
              type="button"
            >
              Complete and continue
            </button>
          </div>
          {revealed ? (
            <div className="answer-panel">
              <p>{answer}</p>
              <details>
                <summary>Raw source evidence</summary>
                <blockquote>{current.learningItem.originalText}</blockquote>
              </details>
            </div>
          ) : null}
        </article>
      ) : (
        <div className="empty-state">
          <span className="empty-check">✓</span>
          <h2>Today’s review is complete</h2>
          <p>New items appear when their next interval becomes due.</p>
        </div>
      )}
    </>
  );
}
