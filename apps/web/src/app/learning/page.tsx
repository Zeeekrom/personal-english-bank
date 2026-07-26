"use client";

import { FormEvent, useEffect, useState } from "react";
import { API_URL, api } from "../../lib/api";

interface LearningItem {
  id: string;
  title: string;
  chineseIntention?: string;
  originalText?: string;
  usageMode: string;
  learningStatus: string;
  lastUsedAt?: string;
  variants: Array<{ id: string; variantType: string; content: string }>;
  sources: Array<{ source: { id: string; title: string } }>;
  _count: { usageEvents: number; reviewEvents: number };
}

export default function LearningPage() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [loggingId, setLoggingId] = useState<string>();
  const [message, setMessage] = useState("");

  const load = () => api<LearningItem[]>("/learning-items").then(setItems);
  useEffect(() => {
    load().catch((error: Error) => setMessage(error.message));
  }, []);

  async function submitUsage(
    event: FormEvent<HTMLFormElement>,
    itemId: string
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api(`/learning-items/${itemId}/usage`, {
      method: "POST",
      body: JSON.stringify({
        scenario: form.get("scenario") || undefined,
        outcome: form.get("outcome"),
        notes: form.get("notes") || undefined
      })
    });
    setMessage("Real-world usage recorded.");
    setLoggingId(undefined);
    await load();
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Active language</p>
          <h1>Learning bank</h1>
          <p>{items.length} reviewed expressions with source evidence.</p>
        </div>
        <a
          className="primary-button"
          href={`${API_URL}/api/exports/markdown`}
        >
          Export Markdown
        </a>
      </section>
      {message ? <p className="notice">{message}</p> : null}
      <section className="learning-list">
        {items.map((item) => {
          const easy = item.variants.find(
            (variant) => variant.variantType === "easy_active"
          );
          return (
            <article className="learning-card" key={item.id}>
              <div className="card-topline">
                <span className={`status status-${item.learningStatus}`}>
                  {item.learningStatus}
                </span>
                <span>{item.usageMode.replace("_", " ")}</span>
              </div>
              <p className="eyebrow">{item.sources[0]?.source.title}</p>
              <h2>{easy?.content ?? item.title}</h2>
              {item.chineseIntention ? (
                <p className="translation">{item.chineseIntention}</p>
              ) : null}
              <details>
                <summary>Original context</summary>
                <blockquote>{item.originalText}</blockquote>
              </details>
              <footer>
                <span>{item._count.reviewEvents} reviews</span>
                <span>{item._count.usageEvents} real uses</span>
                <button
                  className="text-button"
                  onClick={() =>
                    setLoggingId((current) =>
                      current === item.id ? undefined : item.id
                    )
                  }
                  type="button"
                >
                  Log real use
                </button>
              </footer>
              {loggingId === item.id ? (
                <form
                  className="usage-form"
                  onSubmit={(event) => void submitUsage(event, item.id)}
                >
                  <label>
                    Scenario
                    <input name="scenario" placeholder="e.g. group meeting" />
                  </label>
                  <label>
                    Outcome
                    <select defaultValue="used" name="outcome">
                      <option value="used">Used successfully</option>
                      <option value="partly_used">Partly used</option>
                      <option value="missed">Missed the chance</option>
                      <option value="needs_revision">Needs revision</option>
                    </select>
                  </label>
                  <label>
                    Notes
                    <textarea name="notes" rows={2} />
                  </label>
                  <button className="primary-button" type="submit">
                    Save usage
                  </button>
                </form>
              ) : null}
            </article>
          );
        })}
        {items.length === 0 ? (
          <div className="empty-state">
            <h2>No learning items yet</h2>
            <p>Open a source, select one useful segment, and rewrite it.</p>
          </div>
        ) : null}
      </section>
    </>
  );
}
