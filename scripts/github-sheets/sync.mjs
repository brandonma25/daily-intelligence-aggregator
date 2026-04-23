import { createSign } from "node:crypto";

export const FEATURE_SHEET_NAME = "Sheet1";
export const INTAKE_SHEET_NAME = "Intake Queue";

export const SHEET1_HEADERS = [
  "Row ID",
  "Build Order",
  "Record ID",
  "Feature Name",
  "Layer",
  "Feature Type",
  "Parent System",
  "Priority",
  "Status",
  "Decision",
  "Owner",
  "Dependency",
  "Description",
  "PRD File",
  "Source",
  "Last Updated",
  "Notes",
  "Execution Stage",
  "Critical Path Flag",
  "Build Readiness",
  "Record Class",
  "Priority Score",
];

export const INTAKE_QUEUE_HEADERS = [
  "Captured At",
  "Source",
  "Trigger Type",
  "PR Title",
  "Branch Name",
  "PR URL",
  "Guessed Record ID",
  "Guessed Feature Name",
  "Suggested Type",
  "Suggested Parent System",
  "Suggested Priority",
  "Review Status",
  "Decision",
  "Notes",
  "Promoted Record ID",
  "Reviewed By",
  "Reviewed At",
];

export const SHEET1_FORMULA_HEADERS = [
  "Execution Stage",
  "Critical Path Flag",
  "Build Readiness",
  "Record Class",
  "Priority Score",
];

export const SHEET1_HUMAN_MANAGED_HEADERS = [
  "Row ID",
  "Build Order",
  "Record ID",
  "Feature Name",
  "Layer",
  "Feature Type",
  "Parent System",
  "Priority",
  "Decision",
  "Owner",
  "Dependency",
  "Description",
  "PRD File",
  "Source",
  "Last Updated",
  "Notes",
];

export const SHEET1_AUTOMATION_MANAGED_HEADERS = ["Status"];

const SHEET1_ALLOWED_MERGE_SOURCE_STATUSES = new Set(["Not Built", "In Progress", "In Review"]);
const DEFAULT_RETRY_ATTEMPTS = 3;
const RETRY_STATUS_CODES = new Set([408, 429, 500, 502, 503, 504]);

const SHEET_SCHEMAS = {
  [FEATURE_SHEET_NAME]: {
    name: FEATURE_SHEET_NAME,
    readRange: "A:V",
    expectedHeaders: SHEET1_HEADERS,
    recordIdHeader: "Record ID",
    statusHeader: "Status",
  },
  [INTAKE_SHEET_NAME]: {
    name: INTAKE_SHEET_NAME,
    readRange: "A:Q",
    expectedHeaders: INTAKE_QUEUE_HEADERS,
  },
};

