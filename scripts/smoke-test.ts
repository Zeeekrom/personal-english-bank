import { prisma } from "@peb/database";

const apiUrl = process.env.API_URL ?? "http://localhost:3001";
const title = "[smoke-test] Curated workflow";
const largeSourceText = `Where my card arrive?\n${"Complete source context. ".repeat(
  7_000,
)}`;

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}/api${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers,
    },
  });
  if (!response.ok) {
    throw new Error(
      `${init?.method ?? "GET"} ${path}: ${response.status} ${await response.text()}`,
    );
  }
  return response.json() as Promise<T>;
}

async function main(): Promise<void> {
  const staleSources = await prisma.source.findMany({
    where: { title },
    select: { id: true },
  });
  for (const source of staleSources) {
    await request(`/sources/${source.id}`, { method: "DELETE" });
  }

  let sourceId: string | undefined;
  try {
    const imported = await request<{ sourceId: string; segments: number }>(
      "/imports/curated",
      {
        method: "POST",
        body: JSON.stringify({
          contractVersion: "1.0",
          source: {
            title,
            inputType: "pretranscribed_text",
            originalFileName: "smoke-test.txt",
            summaryCn: "验证精修语料导入、查询、修改、复习和删除。",
          },
          evidence: {
            sourceText: largeSourceText,
            rawBilingualText: "Where my card arrive?\n我的卡什么时候到？",
            refinedBilingualText:
              "Could you tell me when my card will arrive?\n请问我的银行卡什么时候能寄到？",
          },
          sentences: [
            {
              rawEnglish: "Where my card arrive?",
              rawChinese: "我的卡什么时候到？",
              english: "Could you tell me when my card will arrive?",
              chinese: "请问我的银行卡什么时候能寄到？",
              mainIssue: "Incomplete raw sentence.",
            },
          ],
        }),
      },
    );
    sourceId = imported.sourceId;
    if (imported.segments !== 1)
      throw new Error("Expected one curated sentence.");

    const source = await request<{
      summaryCn: string;
      transcripts: Array<{
        sourceText?: string;
        originalText: string;
        cleanedText?: string;
      }>;
      learningLinks: Array<{ learningItem: { id: string } }>;
    }>(`/sources/${sourceId}`);
    const transcript = source.transcripts[0];
    if (
      transcript?.sourceText !== largeSourceText ||
      !transcript.originalText.includes("我的卡什么时候到") ||
      !transcript.cleanedText?.includes("Could you tell me")
    ) {
      throw new Error(
        "Complete source and bilingual previews were not stored.",
      );
    }
    const itemId = source.learningLinks[0]?.learningItem.id;
    if (!itemId)
      throw new Error("Curated sentence was not linked to its source.");

    await request(`/sources/${sourceId}`, {
      method: "PATCH",
      body: JSON.stringify({ summaryCn: "Smoke-test updated summary." }),
    });
    await request(`/learning-items/${itemId}`, {
      method: "PATCH",
      body: JSON.stringify({
        refinedEnglish: "Could you please tell me when my card will arrive?",
      }),
    });

    await prisma.reviewSchedule.update({
      where: { learningItemId: itemId },
      data: { nextReviewAt: new Date(0) },
    });
    const due =
      await request<Array<{ learningItemId: string }>>("/reviews/due");
    if (!due.some((entry) => entry.learningItemId === itemId)) {
      throw new Error("Curated sentence was not returned by the due queue.");
    }
    await request(`/reviews/${itemId}/complete`, {
      method: "POST",
      body: JSON.stringify({ responseText: "Unscored voice transcript." }),
    });

    const markdown = await fetch(`${apiUrl}/api/exports/markdown`).then(
      (response) => response.text(),
    );
    if (!markdown.includes("Could you please tell me")) {
      throw new Error("Markdown export did not include the edited sentence.");
    }

    process.stdout.write(
      "Smoke test passed: curated import → source/item update → ungraded review → export → cascade delete.\n",
    );
  } finally {
    if (sourceId) {
      await request(`/sources/${sourceId}`, { method: "DELETE" });
    }
    await prisma.$disconnect();
  }
}

void main();
