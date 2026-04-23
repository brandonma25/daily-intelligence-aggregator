import { describe, expect, it, vi } from "vitest";
import {
  INTAKE_QUEUE_HEADERS,
  SHEET1_HEADERS,
  createGoogleSheetsClient,
  parseRecordId,
  promoteVerifiedPullRequest,
  syncMergedPullRequest,
} from "./github-sheets/sync.mjs";

function toColumnIndex(columnLetters) {
  return columnLetters
    .split("")
    .reduce((total, char) => total * 26 + (char.charCodeAt(0) - 64), 0) - 1;
}

class FakeSheetsClient {
  featureRows;
  intakeRows;
  updatedCells = [];
  appendedRows = [];

  constructor({ featureRows, intakeRows }) {
    this.featureRows = featureRows;
    this.intakeRows = intakeRows ?? [INTAKE_QUEUE_HEADERS];
  }

  async getValues(range) {
    if (range.includes("Sheet1")) return this.featureRows;
    if (range.includes("Intake Queue")) return this.intakeRows;
    throw new Error(`Unexpected range: ${range}`);
  }

  async updateValues(range, values) {
    this.updatedCells.push({ range, values });
    const match = range.match(/!([A-Z]+)(\d+)$/);
    if (!match) throw new Error(`Unexpected update range: ${range}`);

    const [, columnLetters, rowNumber] = match;
    const rowIndex = Number(rowNumber) - 1;
    const columnIndex = toColumnIndex(columnLetters);
    this.featureRows[rowIndex][columnIndex] = values[0][0];
  }

  async appendValues(range, values) {
    this.appendedRows.push({ range, values });
    this.intakeRows.push(values[0]);
  }
}

function makeSheet1Row(overrides = {}) {
  const row = Array.from({ length: SHEET1_HEADERS.length }, () => "");
  const defaults = {
    "Row ID": "ROW-24",
    "Build Order": "24",
    "Record ID": "PRD-24",
    "Feature Name": "GitHub Sheets governance automation",
    Layer: "Operations",
    "Feature Type": "Automation",
    "Parent System": "Release automation system",
    Priority: "High",
    Status: "In Review",
    Decision: "keep",
    Owner: "Codex",
    Dependency: "PRD-23",
    Description: "Permanent GitHub to Google Sheets sync",
    "PRD File": "docs/product/prd/prd-24-github-sheets-governance-automation.md",
    Source: "Sheet governance",
    "Last Updated": "2026-04-18",
    Notes: "Human notes stay here",
    "Execution Stage": "Ready",
    "Critical Path Flag": "TRUE",
    "Build Readiness": "Ready",
    "Record Class": "Governed",
    "Priority Score": "91",
  };

  for (const header of SHEET1_HEADERS) {
    const value = overrides[header] ?? defaults[header] ?? "";
    row[SHEET1_HEADERS.indexOf(header)] = value;
  }

  return row;
}

function makeFeatureSheet(rows) {
  return [SHEET1_HEADERS, ...rows];
}

const basePr = {
  title: "PRD-24 tighten feature tracking governance",
  branchName: "feature/prd-24-github-sheets-governance-automation",
  url: "https://github.com/example/repo/pull/24",
  mergedAt: "2026-04-18T01:23:45.000Z",
};

describe("schema analysis snapshot", () => {
  it("parses a PRD from the PR title", () => {
    expect(parseRecordId("Ship PRD-24 governance automation")).toBe("PRD-24");
  });

  it("parses a PRD from the branch name", () => {
    expect(parseRecordId("feature/prd-24-governance")).toBe("PRD-24");
  });
});

