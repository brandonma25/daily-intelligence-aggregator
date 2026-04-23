import { readFile } from "node:fs/promises";
import {
  createGoogleSheetsClient,
  promoteVerifiedPullRequest,
  syncMergedPullRequest,
} from "./github-sheets/sync.mjs";

function parseArgs(argv) {
  const parsed = {};

  for (let index = 0; index < argv.length; index += 1) {
    const token = argv[index];
    if (!token.startsWith("--")) continue;

    const key = token.slice(2);
    const next = argv[index + 1];
    if (!next || next.startsWith("--")) {
      parsed[key] = "true";
      continue;
    }

    parsed[key] = next;
    index += 1;
  }

  return parsed;
}

async function loadPayload(args) {
  if (args["payload-json"]) {
    return JSON.parse(args["payload-json"]);
  }

  if (args["payload-file"]) {
    const contents = await readFile(args["payload-file"], "utf8");
    return JSON.parse(contents);
  }

  throw new Error("Provide --payload-json or --payload-file.");
}

function coerceBoolean(value, fallback = false) {
  if (value == null) return fallback;
  return /^(1|true|yes|on)$/i.test(String(value));
}

async function main() {
  const args = parseArgs(process.argv.slice(2));
  const eventType = args.event;

  if (!eventType || !["pr-merge", "production-verify"].includes(eventType)) {
    throw new Error("Usage: node scripts/github-sheets-sync.mjs --event <pr-merge|production-verify> --payload-file <path>");
  }

  const payload = await loadPayload(args);
  const pr = {
    title: payload.title ?? "",
    branchName: payload.branchName ?? payload.headRef ?? "",
    url: payload.url ?? payload.html_url ?? "",
    mergedAt: payload.mergedAt ?? payload.merged_at ?? new Date().toISOString(),
  };

  if (!pr.title || !pr.branchName || !pr.url) {
    throw new Error("Payload must include title, branchName, and url.");
  }

  const sheetsClient = createGoogleSheetsClient({
    serviceAccountJson: process.env.GOOGLE_SERVICE_ACCOUNT_JSON,
    sheetId: process.env.GOOGLE_SHEET_ID,
  });

  const result =
    eventType === "pr-merge"
      ? await syncMergedPullRequest({
          sheetsClient,
          pr,
          capturedAt: pr.mergedAt,
        })
      : await promoteVerifiedPullRequest({
          sheetsClient,
          pr,
          verificationPassed: coerceBoolean(args["verification-passed"], true),
        });

  console.log(JSON.stringify(result, null, 2));
}

main().catch((error) => {
  console.error(`GitHub Sheets sync failed: ${error.message}`);
  process.exit(1);
});
