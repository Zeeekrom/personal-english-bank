import "dotenv/config";

const apiUrl = process.env.API_URL ?? "http://localhost:3001";
const samplePaths = [
  "AR glass\\week01\\Translate 1.txt",
  "AR glass\\week01\\Translate 11.txt",
  "Notta,Otter, Zoom\\week01\\Programming Foundation Unit Overview_otter_ai_transcript.txt",
  "Notta,Otter, Zoom\\Week02\\Note (2)",
  "Notta,Otter, Zoom\\Week03\\Group Assignment Discussion_ Computer Transfer Project_Power.txt"
];

async function main(): Promise<void> {
  const response = await fetch(`${apiUrl}/api/imports`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: JSON.stringify({ relativePaths: samplePaths })
  });

  if (!response.ok) {
    throw new Error(
      `Sample import failed: ${response.status} ${await response.text()}`
    );
  }

  const results = await response.json();
  process.stdout.write(`${JSON.stringify(results, null, 2)}\n`);
}

void main();
