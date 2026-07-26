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
      api<Source[]>(`/sources${query ? `?q=${encodeURIComponent(query)}` : ""}`),
      api<DiscoveredFile[]>("/imports/discover")
    ]);
    setSources(sourceData);
    setDiscovered(fileData);
  }, [query]);

  useEffect(() => {
    load().catch((error: Error) => setMessage(error.message));
  }, [load]);

  const importedPaths = useMemo(
    () => new Set(sources.flatMap((source) => source.assets.map((asset) => asset.relativePath))),
    [sources]
  );
  const available = discovered.filter(
    (file) => !importedPaths.has(file.relativePath)
  );

  async function importSelected() {
    setBusy(true);
    setMessage("");
    try {
      const result = await api<
        Array<{ status: string; relativePath: string; segments?: number }>
      >("/imports", {
        method: "POST",
        body: JSON.stringify({ relativePaths: selected })
      });
      const imported = result.filter((item) => item.status === "imported");
      setMessage(
        `Imported ${imported.length} source${imported.length === 1 ? "" : "s"} with ${imported.reduce(
          (total, item) => total + (item.segments ?? 0),
          0
        )} segments.`
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
          <p className="eyebrow">Inbox</p>
          <h1>Sources</h1>
          <p>Import read-only transcript files and process them in context.</p>
        </div>
        <div className="search-box">
          <label htmlFor="source-search">Search sources or transcript text</label>
          <input
            id="source-search"
            onChange={(event) => setQuery(event.target.value)}
            placeholder="e.g. consultation"
            value={query}
          />
        </div>
      </section>

      <section className="panel import-panel">
        <div>
          <p className="eyebrow">Translation folder</p>
          <h2>Choose files to import</h2>
          <p>{available.length} supported files have not been imported.</p>
        </div>
        <div className="import-list">
          {available.slice(0, 20).map((file) => (
            <label className="check-row" key={file.relativePath}>
              <input
                checked={selected.includes(file.relativePath)}
                disabled={!selected.includes(file.relativePath) && selected.length >= 5}
                onChange={(event) =>
                  setSelected((current) =>
                    event.target.checked
                      ? [...current, file.relativePath]
                      : current.filter((item) => item !== file.relativePath)
                  )
                }
                type="checkbox"
              />
              <span>
                <strong>{file.relativePath}</strong>
                <small>{Math.max(1, Math.round(file.byteSize / 1024))} KB</small>
              </span>
            </label>
          ))}
        </div>
        <button
          className="primary-button"
          disabled={busy || selected.length === 0}
          onClick={importSelected}
          type="button"
        >
          {busy ? "Importing…" : `Import selected (${selected.length}/5)`}
        </button>
        {message ? <p className="notice">{message}</p> : null}
      </section>

      <section className="source-grid">
        {sources.map((source) => (
          <Link className="source-card" href={`/sources/${source.id}`} key={source.id}>
            <div className="card-topline">
              <span className={`status status-${source.processingStatus}`}>
                {source.processingStatus.replace("_", " ")}
              </span>
              <span>{source.language}</span>
            </div>
            <h2>{source.title}</h2>
            <p>{source.assets[0]?.relativePath}</p>
            <footer>
              <span>{source.sourceType.replaceAll("_", " ")}</span>
              <span>{source._count.learningLinks} learning items</span>
            </footer>
          </Link>
        ))}
      </section>
    </>
  );
}
