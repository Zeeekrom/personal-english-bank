"use client";

import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api, formatTimestamp } from "../../../lib/api";

interface Segment {
  id: string;
  segmentIndex: number;
  startMs?: number;
  text: string;
  translationText?: string;
  rawText?: string;
  rawTranslationText?: string;
  curationNotes?: string;
  diarizationKey?: string;
}

interface SourceDetail {
  id: string;
  title: string;
  sourceType: string;
  language: string;
  scenario?: string;
  summaryCn?: string;
  capturedAt?: string;
  processingStatus: string;
  assets: Array<{ relativePath: string; originalName: string }>;
  transcripts: Array<{
    id: string;
    provider: string;
    format: string;
    sourceText?: string;
    originalText: string;
    cleanedText?: string;
    segments: Segment[];
  }>;
}

export default function SourceDetailPage() {
  const params = useParams<{ id: string }>();
  const router = useRouter();
  const [source, setSource] = useState<SourceDetail>();
  const [message, setMessage] = useState("");

  const load = () =>
    api<SourceDetail>(`/sources/${params.id}`)
      .then(setSource)
      .catch((error: Error) => setMessage(error.message));

  useEffect(() => {
    void load();
  }, [params.id]);

  async function updateSource(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api(`/sources/${params.id}`, {
      method: "PATCH",
      body: JSON.stringify({
        title: form.get("title"),
        summaryCn: form.get("summaryCn"),
        scenario: form.get("scenario") || null,
        capturedAt: form.get("capturedAt")
          ? new Date(String(form.get("capturedAt"))).toISOString()
          : null,
      }),
    });
    setMessage("Source metadata updated.");
    await load();
  }

  async function deleteSource() {
    if (
      !window.confirm(
        "Delete this source and all of its derived sentences and review history?",
      )
    ) {
      return;
    }
    await api(`/sources/${params.id}`, { method: "DELETE" });
    router.push("/sources");
  }

  if (!source) return <p className="loading">Loading source… {message}</p>;
  const transcript = source.transcripts[0];

  return (
    <>
      <Link className="back-link" href="/sources">
        ← Sources
      </Link>
      <section className="page-heading">
        <div>
          <p className="eyebrow">
            {source.sourceType.replaceAll("_", " ")} · {transcript?.provider}
          </p>
          <h1>{source.title}</h1>
          <p>{source.summaryCn}</p>
        </div>
        <span className={`status status-${source.processingStatus}`}>
          {source.processingStatus}
        </span>
      </section>
      {message ? <p className="notice">{message}</p> : null}

      <section className="panel">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Source metadata</p>
            <h2>File, date and summary</h2>
          </div>
          <button
            className="quiet-button"
            onClick={() => void deleteSource()}
            type="button"
          >
            Delete source
          </button>
        </div>
        <form className="usage-form" onSubmit={updateSource}>
          <label>
            Title
            <input defaultValue={source.title} name="title" required />
          </label>
          <label>
            Original file
            <input
              disabled
              value={
                source.assets[0]?.originalName ??
                source.assets[0]?.relativePath ??
                ""
              }
            />
          </label>
          <label>
            Occurred at
            <input
              defaultValue={
                source.capturedAt
                  ? new Date(source.capturedAt).toISOString().slice(0, 16)
                  : ""
              }
              name="capturedAt"
              type="datetime-local"
            />
          </label>
          <label>
            Scenario
            <input defaultValue={source.scenario} name="scenario" />
          </label>
          <label>
            Chinese summary
            <textarea
              defaultValue={source.summaryCn}
              name="summaryCn"
              required
              rows={3}
            />
          </label>
          <button className="primary-button" type="submit">
            Save source
          </button>
        </form>
      </section>

      <div className="transcript-layout">
        <section className="transcript-panel">
          <div className="panel-heading">
            <div>
              <p className="eyebrow">Database version</p>
              <h2>Curated bilingual sentences</h2>
            </div>
            <span>{transcript?.segments.length ?? 0} sentences</span>
          </div>
          <div className="segment-list">
            {transcript?.segments.map((segment) => (
              <article className="segment" key={segment.id}>
                <div className="segment-meta">
                  <span>
                    {formatTimestamp(segment.startMs) ||
                      `#${segment.segmentIndex + 1}`}
                  </span>
                  <strong>{segment.diarizationKey ?? "Curated"}</strong>
                </div>
                <p>{segment.text}</p>
                <p className="translation">{segment.translationText}</p>
                {segment.rawText || segment.rawTranslationText ? (
                  <details>
                    <summary>Raw evidence and curation note</summary>
                    {segment.rawText ? (
                      <blockquote>{segment.rawText}</blockquote>
                    ) : null}
                    {segment.rawTranslationText ? (
                      <p className="translation">
                        {segment.rawTranslationText}
                      </p>
                    ) : null}
                    {segment.curationNotes ? (
                      <p>{segment.curationNotes}</p>
                    ) : null}
                  </details>
                ) : null}
              </article>
            ))}
          </div>
        </section>

        <aside className="editor-panel">
          <p className="eyebrow">Preview guarantee</p>
          <h2>The complete file is available below</h2>
          <p>
            No line limit, excerpt, pagination or API truncation is applied.
            Long content remains scrollable in the browser, and every character
            returned by the source file is present.
          </p>
          <dl className="content-stats">
            <div>
              <dt>Original file</dt>
              <dd>{transcript?.sourceText?.length ?? 0} characters</dd>
            </div>
            <div>
              <dt>Raw bilingual</dt>
              <dd>{transcript?.originalText.length ?? 0} characters</dd>
            </div>
            <div>
              <dt>Refined bilingual</dt>
              <dd>{transcript?.cleanedText?.length ?? 0} characters</dd>
            </div>
          </dl>
        </aside>
      </div>

      <section className="panel full-document-preview">
        <div className="panel-heading">
          <div>
            <p className="eyebrow">Full-file preview</p>
            <h2>Complete source and bilingual versions</h2>
          </div>
        </div>
        <details open>
          <summary>
            Original file · {transcript?.sourceText?.length ?? 0} characters
          </summary>
          <pre className="full-document-text">{transcript?.sourceText}</pre>
        </details>
        <details>
          <summary>
            Raw bilingual evidence · {transcript?.originalText.length ?? 0}{" "}
            characters
          </summary>
          <pre className="full-document-text">{transcript?.originalText}</pre>
        </details>
        <details>
          <summary>
            Refined bilingual version · {transcript?.cleanedText?.length ?? 0}{" "}
            characters
          </summary>
          <pre className="full-document-text">{transcript?.cleanedText}</pre>
        </details>
      </section>
    </>
  );
}
