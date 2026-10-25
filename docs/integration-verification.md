# Owner integration verification

Status: **VERIFIED** one public day through authenticated, unbilled BigQuery Console execution and complete local reconciliation; see [the actual analysis](bigquery-analysis-2026-10-25.md). **BLOCKED** for live OpenAI, SDK authentication and GA4/GTM receipt on the remaining owner setup/approval. Passing fake-SDK tests does not establish vendor success. No paid requests have been made during this upgrade.

## OpenAI: concrete run to approve

Configure server-only `OPENAI_API_KEY` and `OPENAI_MODEL` locally. Never use `VITE_` for these. The key needs Responses API access to the selected model. Use a restricted project key and review the owner's current pricing/usage limits. Set a small owner project budget; provider budgets may be alerts rather than hard stops.

Proposed command after approval:

```sh
.venv/bin/python evals/heldout.py --provider openai --allow-paid --max-requests 48
```

This runs 24 author-written release cases. At most 48 attempted Responses requests, no SDK automatic retry, maximum 800 output tokens for selection and 2,500 for authoring. Expected path: 42 requests (6 abstentions, 18 supported). Tokens are measured if returned; partial/unknown usage and dollar cost remain null. **The request cap is not a dollar cap.** Approve a model and maximum estimated spend using its current prices before execution. The harness does not assume a price or claim that an OpenAI account budget is a hard cap. Stop rather than execute if the owner requires a monetary hard cap the provider cannot enforce.

Model probes directly offer six registered tools plus abstention, bypassing the lexical router so safety-policy results cannot masquerade as model resistance. No arbitrary SQL or shell executes. Questions, aggregate metrics and deliberately malicious test text reach the model; raw event identities and credentials do not. Each result records choice, schema, independent numeric oracle, exact evidence gate, abstention and bounded recommendation rubric. A human recommendation rating is still required for commercial usefulness; it stays null until performed.

Immutable JSON includes model, code commit, dirty-tree flag, case/prompt/data hashes, timing, request count, usage completeness and per-case failures. `heldout-openai-latest.json` is only a convenience pointer. Publish an actual run and its failures only after reviewing for secrets. Do not turn a failed/partial run into success or combine mocked cases with live outcomes. The release set is small and author-written; it is not an independent benchmark. It has been inspected during deterministic testing, including an oracle adjudication; freeze fresh paraphrases before tuning live prompts against it.

## BigQuery: dry run before execution

Use an existing owner project with BigQuery API enabled and `roles/bigquery.jobUser`; the public table needs no private dataset access. Use Application Default Credentials (`gcloud auth application-default login` if Google Cloud CLI is installed), or an owner-managed credential file outside Git via `GOOGLE_APPLICATION_CREDENTIALS`. The CLI is not installed in the current build environment. Do not create billing accounts or download private datasets.

```sh
export GOOGLE_CLOUD_PROJECT=OWNER_PROJECT_ID
# Free query planning only; still requires authentication.
.venv/bin/python scripts/verify_bigquery.py --start 2021-01-01 --end 2021-01-01
# Only after approving both query estimates and the total byte ceiling:
.venv/bin/python scripts/verify_bigquery.py --start 2021-01-01 --end 2021-01-01 --maximum-bytes 1000000000 --execute --allow-paid
```

The total SDK execution ceiling is split equally between extraction and independent GoogleSQL aggregation. Each dry-run estimate must fit its half; unknown estimates fail closed. USD revenue uses `purchase_revenue_in_usd`; partition bounds and UTC timestamp dates are explicit. Complete extracts above 200,000 rows are rejected, never sampled. One actual public day is now verified through the Console (22,096 rows); this does not verify SDK authentication, transport or budget enforcement. Other windows remain untested.

An unbilled sandbox offers a separate no-charge Console workflow. On 25 October it produced genuine extraction, aggregation and UTC boundary receipts. The [offline export reconciler](../scripts/reconcile_bigquery_export.py) reproduces all nine comparisons without network access; it cannot itself authenticate Google or prove file origin. Inspect the [job evidence and reproduction procedure](bigquery-analysis-2026-10-25.md) before treating a supplied export as genuine. Do not use this workflow to bypass approval for queries on a billed project.

The receipt records dry/actual bytes, cache state, job IDs, hashes and count/revenue reconciliation between GoogleSQL and local SQLite. Check raw/clean counts, five funnel stages, transactions and available revenue. Missing revenue is excluded from monetary verification and flagged. A mismatch exits nonzero. Billed bytes are not a dollar bill: pricing/free quota/slot mode determine actual cost. No GA4 UI parity is claimed: reconcile property timezone, obfuscation, first-user acquisition source, event deduplication and boundary-session truncation first. Narrow the window if the byte or complete-row cap fails.

Public dataset scope and limitations: [Google GA4 sample documentation](https://developers.google.com/analytics/bigquery/web-ecommerce-demo-dataset). Tool protocol: [OpenAI function calling](https://developers.openai.com/api/docs/guides/function-calling), [structured outputs](https://developers.openai.com/api/docs/guides/structured-outputs).

## GTM / GA4: delivery receipt, not just dataLayer

Use an owner test container/property. Put only the public container ID in `apps/web/.env.local`, then restart Vite. Follow [the exact tag mapping](gtm-setup.md); no Google secret is needed in the browser. Do not publish a container into production for this test.

1. Record UTC timestamp, test URL/build commit, browser, container ID/version and test measurement ID. Use Tag Assistant Preview on the local test build.
2. Before opt-in: preserve the network log; prove no GTM or GA4 ecommerce delivery. Local QA events must still appear.
3. Opt in: verify denied consent default precedes granted analytics update, while all advertising consent remains denied.
4. Drive list → product → cart add/remove → checkout → purchase. Verify each custom event fires exactly one GA4 tag. Inspect items, USD value, debug_mode and `source_id=first_party_demo`.
5. Capture actual `/g/collect` request parameters and response for each event. Redact client/session identifiers. A 204 response proves transport acceptance, not report ingestion.
6. Match all eight event types in the owner's GA4 DebugView, including a unique `demo-` transaction ID and value. Save genuine Tag Assistant/DebugView captures locally, redact, and label them with date/build. Never synthesize screenshots.
7. Repeat purchase: distinct transaction IDs. Revoke consent: subsequent ecommerce clicks produce no collection requests. Inspect automatic page_view/enhanced-measurement duplication.
8. Record pass/fail and any discrepancies in a dated JSON/Markdown receipt under `docs/evidence/`. Missing DebugView or consent evidence leaves status NOT YET VERIFIED. External evidence is absent today.

The public Pages demo remains fixture-only until owner configuration is explicitly supplied. No production tracking data is mixed into its historical dashboard.
