type Slot = "Core" | "Context";
type Category = "Tech" | "Finance" | "Politics";

export type EditorialCandidateForNotion = {
  headline: string;
  source: string;
  body: string;
  url: string;
  category: Category | null;
  newsletterCoOccurrence: number;
  slot: Slot;
};

const NOTION_API_VERSION = "2022-06-28";
const NOTION_PAGES_URL = "https://api.notion.com/v1/pages";
const NOTION_DATA_SOURCES_QUERY_URL = (databaseId: string) =>
  `https://api.notion.com/v1/databases/${databaseId}/query`;

function richText(content: string) {
  return [{ text: { content: content.slice(0, 2000) } }];
}

/**
 * Normalize a headline for duplicate detection.
 * Idempotency relies on headlines being structurally identical across cron
 * runs even if whitespace or casing differs trivially. The pipeline tends to
 * produce stable headlines from RSS titles, so this is conservative — we trim,
 * collapse internal whitespace, and lowercase. We do not strip punctuation
 * (a story titled "Foo: Bar" should not collide with "Foo Bar").
 */
function normalizeHeadline(headline: string): string {
  return headline.trim().replace(/\s+/g, " ").toLowerCase();
}

/**
 * Extract the Headline (title property) text from a Notion page row.
 * Notion title properties are arrays of rich-text objects; we concatenate
 * their plain_text values to recover the visible string.
 */
function extractHeadlineFromPage(page: unknown): string | null {
  if (!page || typeof page !== "object") return null;
  const properties = (page as { properties?: Record<string, unknown> }).properties;
  if (!properties) return null;
  const headline = properties["Headline"];
  if (!headline || typeof headline !== "object") return null;
  const titleArr = (headline as { title?: unknown }).title;
  if (!Array.isArray(titleArr)) return null;
  return titleArr
    .map((node: unknown) => {
      if (!node || typeof node !== "object") return "";
      return (node as { plain_text?: string }).plain_text ?? "";
    })
    .join("");
}

/**
 * Query the Editorial Queue for all rows whose Briefing Date equals the given
 * date string (YYYY-MM-DD). Returns a Set of normalized headlines. Used as a
 * pre-flight check so callers can skip writes for already-present rows.
 *
 * Briefing Date is a Notion date property — filter syntax confirmed against
 * a live row: `properties["Briefing Date"]` returns `{ date: { start: "YYYY-MM-DD" } }`.
 *
 * Pagination: a single editorial day produces ≤7 rows by design, so one page
 * (100 rows max) is always sufficient. Defensive `has_more` handling is added
 * anyway in case the same date accumulates stale entries from past bugs.
 *
 * Fail-open: if the query errors out, we return an empty set so writes
 * proceed (preferable to blocking the whole pipeline on a transient Notion
 * read failure). The duplicate risk is bounded — the next clean run picks up.
 */
