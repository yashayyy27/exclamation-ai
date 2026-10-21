# ! — next iteration PRD

Problem: a reviewer can inspect the fixture pipeline but cannot yet verify genuine collection-to-warehouse-to-model behavior in the owner's environment.

Outcome: one explicitly scoped, independently reviewable first-party demo cohort with verified analytics collection and a held-out model evaluation. No business uplift claim.

Scope, in order:
1. Owner configures test GTM/GA4 and BigQuery Sandbox/ADC with least privilege; validate consent and eight events in Tag Assistant/DebugView.
2. Reconcile warehouse event and transaction counts against the test property, preserving source separation and timezone policy. Detect conflicting transaction revenue and schema drift.
3. Run a small owner-approved model evaluation using configured model and a fixed cost budget. Add paraphrased holdout questions independent of the 36 development cases.
4. Persist approval/audit records with user identity and resource-scoped authorization before any team workflow.

Acceptance: actual redacted tracking screenshots; a cost-capped BigQuery job ID; reconciled known test transactions; zero supported claims with altered values or lineage; all unsupported spend/causal questions abstain; separate fixture/live model reports with measured tokens/latency, cost unknown unless pricing is verified; reviewed export tied to a durable immutable evidence version.

Risks: API spend, GA4 lag, obfuscated public data, timezone/identity differences, rule-based over-refusal, prompt injection through source labels, public endpoint abuse. Roll back to labelled fixture mode on integration failure, never silently merge/fallback data.

Expected benefit: stronger evidence that the workflow can be trusted with a real test source. Commercial impact remains a future experimental question, not a promised result.
