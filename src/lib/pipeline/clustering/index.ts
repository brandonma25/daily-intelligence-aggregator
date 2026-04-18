import type {
  ClusterMergeDecision,
  ClusterRepresentativeScore,
  ClusterSimilarityBreakdown,
  SignalCluster,
} from "@/lib/models/signal-cluster";
import type { NormalizedArticle } from "@/lib/models/normalized-article";
import {
  computeTimeProximityScore,
  extractKeywords,
  jaccardSimilarity,
  keywordSpecificity,
  normalizeEntity,
  overlapSimilarity,
  stableId,
  tokenize,
} from "@/lib/pipeline/shared/text";

type ArticleProfile = {
  article: NormalizedArticle;
  title_tokens: string[];
  content_tokens: string[];
  keywords: string[];
  specific_keywords: string[];
  normalized_entities: string[];
  event_terms: string[];
  published_at_ms: number;
};

type ClusterEvaluation = {
  can_merge: boolean;
  breakdown: ClusterSimilarityBreakdown;
  reasons: string[];
  representative_article_id: string;
};

function buildArticleProfile(article: NormalizedArticle): ArticleProfile {
  const titleTokens = article.title_tokens.length ? article.title_tokens : tokenize(article.title);
  const contentTokens = article.content_tokens.length ? article.content_tokens : tokenize(article.content);
  const keywords = article.keywords.length
    ? article.keywords
    : extractKeywords(`${article.title} ${article.content}`, 10);
  const specificKeywords = keywordSpecificity(keywords);
  const normalizedEntities = article.normalized_entities.length
    ? article.normalized_entities
    : article.entities.map(normalizeEntity).filter(Boolean);
  const entityTokens = normalizedEntities.flatMap((entity) => entity.split(/\s+/));
  const eventTerms = specificKeywords.filter((keyword) => !entityTokens.includes(keyword)).slice(0, 6);

  return {
    article,
    title_tokens: titleTokens,
    content_tokens: contentTokens,
    keywords,
    specific_keywords: specificKeywords,
    normalized_entities: normalizedEntities,
    event_terms: eventTerms,
    published_at_ms: new Date(article.published_at).getTime(),
  };
}

function buildClusterKeywords(profiles: ArticleProfile[]) {
  return extractKeywords(
    profiles
      .map((profile) => `${profile.article.title} ${profile.article.content}`)
      .join(" "),
    10,
  );
}

function buildClusterEntitySet(profiles: ArticleProfile[]) {
  return [...new Set(profiles.flatMap((profile) => profile.normalized_entities))];
}

function buildClusterEventTerms(profiles: ArticleProfile[]) {
  return [...new Set(profiles.flatMap((profile) => profile.event_terms))];
}

function buildClusterContentTokens(profiles: ArticleProfile[]) {
  return [...new Set(profiles.flatMap((profile) => profile.content_tokens).slice(0, 40))];
}

function countOverlap(left: string[], right: string[]) {
  const rightSet = new Set(right);
  return [...new Set(left)].filter((token) => rightSet.has(token)).length;
}

function compareTokenSets(left: string[], right: string[]) {
  return Math.max(jaccardSimilarity(left, right), overlapSimilarity(left, right));
}

function getRepresentativeCandidateScores(profiles: ArticleProfile[]): ClusterRepresentativeScore[] {
  const newestTimestamp = Math.max(...profiles.map((profile) => profile.published_at_ms));

  return profiles.map((profile) => {
    const averageSimilarity =
      profiles.length === 1
        ? 1
        : profiles
            .filter((candidate) => candidate.article.id !== profile.article.id)
            .reduce((sum, candidate) => {
              const titleSimilarity = jaccardSimilarity(profile.title_tokens, candidate.title_tokens);
              const keywordSimilarity = jaccardSimilarity(profile.keywords, candidate.keywords);
              const entitySimilarity = jaccardSimilarity(
                profile.normalized_entities,
                candidate.normalized_entities,
              );

              return sum + 0.45 * titleSimilarity + 0.35 * keywordSimilarity + 0.2 * entitySimilarity;
            }, 0) / Math.max(1, profiles.length - 1);

    const recencyScore =
      newestTimestamp === profile.published_at_ms
        ? 1
        : computeTimeProximityScore(profile.published_at_ms, newestTimestamp);
    const specificityBonus = Math.min(1, profile.specific_keywords.length / 6);
    const score = Number((0.6 * averageSimilarity + 0.25 * specificityBonus + 0.15 * recencyScore).toFixed(3));

    return {
      article_id: profile.article.id,
      score,
      reasons: [
        `avg similarity ${averageSimilarity.toFixed(2)}`,
        `specific keywords ${profile.specific_keywords.length}`,
        `recency ${recencyScore.toFixed(2)}`,
      ],
    };
  });
}

