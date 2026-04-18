import type { NormalizedArticle } from "@/lib/models/normalized-article";
import type { RawItem } from "@/lib/models/raw-item";
import { cleanText, extractEntities } from "@/lib/pipeline/shared/text";

export function normalizeRawItems(items: RawItem[]): NormalizedArticle[] {
  return items.map((item) => ({
    id: item.id,
    title: cleanText(item.title),
    source: cleanText(item.source),
    url: item.url.trim(),
    published_at: item.published_at,
    content: cleanText(item.raw_content || item.title),
    entities: extractEntities(`${item.title} ${item.raw_content}`),
  }));
}
