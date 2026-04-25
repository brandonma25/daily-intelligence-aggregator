import {
  parseEditorialWhyItMattersContent,
  type EditorialWhyItMattersContent,
} from "@/lib/editorial-content";
import { logServerEvent } from "@/lib/observability";
import { createSupabaseServiceRoleClient } from "@/lib/supabase/server";

const PUBLISHED_SIGNAL_SELECT = [
  "id",
  "briefing_date",
  "rank",
  "title",
  "source_name",
  "source_url",
  "summary",
  "tags",
  "signal_score",
  "selection_reason",
  "published_why_it_matters",
  "published_why_it_matters_payload",
].join(", ");

type PublishedSignalRow = {
  id: string;
  briefing_date: string | null;
  rank: number | null;
  title: string | null;
  source_name: string | null;
  source_url: string | null;
  summary: string | null;
  tags: string[] | null;
  signal_score: number | null;
  selection_reason: string | null;
  published_why_it_matters: string | null;
  published_why_it_matters_payload: unknown | null;
};

export type PublishedSignalPost = {
  id: string;
  briefingDate: string | null;
  rank: number;
  title: string;
  sourceName: string;
  sourceUrl: string;
  summary: string;
  tags: string[];
  signalScore: number | null;
  selectionReason: string;
  publishedWhyItMatters: string;
  publishedWhyItMattersStructured: EditorialWhyItMattersContent | null;
};

function normalizeText(value: string | null | undefined) {
  return value?.trim() ?? "";
}

export async function getPublishedSignalPosts(): Promise<PublishedSignalPost[]> {
  const supabase = createSupabaseServiceRoleClient();

  if (!supabase) {
    return [];
  }

  const result = await supabase
    .from("signal_posts")
    .select(PUBLISHED_SIGNAL_SELECT)
    .eq("is_live", true)
    .eq("editorial_status", "published")
    .order("rank", { ascending: true })
    .limit(5);

  if (result.error) {
    logServerEvent("warn", "Published signal posts could not be loaded", {
      route: "/signals",
      errorMessage: result.error.message,
    });
    return [];
  }

  return ((result.data ?? []) as unknown as PublishedSignalRow[])
    .map((row) => ({
      id: row.id,
      briefingDate: row.briefing_date,
      rank: typeof row.rank === "number" ? row.rank : 0,
      title: normalizeText(row.title),
      sourceName: normalizeText(row.source_name),
      sourceUrl: normalizeText(row.source_url),
      summary: normalizeText(row.summary),
      tags: Array.isArray(row.tags) ? row.tags.filter(Boolean) : [],
      signalScore: row.signal_score,
      selectionReason: normalizeText(row.selection_reason),
      publishedWhyItMatters: normalizeText(row.published_why_it_matters),
      publishedWhyItMattersStructured: parseEditorialWhyItMattersContent(
        row.published_why_it_matters_payload,
      ),
    }))
    .filter((post) => post.rank > 0 && post.title && post.publishedWhyItMatters)
    .slice(0, 5);
}
