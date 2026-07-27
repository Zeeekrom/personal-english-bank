"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { api } from "../../lib/api";

interface DiscoveredFile {
  relativePath: string;
  byteSize: number;
  extension: string;
}

interface Source {
  id: string;
  title: string;
  sourceType: string;
  language: string;
  summaryCn?: string;
  capturedAt?: string;
  processingStatus: string;
  importedAt: string;
  assets: Array<{ relativePath: string; byteSize: number }>;
  _count: { transcripts: number; learningLinks: number };
}

export default function SourcesPage() {
  const [sources, setSources] = useState<Source[]>([]);
  const [discovered, setDiscovered] = useState<DiscoveredFile[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [query, setQuery] = useState("");
  const [message, setMessage] = useState("");
  const [busy, setBusy] = useState(false);

  const load = useCallback(async () => {
    const [sourceData, fileData] = await Promise.all([
      api<Source[]>(
        `/sources${query ? `?q=${encodeURIComponent(query)}` : ""}`,
      ),
      api<DiscoveredFile[]>("/imports/discover"),
    ]);
    setSources(sourceData);
    setDiscovered(fileData);
  }, [query]);

  useEffect(() => {
    load().catch((error: Error) => setMessage(error.message));
  }, [load]);

  const importedPaths = useMemo(
    () =>
      new Set(
        sources.flatMap((source) =>
          source.assets.map((asset) => asset.relativePath),
        ),
      ),
    [sources],
  );
  const available = discovered.filter(
    (file) => !importedPaths.has(file.relativePath),
  );

  async function importSelected() {
    setBusy(true);
    setMessage("");
    try {
      const result = await api<
        Array<{ status: string; relativePath: string; segments?: number }>
      >("/imports", {
        method: "POST",
        body: JSON.stringify({ relativePaths: selected }),
      });
      const imported = result.filter((item) => item.status === "imported");
      setMessage(
        `Imported ${imported.length} curated source${imported.length === 1 ? "" : "s"} and ${imported.reduce(
          (total, item) => total + (item.segments ?? 0),
          0,
        )} review sentences.`,
      );
      setSelected([]);
      await load();
    } catch (error) {
      setMessage((error as Error).message);
    } finally {
      setBusy(false);
    }
  }

  return (
    <>
      <section className="page-heading">
        <div>
          <p className="eyebrow">Curated corpus</p>
          <h1>Sources</h1>
          <p>
            Only Codex-curated bilingual packages enter the learning database.
          </p>
        </div>
        <div className="search-box">
          <label htmlFor="source-search">
            Search file, summary, English or Chinese
          </label>
          <input
            id="source-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. bank appointment"
            value={query}
          />
        </div>
      </section>

      <section className="panel import-panel">
        <div>
          <p className="eyebrow">Ready for database import</p>
          <h2>Curated import packages</h2>
          <p>
            Audio/video and raw text must first be transcribed, translated and
            refined by Codex. This inbox accepts only{" "}
            <code>*.curated.json</code>.
          </p>
          <Link className="text-link" href="/import">
            Upload or paste GPT JSON
          </Link>
        </div>
        <div className="import-list">
          {available.slice(0, 20).map((file) => (
            <label className="check-row" key={file.relativePath}>
              <input
                checked={selected.includes(file.relativePath)}
                disabled={
                  !selected.includes(file.relativePath) && selected.length >= 20
                }
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, file.relativePath]
                      : current.filter((item) => item !== file.relativePath),
                  )
                }
                type="checkbox"
              />
              <span>
                <strong>{file.relativePath}</strong>
                <small>
                  {Math.max(1, Math.round(file.byteSize / 1024))} KB
                </small>
              </span>
            </label>
          ))}
          {available.length === 0 ? (
            <p className="notice">No new curated package is waiting.</p>
          ) : null}
        </div>
        <button
          className="primary-button"
          disabled={busy || selected.length === 0}
          onClick={importSelected}
          type="button"
        >
          {busy ? "Importing…" : `Import selected (${selected.length}/20)`}
        </button>
        {message ? <p className="notice">{message}</p> : null}
      </section>

      <section className="source-grid">
        {sources.map((source) => (
          <Link
            className="source-card"
            href={`/sources/${source.id}`}
            key={source.id}
          >
            <div className="card-topline">
              <span className={`status status-${source.processingStatus}`}>
                {source.processingStatus.replace("_", " ")}
              </span>
              <span>
                {source.capturedAt
                  ? new Date(source.capturedAt).toLocaleDateString()
                  : "Date unknown"}
              </span>
            </div>
            <h2>{source.title}</h2>
            <p>{source.summaryCn ?? "No summary"}</p>
            <footer>
              <span>{source.sourceType.replaceAll("_", " ")}</span>
              <span>{source._count.learningLinks} curated sentences</span>
            </footer>
          </Link>
        ))}
      </section>
    </>
  );
}
