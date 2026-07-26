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
    chineseIntention?: string;
    originalText?: string;
    variants: Array<{ variantType: string; content: string }>;
    sources: Array<{ source: { title: string } }>;
  };
}

export default function ReviewPage() {
  const [reviews, setReviews] = useState<DueReview[]>([]);
  const [revealed, setRevealed] = useState(false);
  const [message, setMessage] = useState("");

  const load = () => api<DueReview[]>("/reviews/due").then(setReviews);
  useEffect(() => {
    load().catch((error: Error) => setMessage(error.message));
  }, []);

  const current = reviews[0];
  const answer = current?.learningItem.variants.find(
    (variant) => variant.variantType === "easy_active"
  )?.content;

  async function rate(rating: string) {
    if (!current) return;
    await api(`/reviews/${current.learningItemId}`, {
      method: "POST",
      body: JSON.stringify({ rating })
    });
    setRevealed(false);
    setReviews((items) => items.slice(1));
    setMessage(`Saved as ${rating}.`);
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Daily review</p>
          <h1>{reviews.length} due today</h1>
          <p>The queue is capped so new material never crowds out real practice.</p>
        </div>
      </section>
      {message ? <p className="notice">{message}</p> : null}
      {current ? (
        <article className="review-card">
          <div className="card-topline">
            <span>{current.learningItem.sources[0]?.source.title}</span>
            <span>Previous interval: {current.intervalDays} day(s)</span>
          </div>
          <p className="eyebrow">Say this in English</p>
          <h2>
            {current.learningItem.chineseIntention ||
              current.learningItem.originalText}
          </h2>
          {!revealed ? (
            <button
              className="primary-button reveal-button"
              onClick={() => setRevealed(true)}
              type="button"
            >
              Reveal Easy Active English
            </button>
          ) : (
            <>
              <div className="answer-panel">
                <p>{answer}</p>
                <details>
                  <summary>Original source fragment</summary>
                  <blockquote>{current.learningItem.originalText}</blockquote>
                </details>
              </div>
              <div className="rating-grid">
                {[
                  { value: "again", label: "Again", hint: "1 day" },
                  { value: "hard", label: "Hard", hint: "Shorter" },
                  { value: "good", label: "Good", hint: "Next step" },
                  { value: "easy", label: "Easy", hint: "Longer" }
                ].map(({ value, label, hint }) => (
                  <button
                    className={`rating rating-${value}`}
                    key={value}
                    onClick={() => void rate(value)}
                    type="button"
                  >
                    <strong>{label}</strong>
                    <small>{hint}</small>
                  </button>
                ))}
              </div>
            </>
          )}
        </article>
      ) : (
        <div className="empty-state">
          <span className="empty-check">✓</span>
          <h2>Review queue clear</h2>
          <p>New items appear here when their next review date arrives.</p>
        </div>
      )}
    </>
  );
}
