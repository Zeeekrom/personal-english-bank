import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "项目说明 · Personal English Bank",
  description:
    "为什么从现实生活构建个人英语语料库，以及 Personal English Bank 的内容、复盘方式和技术架构。",
};

const whyProblems = [
  {
    title: "临场表达困难",
    body: "脑中知道中文意思，也见过相应英文，但真实对话没有时间慢慢组织语法，最后还是说不出口。",
  },
  {
    title: "交流之后没有复盘",
    body: "当时没听懂、表达不自然或回答偏题，如果事后不整理，下一次往往还会在同一个地方卡住。",
  },
  {
    title: "大量输入没有变成输出",
    body: "课堂、本地人和真实对话带来很多英语输入，但听过不等于会用，需要转化为自己能够主动说出的表达。",
  },
  {
    title: "材料增加却无法复习",
    body: "录音、转写和笔记越来越多，如果没有来源、状态和复习计划，它们只会成为无法再次利用的档案。",
  },
];

const lifeLoop = [
  ["01", "真实经历", "生活、课堂、项目与交流"],
  ["02", "记录现场", "录音、转写或快速记下缺口"],
  ["03", "整理语料", "保留上下文并生成双语版本"],
  ["04", "自我 Review", "发现没听懂、不会说和不自然之处"],
  ["05", "刻意练习", "把高价值表达加入每日复习"],
  ["06", "再次使用", "带回真实生活并继续修正"],
];

const corpusSources = [
  {
    title: "My Spoken Output",
    subtitle: "自己的真实英语输出",
    body: "真实对话、项目会议、课堂互动、电话、面试和口语练习。重点不是挑错，而是发现重复问题、意思偏差和更容易说出的版本。",
  },
  {
    title: "Australian Native Input",
    subtitle: "澳洲老师与本地人输入",
    body: "提取高频口语块、礼貌表达、话题转换和文化语用，并区分可以主动使用、只需听懂和仅适合特定场景的表达。",
  },
  {
    title: "Prepared Self-Expression",
    subtitle: "主动准备的个人表达",
    body: "把个人经历、项目、兴趣、观点和未来目标准备成不同长度、正式程度和听众版本，逐渐形成稳定的英文个人叙事。",
  },
  {
    title: "Vocabulary & Patterns",
    subtitle: "词汇、搭配、句型与发音",
    body: "不只保存中文释义，还保留真实上下文、常用搭配、自己的例句、使用模式和下一次复习时间。",
  },
];

const corpusDomains = [
  [
    "Conversation Survival",
    "对话生存",
    "请求重复、确认理解、争取思考时间和修复对话",
  ],
  ["Australian English", "澳洲英语", "当地表达、缩写、语气、发音和文化语用"],
  ["Daily Life", "日常生活", "购物、银行、租房、交通、维修、电话和服务场景"],
  ["University", "学校生活", "课堂、Tutorial、小组作业、老师和学校服务"],
  [
    "Clubs & Volunteering",
    "社团与志愿者",
    "询问活动、介绍技能、排班和加入团队",
  ],
  [
    "Career & Networking",
    "职业与人脉",
    "实习、项目合作、LinkedIn、面试和职业交流",
  ],
  ["Personal Narrative", "个人叙事", "个人经历、技能、项目、兴趣、优势和目标"],
  [
    "Ideas & Interests",
    "思想与兴趣",
    "AI、游戏、书籍、电影、社会议题和个人观点",
  ],
  [
    "Difficult Situations",
    "困难与紧急场景",
    "医疗、诈骗、银行卡异常、迷路和物品遗失",
  ],
];