export async function fetchExistingHeadlinesForBriefingDate(input: {
  briefingDate: string;
  notionDbId: string;
}): Promise<Set<string>> {
  const { briefingDate, notionDbId } = input;
  const token = process.env.NOTION_TOKEN?.trim();
  if (!token) return new Set();

  const headers = {
    Authorization: `Bearer ${token}`,
    "Content-Type": "application/json",
    "Notion-Version": NOTION_API_VERSION,
  };

  const seen = new Set<string>();
  let cursor: string | undefined;

  try {
    do {
      const body: Record<string, unknown> = {
        filter: {
          property: "Briefing Date",
          date: { equals: briefingDate },
        },
        page_size: 100,
      };
      if (cursor) body.start_cursor = cursor;

      const response = await fetch(NOTION_DATA_SOURCES_QUERY_URL(notionDbId), {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      if (!response.ok) {
        const text = await response.text().catch(() => "(no body)");
        console.warn("[notion-writer] idempotency prefetch failed; proceeding fail-open", {
          status: response.status,
          briefingDate,
          notionDbId,
          responseBody: text.slice(0, 500),
        });
        return seen;
      }

      const json = (await response.json()) as {
        results?: unknown[];
        has_more?: boolean;
        next_cursor?: string | null;
      };

      for (const page of json.results ?? []) {
        const headline = extractHeadlineFromPage(page);
        if (headline) seen.add(normalizeHeadline(headline));
      }

      cursor = json.has_more && json.next_cursor ? json.next_cursor : undefined;
    } while (cursor);
  } catch (error) {
    console.warn("[notion-writer] idempotency prefetch threw; proceeding fail-open", {
      briefingDate,
      notionDbId,
      error: error instanceof Error ? error.message : String(error),
    });
    return seen;
  }

  return seen;
}

export type WriteEditorialQueueRowResult = {
  /** True if a new row was inserted. False if it was skipped as a duplicate. */
  written: boolean;
  /** Set to "duplicate" when the row was skipped. */
  reason?: "duplicate";
};

export async function writeEditorialQueueRow(input: {
  candidate: EditorialCandidateForNotion;
  briefingDate: string;
  notionDbId: string;
  /**
   * Pre-fetched set of normalized headlines already present for this
   * briefingDate. If the candidate's normalized headline is in this set,
   * the write is skipped (idempotency guard). Pass an empty Set to force a
   * write — the prefetch is the caller's responsibility.
   */
  existingHeadlines?: Set<string>;
}): Promise<WriteEditorialQueueRowResult> {
  const { candidate, briefingDate, notionDbId, existingHeadlines } = input;
  const token = process.env.NOTION_TOKEN?.trim();

  if (!token) {
    throw new Error("NOTION_TOKEN is not configured.");
  }

  // Idempotency guard. Skip if the same headline already exists for this
  // briefingDate. The May 16 duplicates (4-5x same row) were caused by the
  // unguarded POST below firing on every cron run; this check is the fix.
  if (existingHeadlines) {
    const normalized = normalizeHeadline(candidate.headline);
    if (existingHeadlines.has(normalized)) {
      console.info("[notion-writer] skipping duplicate", {
        headline: candidate.headline.slice(0, 80),
        briefingDate,
      });
      return { written: false, reason: "duplicate" };
    }
    // Record this headline so a duplicate inside the SAME batch is also caught
    // (rare but possible if scoring picks two candidates with identical titles
    // from different sources). The set is mutated by reference.
    existingHeadlines.add(normalized);
  }

  const properties: Record<string, unknown> = {
    "Headline": { title: richText(candidate.headline) },
    "Source": { rich_text: richText(candidate.source) },
    "Article Body": { rich_text: richText(candidate.body) },
    "Newsletter Co-occurrence": { number: candidate.newsletterCoOccurrence },
    "Slot": { select: { name: candidate.slot } },
    "Briefing Date": { date: { start: briefingDate } },
    "Status": { select: { name: "raw" } },
    "Pushed to Supabase": { checkbox: false },
    "Editorial Source": { select: { name: "AI" } },
  };

  if (candidate.url) {
    properties["Source URL"] = { url: candidate.url };
  }

  if (candidate.category) {
    properties["Category"] = { select: { name: candidate.category } };
  }

  const response = await fetch(NOTION_PAGES_URL, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${token}`,
      "Content-Type": "application/json",
      "Notion-Version": NOTION_API_VERSION,
    },
    body: JSON.stringify({
      parent: { database_id: notionDbId },
      properties,
    }),
  });

  if (!response.ok) {
    const text = await response.text().catch(() => "(no body)");
    let parsed: unknown;
    try { parsed = JSON.parse(text); } catch { parsed = text; }
    console.error("[notion-writer] write failed", {
      status: response.status,
      headline: input.candidate.headline.slice(0, 80),
      notionDbId: input.notionDbId,
      responseBody: parsed,
    });
    throw new Error(`Notion write failed (${response.status}): ${text}`);
  }

  return { written: true };
}