describe("syncMergedPullRequest with actual sheet schema", () => {
  it("updates only Status when an exact Record ID match exists", async () => {
    const originalRow = makeSheet1Row();
    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([originalRow.slice()]),
    });

    const result = await syncMergedPullRequest({ sheetsClient, pr: basePr });

    expect(result.outcome).toBe("merged-updated");
    expect(sheetsClient.updatedCells).toEqual([{ range: "'Sheet1'!I2", values: [["Merged"]] }]);
    expect(sheetsClient.featureRows[1][SHEET1_HEADERS.indexOf("Status")]).toBe("Merged");
    expect(sheetsClient.featureRows[1][SHEET1_HEADERS.indexOf("Feature Name")]).toBe(originalRow[SHEET1_HEADERS.indexOf("Feature Name")]);
    expect(sheetsClient.featureRows[1][SHEET1_HEADERS.indexOf("Last Updated")]).toBe(originalRow[SHEET1_HEADERS.indexOf("Last Updated")]);
    expect(sheetsClient.featureRows[1][SHEET1_HEADERS.indexOf("Notes")]).toBe(originalRow[SHEET1_HEADERS.indexOf("Notes")]);
    expect(sheetsClient.featureRows[1][SHEET1_HEADERS.indexOf("Execution Stage")]).toBe(originalRow[SHEET1_HEADERS.indexOf("Execution Stage")]);
    expect(sheetsClient.featureRows[1][SHEET1_HEADERS.indexOf("Priority Score")]).toBe(originalRow[SHEET1_HEADERS.indexOf("Priority Score")]);
    expect(sheetsClient.appendedRows).toHaveLength(0);
  });

  it("does not set Built directly on merge", async () => {
    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([makeSheet1Row({ Status: "In Progress" })]),
    });

    await syncMergedPullRequest({ sheetsClient, pr: basePr });

    expect(sheetsClient.updatedCells).toEqual([{ range: "'Sheet1'!I2", values: [["Merged"]] }]);
    expect(sheetsClient.featureRows[1][SHEET1_HEADERS.indexOf("Status")]).not.toBe("Built");
  });

  it("treats a repeated merge rerun on an already Merged row as a safe no-op", async () => {
    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([makeSheet1Row({ Status: "Merged" })]),
    });

    const result = await syncMergedPullRequest({ sheetsClient, pr: basePr });

    expect(result.outcome).toBe("already-merged");
    expect(sheetsClient.updatedCells).toHaveLength(0);
  });

  it("refuses to downgrade an already Built row on merge rerun", async () => {
    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([makeSheet1Row({ Status: "Built" })]),
    });

    const result = await syncMergedPullRequest({ sheetsClient, pr: basePr });

    expect(result.outcome).toBe("already-built");
    expect(sheetsClient.updatedCells).toHaveLength(0);
  });

  it("appends Intake Queue only when no Record ID is found", async () => {
    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([makeSheet1Row()]),
    });

    const result = await syncMergedPullRequest({
      sheetsClient,
      pr: { ...basePr, title: "tighten feature tracking governance", branchName: "feature/ops-tracker-cleanup" },
    });

    expect(result.outcome).toBe("queued-for-review");
    expect(sheetsClient.updatedCells).toHaveLength(0);
    expect(sheetsClient.appendedRows).toHaveLength(1);
    expect(sheetsClient.appendedRows[0].values[0][INTAKE_QUEUE_HEADERS.indexOf("PR URL")]).toBe(basePr.url);
  });

  it("fails loudly and does not write when duplicate Record ID rows exist", async () => {
    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([
        makeSheet1Row({ "Row ID": "ROW-24A" }),
        makeSheet1Row({ "Row ID": "ROW-24B" }),
      ]),
    });

    const result = await syncMergedPullRequest({ sheetsClient, pr: basePr });

    expect(result.outcome).toBe("duplicate-governed-rows");
    expect(result.message).toContain("found 2 matching Sheet1 rows");
    expect(sheetsClient.updatedCells).toHaveLength(0);
    expect(sheetsClient.appendedRows).toHaveLength(1);
  });

  it("fails loudly when Sheet1 is missing a required header", async () => {
    const brokenHeaders = SHEET1_HEADERS.filter((header) => header !== "Status");
    const sheetsClient = new FakeSheetsClient({
      featureRows: [brokenHeaders, makeSheet1Row()],
    });

    await expect(syncMergedPullRequest({ sheetsClient, pr: basePr })).rejects.toThrow(
      "Sheet1 is missing required headers: Status",
    );
  });

  it("fails loudly when Intake Queue is missing a required header", async () => {
    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([]),
      intakeRows: [INTAKE_QUEUE_HEADERS.filter((header) => header !== "PR URL")],
    });

    await expect(
      syncMergedPullRequest({
        sheetsClient,
        pr: { ...basePr, title: "no record id here", branchName: "feature/unmapped-merge" },
      }),
    ).rejects.toThrow("Intake Queue is missing required headers: PR URL");
  });

  it("ignores blank trailing rows safely", async () => {
    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([makeSheet1Row(), Array.from({ length: SHEET1_HEADERS.length }, () => "")]),
    });

    const result = await syncMergedPullRequest({ sheetsClient, pr: basePr });

    expect(result.outcome).toBe("merged-updated");
    expect(sheetsClient.updatedCells).toHaveLength(1);
  });

  it("does not duplicate Intake Queue entries on rerun for the same PR URL", async () => {
    const existingQueueRow = Array.from({ length: INTAKE_QUEUE_HEADERS.length }, () => "");
    existingQueueRow[INTAKE_QUEUE_HEADERS.indexOf("Source")] = "GitHub";
    existingQueueRow[INTAKE_QUEUE_HEADERS.indexOf("Trigger Type")] = "PR Merge";
    existingQueueRow[INTAKE_QUEUE_HEADERS.indexOf("PR URL")] = basePr.url;

    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([]),
      intakeRows: [INTAKE_QUEUE_HEADERS, existingQueueRow],
    });

    const result = await syncMergedPullRequest({ sheetsClient, pr: basePr });

    expect(result.outcome).toBe("missing-governed-row");
    expect(result.intakeAppended).toBe(false);
    expect(sheetsClient.appendedRows).toHaveLength(0);
  });

  it("leaves human-governed columns untouched", async () => {
    const originalRow = makeSheet1Row({ Status: "Not Built" });
    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([originalRow.slice()]),
    });

    await syncMergedPullRequest({ sheetsClient, pr: basePr });

    for (const header of ["Record ID", "Feature Name", "Decision", "Owner", "Description", "Last Updated", "Notes"]) {
      expect(sheetsClient.featureRows[1][SHEET1_HEADERS.indexOf(header)]).toBe(originalRow[SHEET1_HEADERS.indexOf(header)]);
    }
  });

  it("leaves formula and computed columns untouched", async () => {
    const originalRow = makeSheet1Row({ Status: "In Progress" });
    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([originalRow.slice()]),
    });

    await syncMergedPullRequest({ sheetsClient, pr: basePr });

    for (const header of ["Execution Stage", "Critical Path Flag", "Build Readiness", "Record Class", "Priority Score"]) {
      expect(sheetsClient.featureRows[1][SHEET1_HEADERS.indexOf(header)]).toBe(originalRow[SHEET1_HEADERS.indexOf(header)]);
    }
  });

  it("leaves Last Updated and Notes untouched because they remain human-managed", async () => {
    const originalRow = makeSheet1Row({ Status: "In Progress", "Last Updated": "2026-04-17", Notes: "Keep this note" });
    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([originalRow.slice()]),
    });

    await syncMergedPullRequest({ sheetsClient, pr: basePr });

    expect(sheetsClient.featureRows[1][SHEET1_HEADERS.indexOf("Last Updated")]).toBe("2026-04-17");
    expect(sheetsClient.featureRows[1][SHEET1_HEADERS.indexOf("Notes")]).toBe("Keep this note");
  });
});

