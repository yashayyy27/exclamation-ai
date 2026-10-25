> Recruitment upgrade: see [verification](docs/verification.md), [readiness matrix](docs/rga-role-evidence-matrix.md) and [audit](docs/audit/2026-10-22-gap-report.md) for current evidence and owner-dependent gates. The following records the original implementation.

> 25 October update: [one genuine BigQuery Console analysis](docs/bigquery-analysis-2026-10-25.md) is verified, including full extraction, nine reconciled aggregates and UTC date coverage. The original unchecked Google item below still applies to the **SDK/ADC path**, not to that separately verified Console execution. GA4/GTM and real model evaluation remain pending.

# ! — implementation status

## Implemented and verified locally

- [x] Seven responsive React pages with working navigation, scoped analytics filters and accessible chart drilldowns.
- [x] Demo catalog, product detail, add/remove cart, safe checkout, unique demo purchase and downloadable local event trail.
- [x] Eight event contracts and deterministic tests; consent-gated dataLayer, ecommerce clearing and UTM allowlist.
- [x] Raw fixture generation, three SQL grains, ordered funnel, deduplicated revenue, channel/trend analysis and quality counters.
- [x] Twelve browser snapshots derived from Python, parity-tested against raw transformations.
- [x] Six approved tools, deterministic analyst, structured schema and exact numeric/source/date validation, abstention and bounded retry.
- [x] 36 evaluation cases, authentic baseline/revised runs, per-case inspection and failure review. Fixture scores only.
- [x] API source/auth/rate-limit behavior; BigQuery dry-run/cost/row-limit guards and Responses protocol with mocked SDKs.
- [x] Descriptive attribution limitations; adjustable experiment sample-size assumptions.
- [x] Editable client note, review reset, Markdown/PDF downloads; six-slide draft rendered and all six pages inspected.
- [x] Python lint/typecheck/tests, frontend lint/typecheck/unit/build; desktop/mobile flows and automated accessibility scans (see current logs).
- [x] Architecture, measurement, provenance, glossary, QA, client story, demo script, interview Q&A, next PRD and role evidence matrix.
- [x] Dependency/secret-path checks; .env.example/.gitignore and CI workflows.

## Implemented, external execution not verified

- [x] Real BigQuery Python SDK extraction against a fixed public dataset, dry run and capped query configuration.
- [x] Real OpenAI Responses strict tool-call and structured-output provider. Live report output is separate.
- [x] Consent-gated GTM loader and Google event contracts. Owner container/property configuration required.
- [x] GitHub Actions CI and scheduled fixture evaluation definitions; actual hosted execution recorded only in release.md.

## Requires owner credentials / external verification

- [ ] Google Cloud project + ADC and a real bounded public query with job ID and reconciliation.
- [ ] Test GTM container + GA4 property; actual Tag Assistant/DebugView screenshots, duplicate and consent network checks.
- [ ] OpenAI project key, configured model and owner-approved spend budget; real held-out semantic evaluation.
- [ ] Owner first-party GA4-to-BigQuery linking and separate-source reconciliation.
- [ ] Applicant's own review of the code, numerical reasoning and client recommendation.

## Release status

Published: [public source repository](https://github.com/yashayyy27/exclamation-ai) and [working GitHub Pages demo](https://yashayyy27.github.io/exclamation-ai/). Initial hosted CI and Pages build/deploy jobs completed successfully; the deployed Overview and Evaluation Studio were browser-verified. Consult [docs/release.md](docs/release.md) for code verification commits and actual workflow evidence. External Google/model verification remains separate.

## Planned, not represented as working

- [ ] Durable signed approval/audit storage and production tenant authorization.
- [ ] Multi-touch attribution once sufficient touchpoints and a declared window exist.
- [ ] Matched spend and causal experiment results before CPA/ROAS or uplift claims.
- [ ] Production schema evolution, independent holdout evals, screen-reader/device review and monitoring.
