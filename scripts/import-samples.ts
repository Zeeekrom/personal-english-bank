import "dotenv/config";

const apiUrl = process.env.API_URL ?? "http://localhost:3001";

async function main(): Promise<void> {
  const discoveredResponse = await fetch(`${apiUrl}/api/imports/discover`);
  if (!discoveredResponse.ok) {
    throw new Error(
      `Curated package discovery failed: ${discoveredResponse.status} ${await discoveredResponse.text()}`,
    );
  }
  const discovered = (await discoveredResponse.json()) as Array<{
    relativePath: string;
  }>;
  const relativePaths = discovered.map((item) => item.relativePath);
  if (relativePaths.length === 0) {
    process.stdout.write("No *.curated.json package is ready for import.\n");
    return;
  }

  const results: Array<{
    status: "imported" | "duplicate" | "skipped";
    relativePath: string;
    segments?: number;
    reason?: string;
  }> = [];
  for (let index = 0; index < relativePaths.length; index += 20) {
    const batch = relativePaths.slice(index, index + 20);
    const response = await fetch(`${apiUrl}/api/imports`, {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({ relativePaths: batch }),
    });
    if (!response.ok) {
      throw new Error(
        `Curated import failed: ${response.status} ${await response.text()}`,
      );
    }
    results.push(...((await response.json()) as typeof results));
  }

  const counts = results.reduce(
    (total, item) => {
      total[item.status] += 1;
      total.sentences += item.segments ?? 0;
      return total;
    },
    { imported: 0, duplicate: 0, skipped: 0, sentences: 0 },
  );
  process.stdout.write(
    `${JSON.stringify({ discovered: relativePaths.length, ...counts, results }, null, 2)}\n`,
  );
}

void main();