describe("promoteVerifiedPullRequest", () => {
  it("promotes Built only after successful production verification", async () => {
    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([makeSheet1Row({ Status: "Merged" })]),
    });

    const result = await promoteVerifiedPullRequest({
      sheetsClient,
      pr: basePr,
      verificationPassed: true,
    });

    expect(result.outcome).toBe("built-promoted");
    expect(sheetsClient.updatedCells).toEqual([{ range: "'Sheet1'!I2", values: [["Built"]] }]);
  });

  it("does not promote Built when production verification fails", async () => {
    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([makeSheet1Row({ Status: "Merged" })]),
    });

    const result = await promoteVerifiedPullRequest({
      sheetsClient,
      pr: basePr,
      verificationPassed: false,
    });

    expect(result.outcome).toBe("verification-failed");
    expect(sheetsClient.updatedCells).toHaveLength(0);
    expect(sheetsClient.featureRows[1][SHEET1_HEADERS.indexOf("Status")]).toBe("Merged");
  });

  it("treats a production-verification rerun on an already Built row as a safe no-op", async () => {
    const sheetsClient = new FakeSheetsClient({
      featureRows: makeFeatureSheet([makeSheet1Row({ Status: "Built" })]),
    });

    const result = await promoteVerifiedPullRequest({
      sheetsClient,
      pr: basePr,
      verificationPassed: true,
    });

    expect(result.outcome).toBe("already-built");
    expect(sheetsClient.updatedCells).toHaveLength(0);
  });
});

describe("createGoogleSheetsClient", () => {
  it("retries transient Google Sheets API failures and succeeds", async () => {
    let apiCallCount = 0;
    const fetchImpl = vi.fn(async () => {
      apiCallCount += 1;
      if (apiCallCount < 3) {
        return new Response("temporary failure", { status: 503 });
      }

      return new Response(JSON.stringify({ values: [] }), { status: 200 });
    });

    const client = createGoogleSheetsClient({
      accessTokenProvider: async () => "token",
      sheetId: "sheet-id",
      fetchImpl,
    });

    await expect(client.getValues("'Sheet1'!A:V")).resolves.toEqual([]);
    expect(fetchImpl).toHaveBeenCalledTimes(3);
  });

  it("fails clearly after exhausting retries", async () => {
    const fetchImpl = vi.fn(async () => new Response("still failing", { status: 503 }));

    const client = createGoogleSheetsClient({
      accessTokenProvider: async () => "token",
      sheetId: "sheet-id",
      fetchImpl,
    });

    await expect(client.getValues("'Sheet1'!A:V")).rejects.toThrow("Google Sheets API request failed (503)");
  });
});
