"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { api } from "../lib/api";

interface Dashboard {
  sources: number;
  curatedSources: number;
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
      .catch((reason: Error) => setError(reason.message));
  }, []);

  return (
    <>
      <section className="hero">
        <div>
          <p className="eyebrow">Local curated corpus · Today</p>
          <h1>Refine first. Review what matters.</h1>
          <p className="lede">
            Codex prepares each source; the database stores only clean,
            traceable bilingual sentences.
          </p>
        </div>
        <Link className="primary-button" href="/sources">
          Open curated sources
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
                )} due sentences`
              : "Ask Codex to curate the next source"}
          </h2>
          <p>
            The queue is capped at {dashboard?.dailyReviewLimit ?? 10} items per
            day.
          </p>
          <Link
            className="text-link"
            href={dashboard?.dueReviews ? "/review" : "/sources"}
          >
            {dashboard?.dueReviews ? "Start review →" : "Open sources →"}
          </Link>
        </article>

        <article className="panel">
          <p className="eyebrow">Curated database</p>
          <h2>{dashboard?.curatedSources ?? "—"} sources ready</h2>
          <p>
            Raw media and text stay outside the learning database until Codex
            has produced both evidence and refined bilingual versions.
          </p>
        </article>
      </section>
    </>
  );
}
