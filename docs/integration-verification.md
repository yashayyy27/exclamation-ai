# Owner integration verification

Status: **VERIFIED** one public day through authenticated, unbilled BigQuery Console execution and complete local reconciliation; see [the actual analysis](bigquery-analysis-2026-10-25.md). **VERIFIED** authenticated owner GA4/GTM local Preview delivery; see [actual tracking evidence](google-tracking-2026-10-26.md). **BLOCKED** for live OpenAI and SDK authentication on remaining owner setup/approval. Passing fake-SDK tests does not establish vendor success. No paid requests have been made during this upgrade.

## OpenAI: concrete run to approve

The owner selected **gpt-5.4-mini**, **USD 3 maximum cumulative API spend** and **48 attempted Responses generations**. Final paid-call confirmation is still required. No real model calls have been made.

Create a dedicated API project, restrict the key to the required Responses generation and input-token-count endpoints, and put it only in ignored owner-readable `.env.owner` (`chmod 600`). The runner reads only `OPENAI_API_KEY` and `OPENAI_MODEL` as data, never as shell code. It never prints their values. Keep the model `gpt-5.4-mini`; never prefix secrets with `VITE_`. The public site has no API credentials or paid endpoint.

Current OpenAI documentation offers project hard spend limits, with possible enforcement delay. Set USD 3 in Project settings → Limits → Spend → Edit spend limit, enable the hard limit, and save if the owner account supports it. A notification alone is insufficient. Do not purchase credits above the authorized amount. [Official spend limits](https://developers.openai.com/api/docs/guides/spend-limits).

**Do not execute until the owner confirms the concrete run:**

```sh
.venv/bin/python evals/heldout.py --provider openai --allow-paid --max-requests 48 --prices-reviewed-on 2026-10-26
```

The [local monetary controller](../evals/spend.py) fixes the standard vendor endpoint and default service tier, disables SDK retries, excludes hosted tools/media/background processing, counts the identical complete input before each generation, and reserves its maximum output charge in a durable SQLite ledger before transmission. The dated model rate card is USD 0.75 / 0.075 / 4.50 per million ordinary input / cached input / output tokens. It expires after one day to force another official-price review. [Actual model pricing](https://developers.openai.com/api/docs/models/gpt-5.4-mini), [official controller pattern](https://developers.openai.com/cookbook/articles/per_run_spending_controller_responses_api).

Each generation permits at most 16,000 input and 2,500 output tokens (800 output for selection). Even 48 maximum-sized generations reserve USD **1.116** at those rates, below the owner's USD 3 ceiling. Reasoning is explicitly `none`; reasoning tokens, if returned, are included in output accounting. Model requests keep the exact owner-approved alias; only that alias or its currently documented returned snapshot is accepted. No model fallback occurs. There are at most 48 additional token-count preflights for a fresh run; these are not model-generation calls.

The ignored `.openai/local-verification.sqlite3` ledger survives process restarts. Admission uses an atomic transaction; pending, interrupted, missing-usage, unexpected-model/tier or incomplete responses stop further requests and retain their reservation. Never delete the ledger to retry or start another spend authorization. Actual usage, raw synthetic-case model responses (including rejected answers) and token-price calculations are saved separately from invoice cost, which remains null. Inspect the ledger/report locally before publishing. This controller covers this evaluation's documented model-token charges; it is **not** a guarantee against taxes, account-specific surcharges, changed vendor pricing or unrelated API use. If those prevent a reliable USD 3 total cap for the owner's account, **do not run**. Owner authentication and confirmation remain gates, not presumed completed work.

The 24 author-written release cases expect 42 generations on the oracle path (6 abstentions, 18 supported selections plus authoring). Unexpected valid tool selection may change that count; the cumulative hard ceiling stays 48. Offline timeout/restart, oversize, wrong-model/tier, pending-reservation, dollar-admission and protocol tests are not model-quality results.

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
8. Record pass/fail and any discrepancies in a dated JSON/Markdown receipt under `docs/evidence/`. Missing DebugView or consent evidence leaves status NOT YET VERIFIED. External Preview/DebugView evidence is now recorded in [the dated receipt](google-tracking-2026-10-26.md); raw HTTP response-status evidence remains absent.

The public Pages demo remains fixture-only until owner configuration is explicitly supplied. No production tracking data is mixed into its historical dashboard.
