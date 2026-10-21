# ! — implementation phases and observed evidence

All phases were implemented during the build session on 21 October 2026. This is a retrospective record of observed commands, not a claim of externally deployed production operation.

## Phase 0 — inspect and start

Inspected the ZIP/master prompt, current workspace, Git state, runtimes and credential presence without printing secrets. Existing unrelated projects were preserved. Created isolated `exclamation-ai/`, `AGENTS.md` and `docs/architecture.md`. No configured Google project/ADC or OpenAI key/model was present. GitHub connector returned account `yashayyy27`; repository lookup returned 404. `gh` CLI was absent. A private Sites project was initially registered, but the owner later explicitly selected GitHub hosting instead. The unused deployment workflow was cancelled before any source push or deployment; the Sites manifest was removed. Final target: GitHub Pages.

Choice: React/Vite/TypeScript + FastAPI/Pydantic + SQLite for a fully credential-free vertical slice. Public fixture hosting is static; paid integrations stay server-side and opt-in. Dependencies installed with approved network access. Python 3.12 from the bundled runtime replaced the incompatible system Python 3.9 venv.

## Phase 1 — functional foundation

Implemented `apps/web/src/pages/Overview.tsx`, `Measurement.tsx`, `measurement.ts`, original SVG identity and CSS tokens; FastAPI `/health`, `/analytics`, `/ask`; raw fixture generator and local SQL calculation. Started `npm run dev` at `127.0.0.1:5173` and Uvicorn at `127.0.0.1:8000` using approved local-server execution. The first production build passed. No fabricated live/Google state appeared.

Store flow covers list/detail/select/add/remove/begin_checkout/purchase and page_view. Consent gates analytics delivery. Actual browser screenshots were captured only after the app ran.

## Phase 2 — analytics

Implemented `data/sql/clean_events.sql`, `sessions.sql`, `transactions.sql`, fixed public `bigquery_events.sql` and typed Python adapters. Raw fixture calculations produced 420/336/192/139/63 ordered stages and USD 5,040 deduplicated revenue. Quality detected two duplicates and one invalid row. Date/channel filters reconcile to totals. BigQuery actual execution remains blocked by absent owner project/credentials; dry-run, budget, parameter and truncation behavior has mocked SDK tests.

## Phase 3 — bounded analyst and evaluation

Implemented Pydantic schemas, six registered tools, deterministic fixture provider, optional Responses SDK provider, exact evidence validation, bounded retry and no-evidence abstention. Real `evals/run.py` runs recorded baseline v1 21/36 and revised v2 36/36. These measure fixture routing/guards; there were no live model calls. `docs/evaluation-report.md` is generated from actual results. A deliberate API failure is simulated and labelled.

Added tests for numeric/date/unit/source/query tampering, empty data, metadata injection, unregistered tools, API tokens/rate limits and mocked provider protocol. Quality tool citations were corrected to retain full-source scope even when analytics filters narrow the report. A single selected channel now abstains from a multi-channel comparison.

## Phase 4 — client and release

Implemented Customer Journey, Evaluation Studio, Client Room and Data Sources. Added review reset, editable recommendation, actual PDF/Markdown downloads, a six-slide draft and three-minute demo. Every PDF page was rendered with PyMuPDF (Poppler unavailable) and visually inspected; all show source and draft status. `scripts/export_client.ts` keeps committed artifacts draft so automated QA cannot impersonate human approval.

Initial browser run passed 10/10. A later focus-management refinement caused a real regression: making the entire workspace inert also disabled the nested product dialog. Browser purchase tests caught it. Fixed by marking only siblings of the dialog's ancestor path inert; added explicit Tab/Escape/focus-return assertions. A second focus check found React autoFocus captured the close button rather than the opener; the hook now owns initial focus and restores the actual trigger. Retested after the repairs and page-module refactor; final observed output is in `docs/evidence/browser-tests.txt`.

Dependency audit found vulnerabilities in the initial jsPDF/Vitest versions and pytest 8.4.2. Updated to patched versions and reran applicable checks; final audit logs are committed. A TestClient deprecation warning remains visible; it is not a test failure.

Final command evidence: `make check`, `make eval`, `npm run test:e2e`, `npm audit --audit-level=high`, Python `pip-audit`, relative-link check and tracked-file secret-pattern scan. Actual results and limits live in `docs/evidence/` and `docs/release.md`. Hosted GitHub CI/publication/deployment are only marked verified after actual successful responses. External Google/model credentials remain the owner's next step, documented in MANUAL_SETUP_ACTIONS.md.
