# Recruitment audit — 22 October 2026

Baseline inspected: `ba5a2738339fa939002bef9a43cbd6e76d207677`. This is a review of an existing product, not independent certification or evidence of client use. Published CI/Pages runs and committed reports were inspected; fresh local checks are recorded in the upgrade verification report.

| Priority | Finding at baseline | Consequence | Resolution / evidence |
|---|---|---|---|
| P0 | OpenAI receives no user question and is forced to call one preselected tool (`agent.py`) | Tool-selection score is a router score; injection tests do not establish model resistance | Add a separate model-choice evaluation path and disclose legacy scope |
| P0 | Evidence validator checks membership, length and serialized uniqueness, not one-to-one metric identity | Two slightly different copies of one number can replace another metric | Reject duplicate identities and require full identity-set equality; adversarial regression |
| P1 | Period comparison selects metrics by array index | Empty periods can mislabel revenue as conversion | Select by metric name and abstain on undefined ratios |
| P1 | Query IDs omit input-content and SQL hashes | Different inputs can share lineage IDs | Fingerprint source records and transformations |
| P1 | BigQuery quality scope claims the entire public dataset even for a narrow extract | Dates overstate inspected coverage | Separate dataset availability from actual extraction bounds |
| P1 | Ordered stage lookups repeatedly scan events; raising the extract cap needs indexing | A larger public extract could become impractically slow locally | Add a covering session/name/time index and verify a 27,672-record synthetic replication |
| P1 | BigQuery receipt omits billed bytes, cache status, reconciliation | SDK mock tests cannot establish real extraction or costs | Owner-only verification command, independent aggregate reconciliation and explicit byte budget |
| P1 | Live integrations require access token but no explicit spend switch | A configured server can incur unapproved costs | Require separate owner paid-call opt-in; default disabled |
| P1 | Evaluation schema grade is hardcoded; some numerical grades default true; same functions grade their own evidence | 36/36 cannot be interpreted as model quality | Remove automatic grades, add independent oracle and immutable, hashed held-out run records |
| P1 | No real OpenAI, BigQuery, GA4 receipt or Tag Assistant evidence | Four competencies are incompletely demonstrated | Keep NOT YET VERIFIED / BLOCKED until owner authentication and approved runs |
| P1 | Largest absolute loss is the only funnel priority; no spend or journeys; one campaign | No defensible budget or attribution recommendation | Show proportional loss, transparent prioritisation, campaign grain and separate synthetic journey comparison |
| P1 | Six PDF slides repeat a text layout, lack charts and competing explanations | Weak client decision narrative | Preserve identity; redesign evidence charts, hypotheses and experiment decision rule |
| P2 | GTM queues an update before its default consent command | Initialization order is harder to reason about | Queue denied default once before any update; test consent order |
| P2 | Empty/placeholder transaction IDs and malformed nested fields are insufficiently guarded | Invalid purchases or SQLite binding errors | Quarantine malformed dimensions; normalize invalid IDs and flag conflicts |
| P2 | Local review checkbox is not signed approval; API rate limit is single-process memory | Not production multi-tenant governance | Explicit deployment limits; no enterprise-readiness claim |

## What works

Raw synthetic events → deduplication → ordered session funnel → scoped snapshots → evidence cards → editable client recommendation → gated Markdown/PDF export. Baseline counts reconcile: 420 sessions, 63 ordered purchasing sessions, 15% conversion and USD 5,040 transaction revenue. Browser fixture mode makes zero model calls. API access controls, date/channel validation, byte-cap and row-cap rejection, constrained answer enums and evidence gates are implemented and tested. These controls are useful engineering evidence, not proof of real vendor delivery.

## What is deterministic or mocked

All public dashboard data and answers are deterministic synthetic fixtures. v1/v2 compares policy, not learned model behaviour. BigQuery and Responses protocol unit tests use fake SDK clients. Deliberate provider failure is a mock. No real attribution or experiment has run. The public Google dataset is historical and obfuscated; it has not yet been extracted by this project.

## Owner-dependent verification

No OpenAI key/model, owner Google project/ADC, or owner GTM/GA4 test property is available in the current shell. No paid calls were authorized or made. Real costs, semantic model quality, Google delivery and dataset reconciliation remain unverified. Runbooks must produce dated receipts, job/model identifiers and failures without storing credentials or raw identities. The small author-written holdout is a release gate, not an external benchmark; once inspected for tuning it becomes development material.

## Limits of this audit

Source, tests, CI configuration and saved outputs can establish reproducibility. They cannot establish client adoption, applicant understanding, security certification, causal impact, or paid integration success. No such claims are made. Single-process API limits and local approval are suitable for a portfolio/local owner service; an internet-facing multi-tenant deployment needs durable quotas, identity, retention and approval storage.
