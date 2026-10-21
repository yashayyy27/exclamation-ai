> Original release record. The recruitment upgrade has its own [verification report](verification.md) and [readiness matrix](rga-role-evidence-matrix.md).

# ! — verified release evidence

- Public code: https://github.com/yashayyy27/exclamation-ai
- Branch: `main`
- Working demo: https://yashayyy27.github.io/exclamation-ai/
- Test-verified code snapshot: `8faecaae7c6b658176439b27743f13ecafae5dbf`. Subsequent release documentation does not alter the tested application behavior. Use `git rev-parse HEAD` for the exact checkout/documentation head.
- Initial hosted CI: [run 39602228450](https://github.com/yashayyy27/exclamation-ai/actions/runs/39602228450), all steps successful, including lint/types/Python tests/browser unit tests/build/eval/audit/desktop-mobile browser tests.
- Initial Pages deployment: [run 39602228528](https://github.com/yashayyy27/exclamation-ai/actions/runs/39602228528), `build` and `deploy` jobs successful. That initial deployment used commit `459b589941cee989f1768bccfb1eac026e9376e5`. Subsequent code/documentation pushes rerun both workflows.
- Latest status: [verification workflow](https://github.com/yashayyy27/exclamation-ai/actions/workflows/ci.yml), [Pages workflow](https://github.com/yashayyy27/exclamation-ai/actions/workflows/deploy.yml).

Observed on 21 October 2026: GitHub Pages Overview rendered the correctly labelled fixture metrics. Evaluation Studio loaded its recorded JSON under `/exclamation-ai/` and displayed v2 36/36 and v1 21/36 with live model evidence marked UNVERIFIED. The public repository owner and visibility were independently confirmed through the GitHub connector. No GitHub CLI authentication was invented; the existing Git credential helper completed the verified push.

Local commands and actual outputs: `make check` (27 Python tests, 47 browser unit tests, Ruff, mypy, ESLint, TypeScript and Vite), `make eval` (36 curated cases per version), `npm run test:e2e` (10 desktop/mobile tests, including seven-page axe scans), `npm audit` (0 vulnerabilities), Python `pip-audit` (no known vulnerabilities), relative-link check and secret-pattern/forbidden-file scan. Logs are in `docs/evidence/`; a TestClient deprecation warning remains visible. Rendering and visual inspection verified all six draft PDF pages.

Publication boundaries: GitHub Pages serves only the complete static synthetic demo. Python/BigQuery/OpenAI services are optional local integrations and are not publicly deployed. No Google/model secret was configured or committed. No real LLM call, live BigQuery job, GTM/GA4 receipt, observed client performance or causal uplift is claimed.

Owner actions: configure and verify real integrations via `MANUAL_SETUP_ACTIONS.md`, independently reproduce/explain the code and review any client deliverable. The PDF committed to the repository remains DRAFT / NOT REVIEWED. No paid cloud resource or custom domain was provisioned.
