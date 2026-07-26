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
  const relativePaths = discovered.slice(0, 5).map((item) => item.relativePath);
  if (relativePaths.length === 0) {
    process.stdout.write("No *.curated.json package is ready for import.\n");
    return;
  }

  const response = await fetch(`${apiUrl}/api/imports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ relativePaths }),
  });
  if (!response.ok) {
    throw new Error(
      `Curated import failed: ${response.status} ${await response.text()}`,
    );
  }
  process.stdout.write(`${JSON.stringify(await response.json(), null, 2)}\n`);
}

void main();
