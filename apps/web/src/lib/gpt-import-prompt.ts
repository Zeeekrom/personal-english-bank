export const GPT_IMPORT_PROMPT = `你是 Personal English Bank 的外部语料整理器。请把我随后提供的一个来源文件整理为可直接导入系统的 Curated Import Package。

【输出硬性要求】
1. 最终只输出一个有效 JSON 对象；不要使用 Markdown 代码块，不要解释，不要添加注释，不要使用尾随逗号。
2. 一次只处理一个来源文件，不要把多个文件合并。
3. contractVersion 必须严格为 "1.0"。
4. 所有必填字段都必须存在；未知的可选字段直接省略，不要写 null，不要虚构内容。
5. source.capturedAt 仅在日期已知时填写 ISO 8601 时间，例如 "2026-07-27T00:00:00.000Z"。
6. 输出前自行检查 JSON 可以解析、字段类型正确、sentences 数量为 1–500。

【内容整理规则】
1. evidence.sourceText 必须逐字保留我提供的完整原文，不得摘要、截断、改写或省略。
2. evidence.rawBilingualText 必须覆盖完整原文：一行英文，下一行中文；保留转写或翻译中的不确定性。
3. evidence.refinedBilingualText 必须覆盖完整内容：一行修正后的英文，下一行准确自然的中文；可修正可恢复的问题并移除无意义噪声，但不得编造事实。
4. 不要仅凭文字判断发音问题，也不要把可能的转写错误直接判定为我的口语错误。
5. sentences 只放值得主动复习的精选表达，不是全文逐句复制。通常选择 10–40 条，短文件可更少，最多 500 条。
6. sentences[].english / chinese 使用精修后的双语；如有对应原句，同时填写 rawEnglish / rawChinese。
7. priority 为 0–100 的整数：高频且急需主动使用的表达优先级更高。
8. summaryCn 用简洁中文说明这是什么时间/场景下发生了什么，不能添加原文没有的信息。

【唯一允许的 JSON 结构】
{
  "contractVersion": "1.0",
  "source": {
    "title": "简洁来源标题",
    "inputType": "audio | video | pretranscribed_text 三选一",
    "originalFileName": "包含扩展名的原文件名",
    "relativePath": "可选：相对路径",
    "capturedAt": "可选：ISO 8601 时间",
    "scenario": "可选：不超过100字的场景",
    "summaryCn": "必填中文摘要",
    "language": "en-zh",
    "curatedBy": "gpt"
  },
  "evidence": {
    "sourceText": "完整原文",
    "rawBilingualText": "完整原始双语，一行英文下一行中文",
    "refinedBilingualText": "完整精修双语，一行英文下一行中文",
    "transcriptionTool": "可选：实际使用的转写工具",
    "uncertaintyNotes": "可选：不确定内容说明"
  },
  "sentences": [
    {
      "english": "必填：精修英文",
      "chinese": "必填：精修中文",
      "rawEnglish": "可选：对应原始英文",
      "rawChinese": "可选：对应原始中文",
      "startMs": 0,
      "endMs": 0,
      "speakerLabel": "可选：说话人",
      "mainIssue": "可选：主要问题",
      "intentionCn": "可选：我当时想表达的意思",
      "explanationCn": "可选：精修说明",
      "curationNotes": "可选：筛选或不确定性说明",
      "priority": 70
    }
  ]
}

【本次来源信息】
originalFileName：[请替换]
inputType：[audio / video / pretranscribed_text]
capturedAt：[已知则填写；未知写“未知”]
scenario：[请替换]

【完整原始内容】
[请把一个文件的完整转写或文本粘贴在这里]

现在严格按照上述规则输出唯一的 JSON 对象。`;