const reviewQuestions = [
  "哪句话当时没有听懂？",
  "哪个意思知道，却不知道怎样用英语说？",
  "哪段回答太长、偏题或没有重点？",
  "对方用了什么值得保留的自然表达？",
  "我原本想表达什么，实际又说成了什么？",
  "下一次遇到同样场景，我希望怎样开口和追问？",
];

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
      <section className="project-story">
        <div className="project-story-copy">
          <div className="story-topline">
            <p className="eyebrow">Why I am building this</p>
            <span className="phase-badge">Phase 1 · Local Product Core</span>
          </div>
          <h1>把真实生活，变成我能说出口的英语。</h1>
          <p className="story-lede">
            我正在学习英语。真正让我进步的材料，不只来自教材，也来自每天发生的课堂、生活、项目和人与人之间的交流。
          </p>
          <p className="story-detail">
            我想记录这些现实经验，回看自己哪里没有听懂、哪里不会表达、哪里说得不够自然；再把真正有价值的部分整理成个人语料库，持续复习、刻意练习，并在下一次真实交流中重新使用。
          </p>
        </div>
        <aside className="story-principle">
          <span>项目真正衡量的不是</span>
          <strong>收集了多少内容</strong>
          <span>而是</span>
          <strong>下一次交流是否比上一次更自然。</strong>
        </aside>
      </section>

      <section className="project-section why-section">
        <div className="section-intro">
          <p className="eyebrow">The reason</p>
          <h2>为什么要做 Personal English Bank</h2>
          <p>
            它不是普通单词本，也不是录音仓库。它要解决的是英语学习进入真实生活之后，反复出现却一直没有形成闭环的问题。
          </p>
        </div>
        <div className="why-grid">
          {whyProblems.map((problem, index) => (
            <article className="why-card" key={problem.title}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <h3>{problem.title}</h3>
              <p>{problem.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="project-section">
        <div className="section-intro">
          <p className="eyebrow">The learning loop</p>
          <h2>从现实生活积累，再回到现实生活</h2>
          <p>
            每一次真实交流都是新的学习材料；每一次复盘和练习，都应该让下一次交流更容易继续下去。
          </p>
        </div>
        <ol className="life-loop">
          {lifeLoop.map(([number, title, description]) => (
            <li key={number}>
              <span>{number}</span>
              <strong>{title}</strong>
              <small>{description}</small>
            </li>
          ))}
        </ol>
      </section>

      <section className="project-section review-story">
        <article className="review-copy">
          <p className="eyebrow">Self review</p>
          <h2>交流结束后，我会重新问自己</h2>
          <p>
            自我 Review
            不是给自己打分，而是把一次已经结束的经历，转换成下一次能够直接调用的英语。
          </p>
          <div className="review-output">
            <span>最终沉淀为</span>
            <strong>Personal Narrative · 关于“我是谁”的稳定表达</strong>
            <strong>Conversation Toolkit · 提问、追问、补救与结束表达</strong>
          </div>
        </article>
        <ul className="review-questions">
          {reviewQuestions.map((question) => (
            <li key={question}>{question}</li>
          ))}
        </ul>
      </section>

      <section className="project-section">
        <div className="section-intro">
          <p className="eyebrow">Corpus sources</p>
          <h2>个人语料库从哪里积累</h2>
          <p>
            系统同时吸收自己的输出、真实环境中的英语输入、主动准备的表达，以及需要长期掌握的词汇和句型。
          </p>
        </div>
        <div className="corpus-source-grid">
          {corpusSources.map((source) => (
            <article className="corpus-source-card" key={source.title}>
              <span>{source.title}</span>
              <h3>{source.subtitle}</h3>
              <p>{source.body}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="project-section">
        <div className="section-intro">
          <p className="eyebrow">What is inside</p>
          <h2>语料库包含这些内容</h2>
          <p>
            内容围绕近期真实会遇到、真正需要听懂或主动表达的场景组织，而不是为了数量收集整篇教材和复杂句子。
          </p>
        </div>
        <div className="corpus-domain-grid">
          {corpusDomains.map(([english, chinese, description], index) => (
            <article className="corpus-domain-card" key={english}>
              <span>{String(index + 1).padStart(2, "0")}</span>
              <div>
                <small>{english}</small>
                <h3>{chinese}</h3>
                <p>{description}</p>
              </div>
            </article>
          ))}
        </div>
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
          <p className="eyebrow">Product capabilities</p>
          <h2>系统如何承接这些内容</h2>
          <p>
            现实经验只有经过保真保存、双语整理、筛选和复习，才能真正变成可复用的个人英语。
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
