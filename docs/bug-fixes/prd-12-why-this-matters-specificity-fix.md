# PRD 12 Specificity Fix Bug Notes

## Fixed
- Uniform fallback boilerplate no longer dominates rendered cards.
- Opening clauses now name the company, institution, market, or safe event phrase for normal paths.
- Governance and diplomacy stories no longer default to equities or technology phrasing.
- Batch-level repetition controls now apply to fallback copy too.
- Signal labels vary more appropriately for thin versus stronger stories.

## Safeguards
- Low-data fallback remains available for genuinely weak or ambiguous stories.
- Governance fallbacks stay within governance and diplomatic language.
- Tests cover funding, market-data, governance, and mortgage/rates story shapes.

## Remaining Tuning Risk
- Real preview batches may still need phrase tuning if upstream titles are unusually noisy.
- Signal thresholds may need minor calibration after another preview pass on live data.