function sleep(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function normalizeHeader(header) {
  return String(header ?? "").trim();
}

function normalizeCell(value) {
  return String(value ?? "").trim();
}

function isBlankRow(row) {
  return row.every((value) => normalizeCell(value) === "");
}

function normalizeRecordId(value) {
  if (!value) return null;
  const match = normalizeCell(value).toUpperCase().match(/^PRD-(\d+)$/);
  return match ? `PRD-${match[1]}` : null;
}

export function parseRecordId(...sources) {
  for (const source of sources) {
    if (!source) continue;
    const match = String(source).match(/(?:^|[^A-Za-z0-9])(PRD-\d+)(?=$|[^A-Za-z0-9])/i);
    if (match) {
      return normalizeRecordId(match[1]);
    }
  }

  return null;
}

export function guessFeatureName(prTitle, branchName, recordId) {
  const raw = prTitle?.trim() || branchName?.trim() || "Unmapped merged work";
  const withoutRecordId = recordId
    ? raw.replace(new RegExp(recordId.replace("-", "\\-"), "ig"), " ")
    : raw;

  return withoutRecordId
    .replace(/^[\[\](){}:_\-\s]+/, "")
    .replace(/\b(merge|feat|feature|fix|chore|docs|refactor|test)\b[:/\-\s]*/gi, " ")
    .replace(/[_/]+/g, " ")
    .replace(/\s+/g, " ")
    .trim() || "Unmapped merged work";
}

export function inferSuggestedType(prTitle, branchName) {
  const corpus = `${prTitle ?? ""} ${branchName ?? ""}`.toLowerCase();

  if (/(auth|oauth|session|login|logout|callback)/.test(corpus)) return "Auth / Session";
  if (/(release|governance|workflow|automation|ci|deploy|sheet)/.test(corpus)) return "Operations";
  if (/(dashboard|homepage|ui|ux|page|component|layout)/.test(corpus)) return "Experience";
  if (/(rss|ingest|pipeline|data|feed|sync|storage)/.test(corpus)) return "Data";
  if (/(ranking|briefing|summar|signal|topic|event|intelligence)/.test(corpus)) return "Intelligence";

  return "Needs Classification";
}

export function inferSuggestedParentSystem(prTitle, branchName) {
  const corpus = `${prTitle ?? ""} ${branchName ?? ""}`.toLowerCase();

  if (/(sheet|governance|workflow|release|ci|deploy)/.test(corpus)) return "Operations";
  if (/(dashboard|homepage|ui|ux|page|component|layout|auth|session)/.test(corpus)) return "Experience";
  if (/(rss|ingest|pipeline|feed|data)/.test(corpus)) return "Data";
  if (/(briefing|ranking|signal|topic|event|intelligence|summar)/.test(corpus)) return "Intelligence";

  return "Needs Review";
}

export function inferSuggestedPriority(prTitle, branchName) {
  const corpus = `${prTitle ?? ""} ${branchName ?? ""}`.toLowerCase();

  if (/(security|auth|incident|outage|hotfix|release|governance|production)/.test(corpus)) return "High";
  if (/(docs|copy|readme|comment)/.test(corpus)) return "Low";

  return "Medium";
}

export function buildIntakeEntry({ pr, recordId, notes, capturedAt = new Date().toISOString() }) {
  return {
    "Captured At": capturedAt,
    Source: "GitHub",
    "Trigger Type": "PR Merge",
    "PR Title": pr.title,
    "Branch Name": pr.branchName,
    "PR URL": pr.url,
    "Guessed Record ID": recordId ?? "",
    "Guessed Feature Name": guessFeatureName(pr.title, pr.branchName, recordId),
    "Suggested Type": inferSuggestedType(pr.title, pr.branchName),
    "Suggested Parent System": inferSuggestedParentSystem(pr.title, pr.branchName),
    "Suggested Priority": inferSuggestedPriority(pr.title, pr.branchName),
    "Review Status": "Needs Review",
    Decision: "",
    Notes: notes,
    "Promoted Record ID": "",
    "Reviewed By": "",
    "Reviewed At": "",
  };
}

function toColumnLetter(index) {
  let value = index + 1;
  let letters = "";
  while (value > 0) {
    const remainder = (value - 1) % 26;
    letters = String.fromCharCode(65 + remainder) + letters;
    value = Math.floor((value - 1) / 26);
  }
  return letters;
}

function escapeSheetName(name) {
  return `'${String(name).replace(/'/g, "''")}'`;
}

function buildHeaderMap(headers, schema) {
  const normalizedHeaders = headers.map(normalizeHeader);
  const duplicateHeaders = [];
  const headerMap = new Map();

  for (const [index, header] of normalizedHeaders.entries()) {
    if (!header) continue;
    if (headerMap.has(header)) {
      duplicateHeaders.push(header);
      continue;
    }

    headerMap.set(header, index);
  }

  if (duplicateHeaders.length > 0) {
    throw new Error(
      `${schema.name} contains duplicate headers: ${Array.from(new Set(duplicateHeaders)).join(", ")}. Refusing to write ambiguous columns.`,
    );
  }

  const missing = schema.expectedHeaders.filter((header) => !headerMap.has(header));
  if (missing.length > 0) {
    throw new Error(
      `${schema.name} is missing required headers: ${missing.join(", ")}. Refusing to write with schema drift.`,
    );
  }

  return headerMap;
}

async function readSheet(sheetsClient, schemaName) {
  const schema = SHEET_SCHEMAS[schemaName];
  const values = await sheetsClient.getValues(`${escapeSheetName(schema.name)}!${schema.readRange}`);

  if (values.length === 0) {
    throw new Error(`${schema.name} does not contain a header row. Refusing to proceed.`);
  }

  const headerMap = buildHeaderMap(values[0], schema);
  const rows = values.slice(1).map((row, index) => ({
    rowNumber: index + 2,
    values: row,
  }));

  return {
    schema,
    headers: values[0].map(normalizeHeader),
    headerMap,
    rows,
  };
}

function getCell(row, headerMap, header) {
  const index = headerMap.get(header);
  return index == null ? "" : row[index] ?? "";
}

function getFeatureRecordRows(sheet) {
  return sheet.rows
    .filter(({ values }) => !isBlankRow(values))
    .map((row) => ({
      ...row,
      recordId: normalizeRecordId(getCell(row.values, sheet.headerMap, sheet.schema.recordIdHeader)),
      status: normalizeCell(getCell(row.values, sheet.headerMap, sheet.schema.statusHeader)),
    }))
    .filter((row) => row.recordId !== null);
}

async function findFeatureMatches(sheetsClient, recordId) {
  const sheet = await readSheet(sheetsClient, FEATURE_SHEET_NAME);
  const matches = getFeatureRecordRows(sheet).filter((row) => row.recordId === recordId);
  return { sheet, matches };
}

async function appendIntakeIfNeeded(sheetsClient, entry) {
  const sheet = await readSheet(sheetsClient, INTAKE_SHEET_NAME);
  const prUrlIndex = sheet.headerMap.get("PR URL");
  const sourceIndex = sheet.headerMap.get("Source");
  const triggerTypeIndex = sheet.headerMap.get("Trigger Type");

  const alreadyCaptured = sheet.rows
    .filter(({ values }) => !isBlankRow(values))
    .some(({ values }) => {
      return (
        normalizeCell(values[prUrlIndex]) === normalizeCell(entry["PR URL"]) &&
        normalizeCell(values[sourceIndex]) === normalizeCell(entry.Source) &&
        normalizeCell(values[triggerTypeIndex]) === normalizeCell(entry["Trigger Type"])
      );
    });

  if (alreadyCaptured) {
    return {
      changed: false,
      reason: `Intake Queue already contains an entry for ${entry["PR URL"]}.`,
    };
  }

  const orderedRow = sheet.headers.map((header) => entry[header] ?? "");
  await sheetsClient.appendValues(`${escapeSheetName(INTAKE_SHEET_NAME)}!A:Q`, [orderedRow]);

  return {
    changed: true,
    reason: `Appended Intake Queue row for ${entry["PR URL"]}.`,
  };
}

async function updateFeatureStatus(sheetsClient, sheet, rowNumber, nextStatus) {
  const statusIndex = sheet.headerMap.get(sheet.schema.statusHeader);
  const cell = `${escapeSheetName(FEATURE_SHEET_NAME)}!${toColumnLetter(statusIndex)}${rowNumber}`;
  await sheetsClient.updateValues(cell, [[nextStatus]]);
}

export async function syncMergedPullRequest({ sheetsClient, pr, capturedAt = new Date().toISOString() }) {
  const recordId = parseRecordId(pr.title, pr.branchName);

  if (!recordId) {
    const intake = await appendIntakeIfNeeded(
      sheetsClient,
      buildIntakeEntry({
        pr,
        recordId: null,
        capturedAt,
        notes: "Auto-captured from merge event: no PRD / Record ID found in title or branch.",
      }),
    );

    return {
      event: "pr-merge",
      recordId: null,
      sheet1Updated: false,
      intakeAppended: intake.changed,
      outcome: "queued-for-review",
      message: `No Record ID found. ${intake.reason}`,
    };
  }

  const { sheet, matches } = await findFeatureMatches(sheetsClient, recordId);

  if (matches.length === 1) {
    const [match] = matches;

    if (match.status === "Built") {
      return {
        event: "pr-merge",
        recordId,
        sheet1Updated: false,
        intakeAppended: false,
        outcome: "already-built",
        message: `Matched ${recordId} on row ${match.rowNumber}, but status is already Built. Refusing to downgrade to Merged.`,
      };
    }

    if (match.status === "Merged") {
      return {
        event: "pr-merge",
        recordId,
        sheet1Updated: false,
        intakeAppended: false,
        outcome: "already-merged",
        message: `Matched ${recordId} on row ${match.rowNumber}. Status is already Merged, so no change was needed.`,
      };
    }

    if (!SHEET1_ALLOWED_MERGE_SOURCE_STATUSES.has(match.status)) {
      return {
        event: "pr-merge",
        recordId,
        sheet1Updated: false,
        intakeAppended: false,
        outcome: "unexpected-status",
        message: `Matched ${recordId} on row ${match.rowNumber}, but current status is "${match.status || "blank"}". Merge automation only promotes Not Built, In Progress, or In Review to Merged.`,
      };
    }

    await updateFeatureStatus(sheetsClient, sheet, match.rowNumber, "Merged");
    return {
      event: "pr-merge",
      recordId,
      sheet1Updated: true,
      intakeAppended: false,
      outcome: "merged-updated",
      message: `Updated ${recordId} on row ${match.rowNumber} from "${match.status}" to "Merged".`,
    };
  }

  const missingReason =
    matches.length === 0
      ? `Auto-captured from merge event: parsed ${recordId}, but no governed Sheet1 row matched the immutable Record ID key in column C.`
      : `Auto-captured from merge event: parsed ${recordId}, but found ${matches.length} matching Sheet1 rows. Human review required before any governed update.`;

  const intake = await appendIntakeIfNeeded(
    sheetsClient,
    buildIntakeEntry({
      pr,
      recordId,
      capturedAt,
      notes: missingReason,
    }),
  );

  return {
    event: "pr-merge",
    recordId,
    sheet1Updated: false,
    intakeAppended: intake.changed,
    outcome: matches.length === 0 ? "missing-governed-row" : "duplicate-governed-rows",
    message: `${missingReason} ${intake.reason}`,
  };
}

export async function promoteVerifiedPullRequest({
  sheetsClient,
  pr,
  verificationPassed,
}) {
  const recordId = parseRecordId(pr.title, pr.branchName);

  if (!verificationPassed) {
    return {
      event: "production-verify",
      recordId,
      sheet1Updated: false,
      intakeAppended: false,
      outcome: "verification-failed",
      message: "Production verification did not pass. Leaving Google Sheets status unchanged.",
    };
  }

  if (!recordId) {
    return {
      event: "production-verify",
      recordId: null,
      sheet1Updated: false,
      intakeAppended: false,
      outcome: "no-record-id",
      message: "No Record ID found in PR metadata. Skipping Built promotion.",
    };
  }

  const { sheet, matches } = await findFeatureMatches(sheetsClient, recordId);

  if (matches.length !== 1) {
    return {
      event: "production-verify",
      recordId,
      sheet1Updated: false,
      intakeAppended: false,
      outcome: matches.length === 0 ? "missing-governed-row" : "duplicate-governed-rows",
      message:
        matches.length === 0
          ? `Parsed ${recordId}, but no governed Sheet1 row matched the immutable Record ID key in column C. Skipping Built promotion.`
          : `Parsed ${recordId}, but found ${matches.length} matching Sheet1 rows. Skipping Built promotion.`,
    };
  }

  const [match] = matches;

  if (match.status === "Built") {
    return {
      event: "production-verify",
      recordId,
      sheet1Updated: false,
      intakeAppended: false,
      outcome: "already-built",
      message: `Matched ${recordId} on row ${match.rowNumber}. Status is already Built.`,
    };
  }

  if (match.status !== "Merged") {
    return {
      event: "production-verify",
      recordId,
      sheet1Updated: false,
      intakeAppended: false,
      outcome: "unexpected-status",
      message: `Matched ${recordId} on row ${match.rowNumber}, but current status is "${match.status || "blank"}". Built promotion only runs from Merged.`,
    };
  }

  await updateFeatureStatus(sheetsClient, sheet, match.rowNumber, "Built");
  return {
    event: "production-verify",
    recordId,
    sheet1Updated: true,
    intakeAppended: false,
    outcome: "built-promoted",
    message: `Updated ${recordId} on row ${match.rowNumber} from "Merged" to "Built" after successful production verification.`,
  };
}

async function getAccessToken({ clientEmail, privateKey, fetchImpl }) {
  const issuedAt = Math.floor(Date.now() / 1000);
  const expiresAt = issuedAt + 3600;
  const header = { alg: "RS256", typ: "JWT" };
  const claimSet = {
    iss: clientEmail,
    scope: "https://www.googleapis.com/auth/spreadsheets",
    aud: "https://oauth2.googleapis.com/token",
    exp: expiresAt,
    iat: issuedAt,
  };

  const encode = (value) => Buffer.from(JSON.stringify(value)).toString("base64url");

  const unsignedToken = `${encode(header)}.${encode(claimSet)}`;
  const signer = createSign("RSA-SHA256");
  signer.update(unsignedToken);
  signer.end();
  const signature = signer.sign(privateKey).toString("base64url");
  const assertion = `${unsignedToken}.${signature}`;

  const response = await fetchImpl("https://oauth2.googleapis.com/token", {
    method: "POST",
    headers: { "content-type": "application/x-www-form-urlencoded" },
    body: new URLSearchParams({
      grant_type: "urn:ietf:params:oauth:grant-type:jwt-bearer",
      assertion,
    }),
  });

  const body = await response.text();
  if (!response.ok) {
    throw new Error(`Failed to exchange Google service account JWT: ${response.status} ${body}`);
  }

  const parsed = JSON.parse(body);
  if (!parsed.access_token) {
    throw new Error("Google OAuth response did not include an access_token.");
  }

  return parsed.access_token;
}

export function createGoogleSheetsClient({
  serviceAccountJson,
  sheetId,
  fetchImpl = fetch,
  retryAttempts = DEFAULT_RETRY_ATTEMPTS,
  accessTokenProvider,
}) {
  if (!serviceAccountJson && !accessTokenProvider) {
    throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON is required.");
  }

  if (!sheetId) {
    throw new Error("GOOGLE_SHEET_ID is required.");
  }

  let tokenFactory = accessTokenProvider;

  if (!tokenFactory) {
    const serviceAccount = JSON.parse(serviceAccountJson);
    const clientEmail = serviceAccount.client_email;
    const privateKey = serviceAccount.private_key?.replace(/\\n/g, "\n");

    if (!clientEmail || !privateKey) {
      throw new Error("GOOGLE_SERVICE_ACCOUNT_JSON must include client_email and private_key.");
    }

    tokenFactory = () => getAccessToken({ clientEmail, privateKey, fetchImpl });
  }

  let cachedToken = null;

  async function requestJson(url, init, attempt = 1) {
    if (!cachedToken) {
      cachedToken = await tokenFactory();
    }

    const response = await fetchImpl(url, {
      ...init,
      headers: {
        authorization: `Bearer ${cachedToken}`,
        "content-type": "application/json",
        ...(init?.headers ?? {}),
      },
    });

    const body = await response.text();

    if (response.status === 401 && attempt < retryAttempts) {
      cachedToken = null;
      await sleep(200 * attempt);
      return requestJson(url, init, attempt + 1);
    }

    if (!response.ok) {
      if (RETRY_STATUS_CODES.has(response.status) && attempt < retryAttempts) {
        await sleep(250 * attempt);
        return requestJson(url, init, attempt + 1);
      }

      throw new Error(`Google Sheets API request failed (${response.status}): ${body}`);
    }

    return body ? JSON.parse(body) : {};
  }

  return {
    async getValues(range) {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}`;
      const payload = await requestJson(url, { method: "GET" });
      return payload.values ?? [];
    },
    async updateValues(range, values) {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}?valueInputOption=RAW`;
      return requestJson(url, {
        method: "PUT",
        body: JSON.stringify({ values }),
      });
    },
    async appendValues(range, values) {
      const url = `https://sheets.googleapis.com/v4/spreadsheets/${sheetId}/values/${encodeURIComponent(range)}:append?valueInputOption=RAW&insertDataOption=INSERT_ROWS`;
      return requestJson(url, {
        method: "POST",
        body: JSON.stringify({ values }),
      });
    },
  };
}