function selectRepresentativeArticle(profiles: ArticleProfile[]) {
  const scores = getRepresentativeCandidateScores(profiles).sort((left, right) => {
    if (right.score !== left.score) {
      return right.score - left.score;
    }

    return left.article_id.localeCompare(right.article_id);
  });
  const selected = profiles.find((profile) => profile.article.id === scores[0]?.article_id) ?? profiles[0];

  return {
    representative_article: selected.article,
    representative_scores: scores,
    representative_selection_reason:
      scores[0]
        ? `Selected article ${scores[0].article_id} with score ${scores[0].score.toFixed(2)} (${scores[0].reasons.join(", ")}).`
        : "Selected the only article in the cluster.",
  };
}

function evaluateClusterFit(article: ArticleProfile, clusterProfiles: ArticleProfile[]): ClusterEvaluation {
  const clusterKeywords = buildClusterKeywords(clusterProfiles);
  const clusterSpecificKeywords = keywordSpecificity(clusterKeywords);
  const clusterEntities = buildClusterEntitySet(clusterProfiles);
  const clusterEventTerms = buildClusterEventTerms(clusterProfiles);
  const clusterContentTokens = buildClusterContentTokens(clusterProfiles);
  const representative = selectRepresentativeArticle(clusterProfiles).representative_article;
  const representativeProfile = buildArticleProfile(representative);
  const titleSimilarity = compareTokenSets(article.title_tokens, representativeProfile.title_tokens);
  const keywordOverlap = Math.max(
    compareTokenSets(article.keywords, clusterKeywords),
    compareTokenSets(article.specific_keywords, clusterSpecificKeywords),
  );
  const entityOverlap = compareTokenSets(article.normalized_entities, clusterEntities);
  const contentSimilarity = compareTokenSets(
    article.content_tokens.slice(0, 30),
    clusterContentTokens.slice(0, 30),
  );
  const timeProximity = computeTimeProximityScore(
    article.published_at_ms,
    representativeProfile.published_at_ms,
  );
  const weightedScore = Number(
    (
      0.33 * titleSimilarity +
      0.27 * keywordOverlap +
      0.15 * entityOverlap +
      0.15 * contentSimilarity +
      0.1 * timeProximity
    ).toFixed(3),
  );
  const sharedSpecificKeywords = countOverlap(article.specific_keywords, clusterSpecificKeywords);
  const sharedEntities = countOverlap(article.normalized_entities, clusterEntities);
  const sharedEventTerms = countOverlap(article.event_terms, clusterEventTerms);
  const reasons: string[] = [];

  if (weightedScore < 0.32) {
    reasons.push("weighted similarity below 0.32");
  }

  if (titleSimilarity < 0.18 && keywordOverlap < 0.28) {
    reasons.push("title and keyword overlap are both weak");
  }

  if (
    clusterEntities.length > 0 &&
    article.normalized_entities.length > 0 &&
    sharedEntities === 0 &&
    sharedSpecificKeywords < 2 &&
    titleSimilarity < 0.52
  ) {
    reasons.push("entity mismatch against existing cluster");
  }

  if (sharedSpecificKeywords === 0 && titleSimilarity < 0.58 && contentSimilarity < 0.35) {
    reasons.push("overlap is too generic and not event-specific");
  }

  if (sharedEntities > 0 && sharedEventTerms === 0 && keywordOverlap < 0.45 && titleSimilarity < 0.62) {
    reasons.push("same entity but different event signature");
  }

  if (timeProximity < 0.2 && titleSimilarity < 0.65 && keywordOverlap < 0.5) {
    reasons.push("stories are too far apart in time for a confident merge");
  }

  return {
    can_merge: reasons.length === 0,
    breakdown: {
      title_similarity: Number(titleSimilarity.toFixed(3)),
      keyword_overlap: Number(keywordOverlap.toFixed(3)),
      entity_overlap: Number(entityOverlap.toFixed(3)),
      content_similarity: Number(contentSimilarity.toFixed(3)),
      time_proximity: Number(timeProximity.toFixed(3)),
      weighted_score: weightedScore,
    },
    reasons: reasons.length
      ? reasons
      : [
          `weighted similarity ${weightedScore.toFixed(2)}`,
          `specific keyword overlap ${sharedSpecificKeywords}`,
          `entity overlap ${sharedEntities}`,
        ],
    representative_article_id: representative.id,
  };
}

