# Summary

## Branch
- [ ] Correct branch used
- [ ] No unrelated changes included
- [ ] PR title or branch includes canonical `PRD-XX` when this work maps to a governed feature
- [ ] If this work is intentionally unmapped, expect Intake Queue review instead of direct `Sheet1` insertion

## Local Validation
- [ ] App runs locally
- [ ] Relevant flows tested

## Preview Validation
- [ ] OAuth or login works if applicable
- [ ] Session persists
- [ ] Redirects are correct
- [ ] Signed-in versus signed-out state is correct
- [ ] No SSR or hydration issues
- [ ] Environment variables behave correctly

## Production Impact
- [ ] No known regression risk
- [ ] Safe to deploy

## Feature Type
- [ ] UI / Experience
- [ ] Data / Pipeline
- [ ] Auth / Session
- [ ] SSR / Environment Logic

## Documentation Updates
- [ ] `docs/product/briefs/` updated if applicable
- [ ] `docs/product/prd/` updated if applicable
- [ ] relevant `docs/engineering/` bucket updated if applicable
- [ ] Google Sheets governance rules preserved: `Sheet1` for mapped work, `Intake Queue` for unmapped or ambiguous work
- [ ] No sensitive information included

## Security Check
- [ ] No secrets or tokens included
- [ ] No auth vulnerabilities exposed
- [ ] No sensitive logs, cookies, or headers included

## Build & Test
- [ ] Build passes
- [ ] Lint and test results reviewed

## Merge Readiness
- [ ] Local validation complete
- [ ] Preview validation complete
- [ ] Documentation complete
- [ ] No known blockers
