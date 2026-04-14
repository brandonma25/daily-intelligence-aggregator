import type { SupabaseClient, User } from "@supabase/supabase-js";

export const DEFAULT_TOPIC_SEEDS = [
  {
    name: "Tech",
    description: "Technology, AI, chips, cloud infrastructure, and software shifts worth tracking.",
    color: "#1F4F46",
    keywords: [
      "technology",
      "software",
      "ai",
      "artificial intelligence",
      "startup",
      "big tech",
      "semiconductor",
      "cloud",
      "cybersecurity",
    ],
  },
  {
    name: "Finance",
    description: "Markets, rates, banking, and capital flows that shape financial conditions.",
    color: "#73563c",
    keywords: [
      "finance",
      "markets",
      "stocks",
      "banking",
      "interest rates",
      "federal reserve",
      "investing",
      "earnings",
      "bonds",
    ],
  },
  {
    name: "World",
    description: "Geopolitics, diplomacy, elections, and global developments affecting the operating environment.",
    color: "#35506b",
    keywords: [
      "world",
      "geopolitics",
      "international",
      "diplomacy",
      "conflict",
      "elections",
      "government",
      "global affairs",
    ],
  },
  {
    name: "Business",
    description: "Companies, strategy, deal activity, and economic shifts with commercial impact.",
    color: "#6c4b3c",
    keywords: [
      "business",
      "economy",
      "corporate",
      "mergers",
      "acquisitions",
      "strategy",
      "companies",
      "industry",
      "leadership",
    ],
  },
] as const;

type AppSupabaseClient = SupabaseClient;

export async function seedDefaultTopics(
  supabase: AppSupabaseClient,
  userId: string,
) {
  const result = await supabase.from("topics").upsert(
    DEFAULT_TOPIC_SEEDS.map((topic) => ({
      user_id: userId,
      name: topic.name,
      description: topic.description,
      color: topic.color,
      keywords: [...topic.keywords],
      exclude_keywords: [],
    })),
    { onConflict: "user_id,name" },
  );

  if (result.error) {
    throw result.error;
  }
}

export async function bootstrapUserDefaults(
  supabase: AppSupabaseClient,
  user: User,
  fallbackEmail?: string,
) {
  const profileResult = await supabase.from("user_profiles").upsert({
    id: user.id,
    email: user.email ?? fallbackEmail ?? "",
    last_sign_in_at: new Date().toISOString(),
  });

  if (profileResult.error) {
    throw profileResult.error;
  }

  await seedDefaultTopics(supabase, user.id);
}
