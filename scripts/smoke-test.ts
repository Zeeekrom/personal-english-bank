import { prisma } from "@peb/database";

const apiUrl = process.env.API_URL ?? "http://localhost:3001";

async function request<T>(path: string, init?: RequestInit): Promise<T> {
  const response = await fetch(`${apiUrl}/api${path}`, {
    ...init,
    headers: {
      "content-type": "application/json",
      ...init?.headers
    }
  });
  if (!response.ok) {
    throw new Error(`${init?.method ?? "GET"} ${path}: ${response.status} ${await response.text()}`);
  }
  return response.json() as Promise<T>;
}

async function main(): Promise<void> {
  const staleItems = await prisma.learningItem.findMany({
    where: { title: "[smoke-test] Depositing money" },
    select: { id: true }
  });
  for (const staleItem of staleItems) {
    await prisma.reviewEvent.deleteMany({
      where: { learningItemId: staleItem.id }
    });
    await prisma.usageEvent.deleteMany({
      where: { learningItemId: staleItem.id }
    });
    await prisma.learningItem.delete({ where: { id: staleItem.id } });
  }
  await prisma.interactionLog.deleteMany({
    where: { eventTitle: "[smoke-test] Bank interaction" }
  });
  const staleSpeakers = await prisma.speaker.findMany({
    where: { displayName: "[smoke-test] Evan" },
    select: { id: true }
  });
  for (const staleSpeaker of staleSpeakers) {
    await prisma.transcriptSegment.updateMany({
      where: { speakerId: staleSpeaker.id },
      data: { speakerId: null, manuallyVerified: false }
    });
    await prisma.speaker.delete({ where: { id: staleSpeaker.id } });
  }

  const source = await prisma.source.findFirst({
    where: { title: "Translate 1" },
    include: {
      transcripts: {
        where: { isCurrent: true },
        include: { segments: { orderBy: { segmentIndex: "asc" }, take: 1 } }
      }
    }
  });
  const segment = source?.transcripts[0]?.segments[0];
  if (!source || !segment) {
    throw new Error("Smoke test requires the imported Translate 1 source.");
  }

  let itemId: string | undefined;
  let interactionId: string | undefined;
  let speakerId: string | undefined;

  try {
    const speaker = await request<{ id: string }>(
      `/sources/segments/${segment.id}/speaker`,
      {
        method: "PATCH",
        body: JSON.stringify({
          displayName: "[smoke-test] Evan",
          role: "evan",
          isMe: false,
          applyToDiarizationKey: false
        })
      }
    );
    speakerId = speaker.id;

    const interaction = await request<{ id: string }>(
      `/sources/${source.id}/interactions`,
      {
        method: "POST",
        body: JSON.stringify({
          eventTitle: "[smoke-test] Bank interaction",
          scenario: "smoke-test",
          reflection: "Temporary end-to-end verification record."
        })
      }
    );
    interactionId = interaction.id;

    const item = await request<{ id: string; reviewSchedule: { intervalDays: number } }>(
      "/learning-items",
      {
        method: "POST",
        body: JSON.stringify({
          segmentId: segment.id,
          title: "[smoke-test] Depositing money",
          chineseIntention: "我想把钱存进账户。",
          easyActiveVersion: "I'd like to deposit some money into my account.",
          usageMode: "active_use"
        })
      }
    );
    itemId = item.id;
    if (item.reviewSchedule.intervalDays !== 1) {
      throw new Error("First review interval was not one day.");
    }

    await prisma.reviewSchedule.update({
      where: { learningItemId: item.id },
      data: { nextReviewAt: new Date(0) }
    });
    const due = await request<Array<{ learningItemId: string }>>("/reviews/due");
    if (!due.some((entry) => entry.learningItemId === item.id)) {
      throw new Error("Created item was not returned by the due queue.");
    }

    await request(`/reviews/${item.id}`, {
      method: "POST",
      body: JSON.stringify({ rating: "good", notes: "smoke-test" })
    });
    await request(`/learning-items/${item.id}/usage`, {
      method: "POST",
      body: JSON.stringify({
        scenario: "smoke-test",
        outcome: "used",
        notes: "Temporary end-to-end verification record."
      })
    });

    const markdown = await fetch(`${apiUrl}/api/exports/markdown`).then((response) =>
      response.text()
    );
    if (!markdown.includes("[smoke-test] Depositing money")) {
      throw new Error("Markdown export did not include the test learning item.");
    }

    process.stdout.write(
      "Smoke test passed: speaker → interaction → learning item → due review → usage → Markdown export.\n"
    );
  } finally {
    if (itemId) {
      await prisma.reviewEvent.deleteMany({ where: { learningItemId: itemId } });
      await prisma.usageEvent.deleteMany({ where: { learningItemId: itemId } });
      await prisma.learningItem.delete({ where: { id: itemId } });
    }
    if (interactionId) {
      await prisma.interactionLog.delete({ where: { id: interactionId } });
    }
    await prisma.transcriptSegment.update({
      where: { id: segment.id },
      data: { speakerId: null, manuallyVerified: false }
    });
    if (speakerId) {
      await prisma.speaker.delete({ where: { id: speakerId } });
    }
    await prisma.source.update({
      where: { id: source.id },
      data: { processingStatus: "needs_review" }
    });
    await prisma.$disconnect();
  }
}

void main();
