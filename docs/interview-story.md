# ! — interview talking points

This is an independent skills portfolio, not an R/GA engagement. Codex generated and revised the implementation. Automated tests and browser QA are recorded; the applicant's own review and explanation are still essential. Do not present agent verification as personal past client experience.

## Architecture choices

React/TypeScript provides a portable static demo. FastAPI/Pydantic keeps analysis typed and separates credentials from the browser. SQLite exercises real read-only SQL without cloud prerequisites. A bounded BigQuery adapter translates a fixed public export into the same models. Fixed tools and a constrained Responses schema keep free-form generated SQL and unsupported numeric prose out of the pipeline. Exact lineage validation is stronger than asking a model to be accurate.

## A real failure and its repair

The v1 deterministic router treated “Calculate ROAS by channel” as a channel request. It could return perfectly correct descriptive numbers while answering a business question the data cannot support. V2 adds unsupported-claim guards before tools. Actual fixture results improve from 21/36 to 36/36. Prompt files v1/v2 are committed, but no causal claim about prompt quality or live model behavior is warranted. The eval harness has hardcoded KPI ground truth plus source, schema, tool, abstention and numerical grades. A deliberate API-failure case verifies graceful REVIEW_REQUIRED without pretending to call a provider.

## Reliability trade-offs

- The browser fixture analyst is deterministic. It is useful for pipeline inspection and reproducing evidence, not proof of semantic model quality.
- Natural-language dates are deliberately restricted. Filters provide explicit windows. Ambiguous dates abstain.
- The model cannot author arbitrary prose numbers. It selects constrained finding/action types and copies exact evidence objects. Server-controlled text renders the result. This gives up expressive freedom for verifiability.
- Source grouping is descriptive and cannot justify attribution or budget claims. Missing multi-touch data produces insufficient evidence.
- Static hosting exposes no paid API endpoint. Optional paid/local API operation requires configured server access token, narrow CORS, rate limits, hard query budgets, timeouts and a configured model.

## What production would require

Separate tenant authorization, durable audit/approval records, robust ingress limits, consent-management integration, event deduplication reconciliation, schema evolution, complete extraction semantics, observed-traffic validation, holdout evaluation, monitoring of refusals and human escalation, currency/timezone policy and managed secret rotation. None is claimed as already production-deployed.

Next interview discussion: show `docs/next-iteration-prd.md`, explain the highest-risk integration assumption, and identify the evidence that would change the recommendation.
