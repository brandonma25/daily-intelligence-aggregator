# PRD 12 — Why This Matters Precision Fix Testing

## Automated Coverage

- Pronoun entity rejection
- Malformed entity cleanup
- Non-signal advice/Q&A classification
- Same-entity multi-card differentiation
- Subject-first explanation openings
- Defense/political domain-safe routing

## Commands

- `npm install`
- `npm run lint`
- `npm test -- src/lib/why-it-matters.test.ts src/lib/event-intelligence.test.ts`
- `npm run test`
- `npm run build`
- `npm run dev`

## Manual Review Focus

- Confirm the opening sentence names the company, institution, country, or safe event phrase.
- Confirm advice-like articles are not framed as macro or policy signals.
- Confirm same-entity cards differ when the headline change differs.
- Confirm weak/non-signal stories do not get inflated signal labels.
