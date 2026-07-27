import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "项目说明 · Personal English Bank",
  description: "Personal English Bank 的目标工作流、功能范围和技术架构。",
};

const requirements = [
  {
    number: "01",
    title: "两种内容输入方式",
    status: "系统外处理",
    body: "支持本地 MP3/MP4 录音，以及已经准备好的文字。音视频先通过本地语音工具转写；已有文字直接进入整理流程。",
  },
  {
    number: "02",
    title: "保留原始证据",
    status: "当前已支持",
    body: "每个文件保存完整原文。无法确认是录音、转写还是表达造成的问题时，保留不确定内容，不根据文字臆测发音问题。",
  },
  {
    number: "03",
    title: "生成两份完整双语文本",
    status: "当前已支持",
    body: "第一份是逐句英文加中文的原始双语证据；第二份是清除无效内容、修正可恢复问题后的逐句双语精修版。两份都能全文预览。",
  },
  {
    number: "04",
    title: "筛选真正值得学习的句子",
    status: "Curator 负责",
    body: "Codex 或后续 GPT 在系统外完成翻译、纠错、摘要和筛选。只有选中的精修句子进入学习数据库，用户不需要逐句做 Accept/Reject 标注。",
  },
  {
    number: "05",
    title: "按文件组织和查询",
    status: "当前已支持",
    body: "句子是最小学习单位，导入文件是上层来源。可以按文件、日期、场景、摘要、英文或中文定位，并查看来源的完整上下文。",
  },
  {
    number: "06",
    title: "增删改查与每日复习",
    status: "当前已支持",
    body: "来源和学习句都可以查询、修改和删除。系统按 1/3/7/14/30 天安排复习，每日数量有上限；说一遍并点击完成即可，不在第一阶段评分。",
  },
];

const technologies = [
  {
    layer: "Web",
    name: "Next.js 16 + React 19",
    description:
      "App Router 构建来源、学习库、复习和项目说明页面；前端通过 NestJS API 读取和修改数据。",
  },
  {
    layer: "API",
    name: "NestJS 11",
    description:
      "提供版本化导入、来源 CRUD、学习句 CRUD、复习、搜索和 Markdown 导出接口。",
  },
  {
    layer: "Domain",
    name: "TypeScript + Zod 4",
    description:
      "共享 Curated Import Contract、输入验证、状态规则和 1/3/7/14/30 天复习调度逻辑。",
  },
  {
    layer: "Data",
    name: "Prisma 7 + SQL Server 2022",
    description:
      "本地使用 SQL Server Developer Edition；所有结构变化通过 Migration，未来可迁移到 Azure SQL Database。",
  },
  {
    layer: "Workspace",
    name: "pnpm + Turborepo",
    description:
      "TypeScript Monorepo 统一管理 Web、API、Domain 和 Database 包，并复用构建、测试和类型检查缓存。",
  },
  {
    layer: "Quality",
    name: "Vitest + GitHub Actions",
    description:
      "导入合同、复习规则、解析器和核心流程有自动测试；每次推送运行测试、类型检查和生产构建。",
  },
];

const flow = [
  ["1", "本地输入", "MP3、MP4 或准备好的文字"],
  ["2", "系统外整理", "本地转写、翻译、保真整理与精修"],
  ["3", "导入合同", "校验完整原文、两份双语文本和筛选句"],
  ["4", "SQL 事务", "一次写入 Source、Transcript、Segment 与 Review"],
  ["5", "学习闭环", "查询、全文预览、编辑、删除和定时复习"],
];

export default function ProjectPage() {
  return (
    <div lang="zh-CN">
      <section className="page-heading project-heading">
        <div>
          <p className="eyebrow">Product brief · Architecture</p>
          <h1>项目说明</h1>
          <p>
            这里集中说明你希望加入的内容、第一阶段的真实工作流，以及系统为什么采用当前技术方案。
          </p>
        </div>
        <span className="phase-badge">Phase 1 · Local Product Core</span>
      </section>

      <section className="project-boundary" aria-label="Phase 1 boundary">
        <div>
          <span>当前应用</span>
          <strong>本地数据库、全文预览、CRUD、搜索与复习</strong>
        </div>
        <div>
          <span>应用外部</span>
          <strong>转写、翻译、纠错、筛选与摘要</strong>
        </div>
        <div>
          <span>后续扩展</span>
          <strong>可替换 AI Provider、云端部署与自动工作流</strong>
        </div>
      </section>

      <section className="project-section">
        <div className="section-intro">
          <p className="eyebrow">What you want to add</p>
          <h2>我要加入的内容</h2>
          <p>
            目标不是简单保存转写，而是把真实交流整理成可追溯、可搜索、能够每天练习的个人英语语料库。
          </p>
        </div>
        <div className="requirements-grid">
          {requirements.map((item) => (
            <article className="requirement-card" key={item.number}>
              <div className="requirement-meta">
                <span>{item.number}</span>
                <small>{item.status}</small>
              </div>
              <h3>{item.title}</h3>
              <p>{item.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="project-section">
        <div className="section-intro">
          <p className="eyebrow">End-to-end workflow</p>
          <h2>内容如何进入系统</h2>
          <p>
            运行中的应用不直接调用 AI。Codex 或未来的 AI Provider
            必须先生成相同格式的版本化导入包。
          </p>
        </div>
        <ol className="architecture-flow">
          {flow.map(([number, title, description]) => (
            <li key={number}>
              <span>{number}</span>
              <div>
                <strong>{title}</strong>
                <small>{description}</small>
              </div>
            </li>
          ))}
        </ol>
      </section>

      <section className="project-section">
        <div className="section-intro">
          <p className="eyebrow">Technical implementation</p>
          <h2>项目使用的技术</h2>
          <p>
            技术选择优先保证本地可运行、数据可追溯、导入可验证，同时为 Azure
            和未来 AI 接入保留稳定边界。
          </p>
        </div>
        <div className="technology-grid">
          {technologies.map((technology) => (
            <article className="technology-card" key={technology.layer}>
              <span>{technology.layer}</span>
              <h3>{technology.name}</h3>
              <p>{technology.description}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="project-section two-column">
        <article className="panel">
          <p className="eyebrow">Core data model</p>
          <h2>数据如何关联</h2>
          <ul className="project-list">
            <li>
              <strong>Source</strong>：代表一次导入文件、日期、场景和摘要。
            </li>
            <li>
              <strong>Transcript</strong>
              ：保存完整原文、完整原始双语和完整精修双语。
            </li>
            <li>
              <strong>TranscriptSegment</strong>：保存被选中的逐句双语内容。
            </li>
            <li>
              <strong>LearningItem</strong>：可编辑、可删除的学习表达。
            </li>
            <li>
              <strong>ReviewSchedule</strong>：记录下一次复习时间和当前间隔。
            </li>
          </ul>
        </article>

        <article className="panel project-safety">
          <p className="eyebrow">Safety and extension boundary</p>
          <h2>数据安全与未来接入</h2>
          <ul className="project-list">
            <li>原始语料、音视频、数据库和本地报告不进入公开仓库。</li>
            <li>批量导入使用 SHA-256 内容哈希避免重复。</li>
            <li>跨多个聚合的数据写入使用 SQL 事务。</li>
            <li>JSON 使用 SQL Server NVARCHAR(MAX) 和受控校验。</li>
            <li>未来 AI 只能调用版本化导入 API，不能直接写业务表。</li>
          </ul>
        </article>
      </section>
    </div>
  );
}
