"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import type { ChangeEvent } from "react";
import { api } from "../../lib/api";
import { parseCuratedPackageText } from "../../lib/curated-import-client";
import type { PackageInspection } from "../../lib/curated-import-client";
import { GPT_IMPORT_PROMPT } from "../../lib/gpt-import-prompt";

const MAX_FILE_BYTES = 10 * 1024 * 1024;

interface ImportResult {
  relativePath: string;
  sourceId?: string;
  status: "imported" | "duplicate" | "skipped";
  segments?: number;
  reason?: string;
}

function readableError(error: unknown): string {
  const fallback = error instanceof Error ? error.message : String(error);
  try {
    const parsed = JSON.parse(fallback) as {
      message?: string;
      issues?: Array<{ path?: Array<string | number>; message?: string }>;
    };
    if (parsed.issues?.length) {
      return parsed.issues
        .map((issue) => `${issue.path?.join(".") || "JSON"}：${issue.message}`)
        .join("；");
    }
    return parsed.message ?? fallback;
  } catch {
    return fallback;
  }
}

export default function ImportPage() {
  const [jsonText, setJsonText] = useState("");
  const [fileName, setFileName] = useState("");
  const [inspection, setInspection] = useState<PackageInspection | null>(null);
  const [error, setError] = useState("");
  const [message, setMessage] = useState("");
  const [sourceId, setSourceId] = useState("");
  const [busy, setBusy] = useState(false);
  const [copied, setCopied] = useState(false);

  const sizeLabel = useMemo(
    () =>
      jsonText
        ? `${Math.max(1, Math.ceil(new Blob([jsonText]).size / 1024)).toLocaleString()} KB`
        : "0 KB",
    [jsonText],
  );

  function recognize(text: string, selectedFileName = "") {
    setJsonText(text);
    setFileName(selectedFileName);
    setMessage("");
    setSourceId("");
    if (new Blob([text]).size > MAX_FILE_BYTES) {
      setInspection(null);
      setError("内容超过 10 MB。请按一个来源文件一个 JSON 包拆分后再导入。");
      return;
    }
    try {
      const result = parseCuratedPackageText(text);
      setInspection(result.inspection);
      setError("");
    } catch (caught) {
      setInspection(null);
      setError(readableError(caught));
    }
  }

  async function selectFile(event: ChangeEvent<HTMLInputElement>) {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > MAX_FILE_BYTES) {
      setInspection(null);
      setError("文件超过 10 MB。请按一个来源文件一个 JSON 包拆分后再导入。");
      return;
    }
    recognize(await file.text(), file.name);
    event.target.value = "";
  }

  async function submit() {
    setBusy(true);
    setError("");
    setMessage("");
    try {
      const { decoded } = parseCuratedPackageText(jsonText);
      const result = await api<ImportResult>("/imports/curated", {
        method: "POST",
        body: JSON.stringify(decoded),
      });
      if (result.status === "imported") {
        setMessage(
          `导入成功：已创建 1 个来源和 ${result.segments ?? 0} 条学习句。`,
        );
      } else if (result.status === "duplicate") {
        setMessage("该内容已经导入过，系统按内容哈希识别为重复来源。");
      } else {
        setMessage(result.reason ?? "该导入包已跳过。");
      }
      setSourceId(result.sourceId ?? "");
    } catch (caught) {
      setError(readableError(caught));
    } finally {
      setBusy(false);
    }
  }

  async function copyPrompt() {
    await navigator.clipboard.writeText(GPT_IMPORT_PROMPT);
    setCopied(true);
    window.setTimeout(() => setCopied(false), 1800);
  }

  return (
    <div lang="zh-CN">
      <section className="page-heading import-heading">
        <div>
          <p className="eyebrow">GPT curated package</p>
          <h1>导入整理好的语料</h1>
          <p>
            GPT 在系统外完成整理；这里负责识别、严格校验、去重并写入数据库。
          </p>
        </div>
        <span className="phase-badge">Contract 1.0 · Local only</span>
      </section>

      <section className="import-method-grid">
        <article className="import-method-card active">
          <span>01</span>
          <h2>上传 JSON</h2>
          <p>
            选择 UTF-8 编码的 <code>.json</code> 或 <code>.curated.json</code>
            ，单文件不超过 10 MB。
          </p>
        </article>
        <article className="import-method-card">
          <span>02</span>
          <h2>粘贴 JSON</h2>
          <p>直接粘贴 GPT 的完整输出。不能包含代码块、注释或额外说明。</p>
        </article>
        <article className="import-method-card">
          <span>03</span>
          <h2>Translation 文件夹</h2>
          <p>
            文件夹扫描只识别 <code>*.curated.json</code>。{" "}
            <Link className="text-link" href="/sources">
              前往批量导入
            </Link>
          </p>
        </article>
      </section>

      <section className="import-workspace">
        <article className="panel json-import-panel">
          <div className="panel-heading import-panel-heading">
            <div>
              <p className="eyebrow">Package input</p>
              <h2>选择文件或粘贴内容</h2>
            </div>
            <label className="file-button">
              选择 JSON 文件
              <input
                accept=".json,application/json"
                onChange={selectFile}
                type="file"
              />
            </label>
          </div>
          <div className="json-editor-wrap">
            <div className="json-editor-meta">
              <span>{fileName || "尚未选择文件"}</span>
              <span>{sizeLabel}</span>
            </div>
            <textarea
              aria-label="Curated Import Package JSON"
              className="json-editor"
              onChange={(event) => recognize(event.target.value)}
              placeholder='粘贴以 {"contractVersion":"1.0", ...} 开头的完整 JSON'
              spellCheck={false}
              value={jsonText}
            />
            {error ? <p className="error">{error}</p> : null}
            {message ? (
              <p className="notice">
                {message}{" "}
                {sourceId ? (
                  <Link className="text-link" href={`/sources/${sourceId}`}>
                    查看来源
                  </Link>
                ) : null}
              </p>
            ) : null}
            <button
              className="primary-button"
              disabled={busy || !inspection}
              onClick={submit}
              type="button"
            >
              {busy ? "正在校验并导入…" : "校验并导入数据库"}
            </button>
          </div>
        </article>

        <aside className="panel package-inspection">
          <p className="eyebrow">Recognition result</p>
          <h2>{inspection ? "格式初检通过" : "等待可识别的 JSON"}</h2>
          {inspection ? (
            <dl className="inspection-list">
              <div>
                <dt>来源</dt>
                <dd>{inspection.title}</dd>
              </div>
              <div>
                <dt>原文件</dt>
                <dd>{inspection.originalFileName}</dd>
              </div>
              <div>
                <dt>输入类型</dt>
                <dd>{inspection.inputType}</dd>
              </div>
              <div>
                <dt>整理来源</dt>
                <dd>{inspection.curatedBy}</dd>
              </div>
              <div>
                <dt>完整原文</dt>
                <dd>{inspection.sourceCharacters.toLocaleString()} 字符</dd>
              </div>
              <div>
                <dt>原始双语</dt>
                <dd>
                  {inspection.rawBilingualCharacters.toLocaleString()} 字符
                </dd>
              </div>
              <div>
                <dt>精修双语</dt>
                <dd>
                  {inspection.refinedBilingualCharacters.toLocaleString()} 字符
                </dd>
              </div>
              <div>
                <dt>学习句</dt>
                <dd>{inspection.sentenceCount} 条</dd>
              </div>
            </dl>
          ) : (
            <p className="muted-copy">
              浏览器先检查 JSON、合同版本、全文证据和学习句；服务端随后执行完整
              Zod 校验。
            </p>
          )}
        </aside>
      </section>

      <section className="project-section">
        <div className="section-intro">
          <p className="eyebrow">Supported input</p>
          <h2>系统支持什么，如何识别</h2>
        </div>
        <div className="import-rule-grid">
          <article>
            <span>支持</span>
            <h3>Curated JSON</h3>
            <p>
              直接上传和粘贴按内容识别，文件名不作强制要求；文件夹批量扫描要求
              <code> *.curated.json</code> 后缀。
            </p>
          </article>
          <article>
            <span>不直接支持</span>
            <h3>MP3 / MP4 / TXT / DOCX</h3>
            <p>
              这些是原始材料，必须先在应用外转写和整理，再转换成合同 1.0 JSON
              才能进入数据库。
            </p>
          </article>
          <article>
            <span>最终校验</span>
            <h3>结构、范围与完整性</h3>
            <p>
              检查必填字段、输入类型、完整三份文本及 1–500
              条精选句；不合格时整包拒绝。
            </p>
          </article>
          <article>
            <span>写入安全</span>
            <h3>哈希去重 + SQL 事务</h3>
            <p>
              SHA-256
              防止相同内容重复导入；Source、全文和学习句在同一事务中成功或回滚。
            </p>
          </article>
        </div>
      </section>

      <section className="project-section panel prompt-panel">
        <div className="prompt-heading">
          <div>
            <p className="eyebrow">Reusable GPT prompt</p>
            <h2>每次整理时复制这段提示词</h2>
            <p>
              替换末尾的文件名、输入类型、日期、场景和完整原文；一次只处理一个文件。
            </p>
          </div>
          <button className="quiet-button" onClick={copyPrompt} type="button">
            {copied ? "已复制" : "复制完整提示词"}
          </button>
        </div>
        <textarea
          aria-label="GPT curated import prompt"
          className="prompt-textarea"
          readOnly
          value={GPT_IMPORT_PROMPT}
        />
      </section>
    </div>
  );
}
