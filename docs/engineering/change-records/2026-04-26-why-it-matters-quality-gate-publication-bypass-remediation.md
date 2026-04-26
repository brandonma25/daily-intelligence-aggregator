# Why It Matters Quality Gate Publication Bypass Remediation

- Date: 2026-04-26
- Change type: remediation
- Source of truth: why-it-matters quality gate implementation, Signal Formation Engine Audit, PRD-35, and PRD-53
- Canonical PRD required: no
- Object level: Surface Placement plus Card copy/public read model metadata

## Intent

Close the downstream bypass that allowed quality-gate-rejected or otherwise unapproved `whyItMatters` copy to reach public homepage surfaces through stored snapshot and fallback paths.

This is remediation for the existing PRD-35 and PRD-53 editorial pipeline. It does not create a new feature or canonical PRD.

## Required Reading

Completed before code changes:

- `docs/engineering/TERMINOLOGY_RUNTIME_SEMANTIC_AUDIT.md`
- `docs/engineering/SIGNAL_POSTS_OPERATIONAL_CONTRACT.md`
- `docs/engineering/BOOTUP_CANONICAL_TERMINOLOGY.md`

The implementation treats `signal_posts` as Surface Placement plus Card copy/public read model storage, not canonical Signal identity.

## Trace

Quality gate status is set in `src/lib/signals-editorial.ts`:

1. `mapBriefingItemToSignalPost()` validates generated `aiWhyItMatters` and stores validation metadata on the placement candidate.
2. `persistSignalPostCandidates()` calls `flagCardForRewrite()` before insertion and writes `why_it_matters_validation_status`, failures, details, and `editorial_status = "needs_review"`.
3. Rejected rows remain non-blocking for the pipeline run and enter the editorial review queue with failure reasons.

The bypass was downstream:

1. `getHomepageSignalSnapshot()` first tried `published_live` rows.
2. When no published live set existed, it loaded the latest stored snapshot through `loadCurrentTopFive()`.
3. `loadCurrentTopFive()` selected rows by `briefing_date` and `rank` only, without checking approval state or quality-gate status.
4. `src/lib/data.ts` mapped those rows into `BriefingItem` card data.
5. `selectHomepageSignalWhyItMatters()` fell back from missing published or edited copy to `aiWhyItMatters`, then selection reason, summary, or static placeholder copy.
6. `src/components/landing/homepage.tsx` rendered the Why it matters section whenever the card reached the homepage model.

## Fix

- Public latest-snapshot reads now use only rows with `editorial_status` of `approved` or `published` and non-empty human editorial copy.
- Public latest-snapshot mapping no longer falls back to AI draft text, selection reasons, summaries, or placeholder text for `whyItMatters`.
- Top 5/depth publishing no longer promotes unapproved depth rows from AI draft text.
- Static public homepage placeholders no longer inject a generic why-it-matters fallback string.
- Homepage cards omit the Why it matters section when no approved copy is available.

## generateBriefingAction Confirmation

`generateBriefingAction()` still calls `persistSignalPostsForBriefing()`, so it can write global `signal_posts` review rows. The semantic audit confirms there is no currently routed non-editorial UI caller: the only static caller is `ManualRefreshTrigger` inside dormant `PersonalizedDashboard`, while `/dashboard` redirects to `/`.

This remediation does not reactivate `PersonalizedDashboard`, `ManualRefreshTrigger`, or any legacy dashboard path.

## Non-Goals

- No changes to `validateWhyItMatters()` or the four quality-gate rules.
- No changes to the template generation layer.
- No ranking pipeline changes.
- No LLM or external API calls.
- No schema changes.
- No new canonical PRD.
