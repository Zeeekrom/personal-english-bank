"use client";

import { FormEvent, useCallback, useEffect, useState } from "react";
import { API_URL, api } from "../../lib/api";

interface LearningItem {
  id: string;
  title: string;
  refinedEnglish?: string;
  refinedChinese?: string;
  chineseIntention?: string;
  mainIssue?: string;
  originalText?: string;
  usageMode: string;
  learningStatus: string;
  lastUsedAt?: string;
  variants: Array<{ id: string; variantType: string; content: string }>;
  sources: Array<{
    source: { id: string; title: string; capturedAt?: string };
  }>;
  _count: { usageEvents: number; reviewEvents: number };
}

export default function LearningPage() {
  const [items, setItems] = useState<LearningItem[]>([]);
  const [query, setQuery] = useState("");
  const [editingId, setEditingId] = useState<string>();
  const [loggingId, setLoggingId] = useState<string>();
  const [message, setMessage] = useState("");

  const load = useCallback(
    () =>
      api<LearningItem[]>(
        `/learning-items${query ? `?q=${encodeURIComponent(query)}` : ""}`,
      ).then(setItems),
    [query],
  );
  useEffect(() => {
    load().catch((error: Error) => setMessage(error.message));
  }, [load]);

  async function updateItem(event: FormEvent<HTMLFormElement>, itemId: string) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api(`/learning-items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: form.get("title"),
        refinedEnglish: form.get("refinedEnglish"),
        refinedChinese: form.get("refinedChinese"),
        chineseIntention: form.get("chineseIntention") || null,
        mainIssue: form.get("mainIssue") || null,
      }),
    });
    setEditingId(undefined);
    setMessage("Sentence updated.");
    await load();
  }

  async function deleteItem(itemId: string) {
    if (!window.confirm("Delete this sentence and its review history?")) return;
    await api(`/learning-items/${itemId}`, { method: "DELETE" });
    setMessage("Sentence deleted.");
    await load();
  }

  async function submitUsage(
    event: FormEvent<HTMLFormElement>,
    itemId: string,
  ) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api(`/learning-items/${itemId}/usage`, {
      method: "POST",
      body: JSON.stringify({
        scenario: form.get("scenario") || undefined,
        outcome: form.get("outcome"),
        notes: form.get("notes") || undefined,
      }),
    });
    setMessage("Real-world usage recorded.");
    setLoggingId(undefined);
    await load();
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Sentence database</p>
          <h1>Learning bank</h1>
          <p>
            {items.length} curated bilingual sentences with source evidence.
          </p>
        </div>
        <div className="search-box">
          <label htmlFor="learning-search">Search English or Chinese</label>
          <input
            id="learning-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. follow up"
            value={query}
          />
        </div>
        <a className="primary-button" href={`${API_URL}/api/exports/markdown`}>
          Export Markdown
        </a>
      </section>
      {message ? <p className="notice">{message}</p> : null}
      <section className="learning-list">
        {items.map((item) => {
          const english =
            item.refinedEnglish ??
            item.variants.find(
              (variant) => variant.variantType === "easy_active",
            )?.content ??
            item.title;
          return (
            <article className="learning-card" key={item.id}>
              <div className="card-topline">
                <span className={`status status-${item.learningStatus}`}>
                  {item.learningStatus}
                </span>
                <span>
                  {item.sources[0]?.source.capturedAt
                    ? new Date(
                        item.sources[0].source.capturedAt,
                      ).toLocaleDateString()
                    : "Date unknown"}
                </span>
              </div>
              <p className="eyebrow">{item.sources[0]?.source.title}</p>
              <h2>{english}</h2>
              <p className="translation">
                {item.refinedChinese ?? item.chineseIntention}
              </p>
              {item.mainIssue ? (
                <details>
                  <summary>Main issue and raw evidence</summary>
                  <p>{item.mainIssue}</p>
                  <blockquote>{item.originalText}</blockquote>
                </details>
              ) : null}
              <footer>
                <span>{item._count.reviewEvents} reviews</span>
                <span>{item._count.usageEvents} real uses</span>
                <button
                  className="text-button"
                  onClick={() =>
                    setEditingId((current) =>
                      current === item.id ? undefined : item.id,
                    )
                  }
                  type="button"
                >
                  Edit
                </button>
                <button
                  className="text-button"
                  onClick={() =>
                    setLoggingId((current) =>
                      current === item.id ? undefined : item.id,
                    )
                  }
                  type="button"
                >
                  Log use
                </button>
                <button
                  className="text-button"
                  onClick={() => void deleteItem(item.id)}
                  type="button"
                >
                  Delete
                </button>
              </footer>
              {editingId === item.id ? (
                <form
                  className="usage-form"
                  onSubmit={(event) => void updateItem(event, item.id)}
                >
                  <label>
                    Title
                    <input defaultValue={item.title} name="title" required />
                  </label>
                  <label>
                    Refined English
                    <textarea
                      defaultValue={english}
                      name="refinedEnglish"
                      required
                      rows={3}
                    />
                  </label>
                  <label>
                    Refined Chinese
                    <textarea
                      defaultValue={
                        item.refinedChinese ?? item.chineseIntention
                      }
                      name="refinedChinese"
                      required
                      rows={3}
                    />
                  </label>
                  <label>
                    Intended meaning in Chinese
                    <textarea
                      defaultValue={item.chineseIntention}
                      name="chineseIntention"
                      rows={2}
                    />
                  </label>
                  <label>
                    Main issue
                    <textarea
                      defaultValue={item.mainIssue}
                      name="mainIssue"
                      rows={2}
                    />
                  </label>
                  <button className="primary-button" type="submit">
                    Save sentence
                  </button>
                </form>
              ) : null}
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
            <h2>No curated sentences found</h2>
            <p>Ask Codex to process a source and import its curated package.</p>
          </div>
        ) : null}
      </section>
    </>
  );
}
