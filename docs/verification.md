# Recruitment upgrade verification

Audit date: **22 October 2026 (Australia/Sydney)**. Machine receipts use UTC. Baseline main: `ba5a2738339fa939002bef9a43cbd6e76d207677`. Feature branch: `codex/rga-readiness-upgrade`.

## Observed checks

- Baseline rerun: 27 Python tests, 47 frontend tests; lint, mypy, TypeScript and production build passed.
- Upgraded first check: 43 Python tests, 48 frontend tests; lint/types/build passed. Final full check: **45 Python tests and 48 frontend tests passed**, with lint, mypy, TypeScript and production build passing. [Actual log](evidence/readiness-checks.txt).
- Development policy evaluation: v1 21/36, v2 36/36; zero model calls. Numerical grading now checks an independent fixed oracle; schema validation is executed rather than hardcoded.
- Separate release cases: initial 23/24; H02 oracle adjudicated, corrected run 24/24. Original failed run is retained. The inspected set is not untouched held-out evidence. No live model score exists.
- Adversarial replay: original metric validator ACCEPTED a near-equal duplicate replacing purchases; upgraded gate REJECTED the identical candidate. Zero model calls. See [receipt](evidence/validator-replay.json).
- Initial expanded browser suite: 13/14; mobile axe found a non-focusable scroll region. Corrected before publication; **full rerun passed 14/14**, including both seven-page axe scans. [Actual log](evidence/readiness-browser.txt). The suite scans all seven pages, desktop and mobile, and covers purchase, consent order, review/export and campaign/attribution exploration.
- Six-slide PDF generated from actual fixture scope, all six pages rendered with PyMuPDF and visually inspected. Actual count is six; all text bounds fit. The committed report remains DRAFT / NOT REVIEWED; an automated export is not human approval.

- Dependency audits: npm reports **0 vulnerabilities**; the locked Python audit reports **no known vulnerabilities**. [npm log](evidence/readiness-npm-audit.txt), [Python log](evidence/readiness-python-audit.txt).
- `make dev` child-process smoke: API health and web HTTP passed; both owned server process groups stopped cleanly. The old process-group-wide `kill 0` cleanup was removed.

## Integrations

No paid calls were made. OpenAI key/model and Google project/ADC were absent at audit start. The owner has offered to configure integrations, but IDs/configuration and spend approval remain pending. No Tag Assistant, GA4 DebugView or real BigQuery receipt exists. These cannot be marked verified by local tests.

Run [the bounded integration protocol](integration-verification.md) only after owner setup and approval. The GoogleSQL reconciliation query and real Responses behaviour remain NOT YET VERIFIED against their services, even when mocked protocol tests pass. Dollar cost is unknown. Do not treat null as zero.

## Publication

A pull request and hosted CI verification will be linked here after they actually exist. Until then, the public Pages URL represents the previous main build. No failed-test merge is permitted.

## Remaining limits

Single-process API rate limiting, local review flag, small inspected test set, approximate independent-session power calculation, one synthetic campaign, absent spend/touchpoints, public obfuscation and UTC boundary-session truncation. No signed approvals, multi-tenant isolation certification, screen-reader certification, real client outcomes or verified live LLM quality. Applicant understanding must be demonstrated separately from AI-assisted generation.
