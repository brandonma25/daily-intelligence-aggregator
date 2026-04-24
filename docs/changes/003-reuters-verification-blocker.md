# Reuters World Preview Verification Blocker

- Branch: `feature/public-source-manifest-v2`
- Verification timestamp: 2026-04-23T13:15:31Z
- Preview URL: `https://daily-intelligence-aggregator-git-ba69cc-brandonma25s-projects.vercel.app`
- Vercel deployment: `dpl_G4EBrPivZAstu92dudtFNKNJmkUf`
- Deployment URL: `https://daily-intelligence-aggregator-ybs9-crycvfce0.vercel.app`

## Classification

Classification: `b) Fetch failed in preview`.

Reuters World resolved into the preview-rendered public source list, but the generated homepage diagnostics marked Reuters World as degraded and reported zero Politics-category source availability. Per the Phase 0 gate, no Phase 1-3 manifest expansion work was attempted.

## Evidence

The preview homepage was loaded with a cache-busting query:

```text
GET https://daily-intelligence-aggregator-git-ba69cc-brandonma25s-projects.vercel.app/?debug=1&phase0=1776950130
status=200
```

The rendered server payload included Reuters World in the public source list:

```json
{
  "id": "source-reuters-world",
  "name": "Reuters World",
  "feedUrl": "https://feeds.reuters.com/Reuters/worldNews",
  "homepageUrl": "https://www.reuters.com/world/",
  "topicId": "topic-politics",
  "topicName": "World",
  "status": "active"
}
```

The same rendered server payload reported the fetch degradation:

```json
{
  "homepageDiagnostics": {
    "totalArticlesFetched": 30,
    "totalCandidateEvents": 30,
    "lastSuccessfulFetchTime": "2026-04-23T13:15:31.666Z",
    "lastRankingRunTime": "2026-04-23T13:15:31.666Z",
    "failedSourceCount": 1,
    "fallbackSourceCount": 0,
    "degradedSourceNames": ["Reuters World"],
    "sourceCountsByCategory": {
      "tech": 4,
      "finance": 1,
      "politics": 0
    }
  }
}
```

The Vercel logs for the same deployment and request confirmed the public homepage request and showed the no-argument runtime audit context, but did not expose a separate expanded `Feed ingestion failed` warning line for Reuters World:

```text
TIME         HOST                                                                       LEVEL
21:15:30.77  daily-intelligence-aggregator-git-ba69cc-brandonma25s-projects.vercel.app  info     GET /
{"level":"info","message":"Dashboard data request received","timestamp":"2026-04-23T13:15:31.666Z","route":"/","sessionExists":false,"sessionCookiePresent":false,"no_argument_runtime_source_resolution_audit":{"resolution_mode":"no_argument_runtime","mvp_default_public_source_ids":["source-verge","source-ars","source-tldr-tech","source-techcrunch","source-ft"],"donor_fallback_default_ids":["openclaw-the-verge","openclaw-ars-technica","horizon-reuters-world","horizon-reuters-business"],"probationary_runtime_source_ids":["mit-technology-review"],"resolved_runtime_source_ids":["openclaw-the-verge","openclaw-ars-technica","horizon-reuters-world","horizon-reuters-business","mit-technology-review"],"resolved_default_donor_source_ids":["openclaw-the-verge","openclaw-ars-technica","horizon-reuters-world","horizon-reuters-business"],"resolved_probationary_source_ids":["mit-technology-review"],"resolved_other_source_ids":[]}}
```

Because the preview-rendered data shows `source-reuters-world` in `sources` and `Reuters World` in `degradedSourceNames`, this is not a resolution failure. Because no Reuters World articles were counted and the source was degraded, it is not a successful preview fetch.

## Likely Root Cause Hypotheses

- The Reuters RSS feed URL `https://feeds.reuters.com/Reuters/worldNews` may be stale, blocked, redirected in a way the current fetch path does not handle, or unavailable from Vercel's runtime network.
- The upstream feed may be reachable intermittently but returning an empty or non-parseable response during preview execution.
- The current feed timeout or fetch adapter may be too strict for this endpoint in Vercel even though other feeds complete.
- The donor and demo metadata now resolve to the same feed identity, so metadata mismatch is less likely than endpoint reachability or parser compatibility.

## Recommended Next Step

Product should decide whether to replace Reuters World with a currently fetchable Reuters or equivalent politics feed, approve a feed-level reachability investigation for the existing URL, or keep Reuters World in the manifest while accepting that it currently degrades in preview. Do not extend the public manifest with additional Category 1 sources until this source-level fetch failure is resolved or explicitly waived.
