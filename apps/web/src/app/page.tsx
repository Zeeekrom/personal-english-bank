"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Dashboard {
  sources: number;
  unprocessedSources: number;
  learningItems: number;
  dueReviews: number;
  usageEvents: number;
  dailyReviewLimit: number;
}

export default function DashboardPage() {
  const [dashboard, setDashboard] = useState<Dashboard>();
  const [error, setError] = useState("");

  useEffect(() => {
    api<Dashboard>("/dashboard")
      .then(setDashboard)
      .catch((reason: Error) => {
        setError(reason.message);
      });
  }, []);

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">MVP v0.1 · Today</p>
          <h1>Learn less. Use more.</h1>
          <p className="lede">
            Turn one real transcript fragment into one sentence you can actually
            say next time.
          </p>
        </div>
        <Link className="primary-button" href="/sources">
          Process a source
        </Link>
      </section>

      {error ? <p className="error">API unavailable: {error}</p> : null}
      <section className="metrics" aria-label="Learning overview">
        {[
          ["Due today", dashboard?.dueReviews ?? "—", "/review"],
          ["Learning items", dashboard?.learningItems ?? "—", "/learning"],
          ["Sources", dashboard?.sources ?? "—", "/sources"],
          ["Used in real life", dashboard?.usageEvents ?? "—", "/learning"],
        ].map(([label, value, href]) => (
          <Link className="metric-card" href={String(href)} key={String(label)}>
            <span>{label}</span>
            <strong>{value}</strong>
          </Link>
        ))}
      </section>

      <section className="two-column">
        <article className="panel focus-panel">
          <p className="eyebrow">Recommended next action</p>
          <h2>
            {dashboard?.dueReviews
              ? `Review ${Math.min(
                  dashboard.dueReviews,
                  dashboard.dailyReviewLimit,
                )} due expressions`
              : "Create one active expression"}
          </h2>
          <p>
            The queue is intentionally capped at{" "}
            {dashboard?.dailyReviewLimit ?? 10} items per day.
          </p>
          <Link
            className="text-link"
            href={dashboard?.dueReviews ? "/review" : "/sources"}
          >
            {dashboard?.dueReviews ? "Start review →" : "Open sources →"}
          </Link>
        </article>

        <article className="panel">
          <p className="eyebrow">Source inbox</p>
          <h2>{dashboard?.unprocessedSources ?? "—"} need review</h2>
          <p>
            Imported transcripts stay as evidence. Nothing becomes a learning
            item until you select and rewrite it.
          </p>
        </article>
      </section>
    </>
  );
}
