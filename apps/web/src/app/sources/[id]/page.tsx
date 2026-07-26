"use client";

import Link from "next/link";
import { useParams } from "next/navigation";
import { FormEvent, useEffect, useState } from "react";
import { api, formatTimestamp } from "../../../lib/api";

interface Segment {
  id: string;
  segmentIndex: number;
  startMs?: number;
  text: string;
  translationText?: string;
  diarizationKey?: string;
  manuallyVerified: boolean;
  speaker?: { displayName: string; isMe: boolean };
}

interface SourceDetail {
  id: string;
  title: string;
  language: string;
  processingStatus: string;
  assets: Array<{ relativePath: string }>;
  transcripts: Array<{
    id: string;
    provider: string;
    format: string;
    segments: Segment[];
  }>;
  interactionLogs: Array<{
    id: string;
    eventTitle: string;
    scenario?: string;
    reflection?: string;
  }>;
}

export default function SourceDetailPage() {
  const params = useParams<{ id: string }>();
  const [source, setSource] = useState<SourceDetail>();
  const [selected, setSelected] = useState<Segment>();
  const [message, setMessage] = useState("");

  const load = () =>
    api<SourceDetail>(`/sources/${params.id}`).then(setSource).catch((error: Error) => {
      setMessage(error.message);
    });

  useEffect(() => {
    void load();
  }, [params.id]);

  async function markAsMe(segment: Segment) {
    await api(`/sources/segments/${segment.id}/speaker`, {
      method: "PATCH",
      body: JSON.stringify({
        displayName: "Evan",
        role: "evan",
        isMe: true,
        applyToDiarizationKey: false
      })
    });
    setMessage("Segment marked as Evan.");
    await load();
  }

  async function createLearningItem(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    if (!selected) return;
    const form = new FormData(event.currentTarget);
    await api("/learning-items", {
      method: "POST",
      body: JSON.stringify({
        segmentId: selected.id,
        title: form.get("title"),
        chineseIntention: form.get("chineseIntention") || undefined,
        easyActiveVersion: form.get("easyActiveVersion"),
        minimumCorrection: form.get("minimumCorrection") || undefined,
        naturalVersion: form.get("naturalVersion") || undefined,
        usageMode: form.get("usageMode")
      })
    });
    setMessage("Learning item created. First review is scheduled for tomorrow.");
    setSelected(undefined);
    await load();
  }

  async function createInteraction(event: FormEvent<HTMLFormElement>) {
    event.preventDefault();
    const form = new FormData(event.currentTarget);
    await api(`/sources/${params.id}/interactions`, {
      method: "POST",
      body: JSON.stringify({
        eventTitle: form.get("eventTitle"),
        scenario: form.get("scenario") || undefined,
        whatHappened: form.get("whatHappened") || undefined,
        whatISaid: form.get("whatISaid") || undefined,
        whatIIntended: form.get("whatIIntended") || undefined,
        whatWentWrong: form.get("whatWentWrong") || undefined,
        betterVersion: form.get("betterVersion") || undefined,
        reflection: form.get("reflection") || undefined
      })
    });
    event.currentTarget.reset();
    setMessage("Interaction reflection saved.");
    await load();
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
            {transcript?.provider} · {transcript?.format}
          </p>
          <h1>{source.title}</h1>
          <p>{source.assets[0]?.relativePath}</p>
        </div>
        <span className={`status status-${source.processingStatus}`}>
          {source.processingStatus.replace("_", " ")}
        </span>
      </section>
      {message ? <p className="notice">{message}</p> : null}

      <div className="transcript-layout">
        <section className="transcript-panel">
          <div className="panel-heading">
            <h2>Transcript</h2>
            <span>{transcript?.segments.length ?? 0} segments</span>
          </div>
          <div className="segment-list">
            {transcript?.segments.map((segment) => (
              <article
                className={`segment ${selected?.id === segment.id ? "selected" : ""}`}
                key={segment.id}
              >
                <div className="segment-meta">
                  <span>{formatTimestamp(segment.startMs) || `#${segment.segmentIndex + 1}`}</span>
                  <strong className={segment.speaker?.isMe ? "speaker-me" : ""}>
                    {segment.speaker?.displayName ??
                      segment.diarizationKey ??
                      "Unknown"}
                  </strong>
                </div>
                <p>{segment.text}</p>
                {segment.translationText ? (
                  <p className="translation">{segment.translationText}</p>
                ) : null}
                <div className="segment-actions">
                  <button
                    className="quiet-button"
                    onClick={() => void markAsMe(segment)}
                    type="button"
                  >
                    This is me
                  </button>
                  <button
                    className="text-button"
                    onClick={() => setSelected(segment)}
                    type="button"
                  >
                    Create learning item →
                  </button>
                </div>
              </article>
            ))}
          </div>
        </section>

        <aside className="editor-panel">
          {selected ? (
            <form onSubmit={createLearningItem}>
              <p className="eyebrow">Manual review</p>
              <h2>Create an active expression</h2>
              <blockquote>{selected.text}</blockquote>
              <label>
                Short title
                <input defaultValue={source.title} maxLength={500} name="title" required />
              </label>
              <label>
                What I meant in Chinese
                <textarea
                  defaultValue={selected.translationText}
                  name="chineseIntention"
                  rows={3}
                />
              </label>
              <label>
                Easy Active English
                <textarea
                  autoFocus
                  name="easyActiveVersion"
                  placeholder="A simple sentence I can say next time."
                  required
                  rows={4}
                />
              </label>
              <details>
                <summary>Optional alternative versions</summary>
                <label>
                  Minimum correction
                  <textarea name="minimumCorrection" rows={3} />
                </label>
                <label>
                  Natural version
                  <textarea name="naturalVersion" rows={3} />
                </label>
              </details>
              <label>
                Usage mode
                <select defaultValue="active_use" name="usageMode">
                  <option value="active_use">Active use</option>
                  <option value="understand_only">Understand only</option>
                </select>
              </label>
              <button className="primary-button" type="submit">
                Save and schedule review
              </button>
            </form>
          ) : (
            <div className="empty-editor">
              <span>01</span>
              <h2>Select one useful fragment</h2>
              <p>
                Keep the original as evidence, then write the easiest natural
                version you can genuinely use.
              </p>
            </div>
          )}
        </aside>
      </div>

      <section className="panel interaction-section">
        <div>
          <p className="eyebrow">Interaction log</p>
          <h2>Reflect on the whole conversation</h2>
          <p>
            Keep this concise. Segment-level expressions belong in the learning
            bank.
          </p>
          {source.interactionLogs.map((log) => (
            <article className="interaction-summary" key={log.id}>
              <strong>{log.eventTitle}</strong>
              <span>{log.scenario || "No scenario"}</span>
              {log.reflection ? <p>{log.reflection}</p> : null}
            </article>
          ))}
        </div>
        <form onSubmit={createInteraction}>
          <label>
            Event title
            <input defaultValue={source.title} name="eventTitle" required />
          </label>
          <label>
            Scenario
            <input name="scenario" placeholder="e.g. bank, tutorial, project meeting" />
          </label>
          <label>
            What happened
            <textarea name="whatHappened" rows={2} />
          </label>
          <label>
            What I said / intended
            <textarea name="whatISaid" placeholder="What I actually said" rows={2} />
            <textarea
              name="whatIIntended"
              placeholder="What I wanted to communicate"
              rows={2}
            />
          </label>
          <label>
            Main problem and better version
            <textarea name="whatWentWrong" rows={2} />
            <textarea name="betterVersion" rows={2} />
          </label>
          <label>
            Reflection
            <textarea name="reflection" rows={2} />
          </label>
          <button className="primary-button" type="submit">
            Save interaction log
          </button>
        </form>
      </section>
    </>
  );
}
