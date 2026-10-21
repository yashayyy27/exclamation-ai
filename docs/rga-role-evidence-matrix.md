# ! — R/GA role evidence matrix

Independent skills portfolio. Code and automated verification demonstrate capabilities; external production use, clients and business outcomes are not claimed. The [demo script](demo-script.md) supplies exact walkthrough moments.

| Competency / expectation | Running feature | Concrete source / test | Demo moment / limit |
|---|---|---|---|
| Useful AI; failed prompts and debugging | Ask ! and Evaluation Studio | [Agent](../services/api/agent.py), [prompts](../services/api/prompts/v2.txt), [actual run](../evals/runs/fixture-latest.json), [evaluation report](evaluation-report.md) | 0:55–1:55. Fixture 36/36, baseline 21/36. Live model / prompt effect NOT YET VERIFIED. |
| Python and SQL | Ordered funnel and source-aware aggregates | [Analytics](../services/api/analytics.py), [session SQL](../data/sql/sessions.sql), [tests](../tests/test_pipeline.py) | 0:00–0:25. Show closed funnel and filter reconciliation. |
| GA4 / GTM implementation and QA | Product/cart/checkout + local event trail | [Event contract](../apps/web/src/measurement.ts), [browser tests](../tests/browser/app.spec.ts), [GTM guide](gtm-setup.md) | 0:25–0:55. External DebugView NOT YET VERIFIED. |
| BigQuery pipeline and cost control | Data Sources; optional local API | [SDK adapter](../services/api/bigquery.py), [fixed SQL](../data/sql/bigquery_events.sql), [setup](MANUAL_SETUP_ACTIONS.md) | 2:40–3:00. Mocked dry-run/budget tests pass; real project query NOT YET VERIFIED. |
| Business measurement / curiosity | Funnel diagnosis and experiment calculator | [Measurement plan](measurement-plan.md), [dictionary](metric-dictionary.md), [browser analytics](../apps/web/src/analytics.ts) | 0:00–0:25 and 1:55–2:25. Descriptive only. |
| End-to-end pipeline / automation | Raw fixture → SQL → scoped snapshot → validated answer → export | [Snapshot builder](../scripts/build_snapshot.py), [CI](../.github/workflows/ci.yml), [weekly fixture workflow](../.github/workflows/evaluate.yml) | Entire walkthrough. Hosted CI/scheduled execution only verified after actual GitHub run. |
| One clear recommendation | Priority signal and Client Room | [UI](../apps/web/src/main.tsx), [client narrative](client-story.md), [export code](../apps/web/src/export.ts) | 2:25–3:00. Test instrumentation before changing proposition. |
| Stakeholder narrative | Editable executive note and six-slide PDF | [PDF](deliverables/client-review.pdf), [story and Q&A](client-story.md), [demo](demo-script.md) | 2:25–3:00. No fabricated client or uplift. |
| Specifies next iteration | Credential verification / holdout evaluation PRD | [Next PRD](next-iteration-prd.md) | 2:45–3:00. Scoped outcomes and acceptance. |
| Make Things Happen | Working offline app, tests, release evidence | [README](../README.md), [implementation status](../IMPLEMENTATION_STATUS.md), [release record](release.md) | Open demo, inspect actual checks. Publication state comes from release record. |
| Make Things Together | Reproducible setup and human review | [AGENTS](../AGENTS.md), [owner setup](MANUAL_SETUP_ACTIONS.md), [QA](qa-guide.md) | Edit recommendation, review, export; editing resets review. |
| Make Things New | Evidence validation plus bounded model authoring | [Pydantic schema](../services/api/models.py), [validator tests](../tests/test_pipeline.py), [architecture](architecture.md) | 0:55–1:25. Model cannot run arbitrary SQL or author unverified numeric prose. |
| Make Things Matter | Honest attribution and decision/test linkage | [Client story](client-story.md), [metric dictionary](metric-dictionary.md), [next PRD](next-iteration-prd.md) | 1:55–3:00. Actual commercial impact NOT YET VERIFIED. |

Power BI is not used or claimed. The brief prioritizes a reproducible Python/SQL/web analytics and LLM pipeline; a future BI handoff can consume the documented aggregates.