function createCluster(articleProfile: ArticleProfile): SignalCluster {
  return {
    cluster_id: stableId(articleProfile.article.title, articleProfile.article.url),
    articles: [articleProfile.article],
    representative_article: articleProfile.article,
    topic_keywords: articleProfile.keywords,
    cluster_size: 1,
    cluster_debug: {
      merge_decisions: [],
      prevented_merge_count: 0,
      representative_selection_reason: "Selected the only article in the cluster.",
      representative_scores: [
        {
          article_id: articleProfile.article.id,
          score: 1,
          reasons: ["only article in cluster"],
        },
      ],
    },
  };
}

function refreshCluster(cluster: SignalCluster) {
  const profiles = cluster.articles.map(buildArticleProfile);
  const representative = selectRepresentativeArticle(profiles);

  cluster.cluster_size = cluster.articles.length;
  cluster.topic_keywords = buildClusterKeywords(profiles);
  cluster.representative_article = representative.representative_article;
  cluster.cluster_debug.representative_scores = representative.representative_scores;
  cluster.cluster_debug.representative_selection_reason = representative.representative_selection_reason;
}

export function clusterNormalizedArticles(articles: NormalizedArticle[]): SignalCluster[] {
  const clusters: SignalCluster[] = [];
  const sortedProfiles = articles
    .slice()
    .sort(
      (left, right) =>
        new Date(right.published_at).getTime() - new Date(left.published_at).getTime(),
    )
    .map(buildArticleProfile);

  sortedProfiles.forEach((articleProfile) => {
    const evaluations = clusters.map((cluster) => ({
      cluster,
      evaluation: evaluateClusterFit(articleProfile, cluster.articles.map(buildArticleProfile)),
    }));

    evaluations
      .filter((entry) => !entry.evaluation.can_merge)
      .forEach((entry) => {
        const preventedDecision: ClusterMergeDecision = {
          article_id: articleProfile.article.id,
          compared_to_article_id: entry.evaluation.representative_article_id,
          decision: "prevented",
          reasons: entry.evaluation.reasons,
          breakdown: entry.evaluation.breakdown,
        };
        entry.cluster.cluster_debug.merge_decisions.push(preventedDecision);
        entry.cluster.cluster_debug.prevented_merge_count += 1;
      });

    const bestMergeCandidate = evaluations
      .filter((entry) => entry.evaluation.can_merge)
      .sort((left, right) => right.evaluation.breakdown.weighted_score - left.evaluation.breakdown.weighted_score)[0];

    if (!bestMergeCandidate) {
      clusters.push(createCluster(articleProfile));
      return;
    }

    bestMergeCandidate.cluster.articles.push(articleProfile.article);
    bestMergeCandidate.cluster.cluster_debug.merge_decisions.push({
      article_id: articleProfile.article.id,
      compared_to_article_id: bestMergeCandidate.evaluation.representative_article_id,
      decision: "merged",
      reasons: bestMergeCandidate.evaluation.reasons,
      breakdown: bestMergeCandidate.evaluation.breakdown,
    });
    refreshCluster(bestMergeCandidate.cluster);
  });

  return clusters.sort((left, right) => {
    const sizeDelta = right.cluster_size - left.cluster_size;
    if (sizeDelta !== 0) {
      return sizeDelta;
    }

    const representativeScoreDelta =
      (right.cluster_debug.representative_scores[0]?.score ?? 0) -
      (left.cluster_debug.representative_scores[0]?.score ?? 0);
    if (representativeScoreDelta !== 0) {
      return representativeScoreDelta;
    }

    return (
      new Date(right.representative_article.published_at).getTime() -
      new Date(left.representative_article.published_at).getTime()
    );
  });
}
