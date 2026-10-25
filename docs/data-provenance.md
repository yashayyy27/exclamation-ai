# ! — source provenance

## SYNTHETIC / ILLUSTRATIVE (`synthetic_fixture_v1`)

`scripts/generate_fixture.py` creates 1,153 raw event records deterministically. It invents 420 session identities across 1–14 January 2021 in UTC. These are not actual people, Google results, client traffic, conversions or revenue. Two duplicate records and one invalid record deliberately exercise quality checks. The invalid record has both negative revenue and missing identifiers. No ad-spend table exists.

`data/fixtures/events.json` → `services/api/analytics.py` → three SQL transformations → `scripts/build_snapshot.py` → 12 scoped browser snapshots. Every result carries source, dates, currency, timezone and query ID. Refresh changes require rebuilding snapshots and rerunning tests. `generated_at` identifies fixture assembly date, not live data freshness. Audit timing in a snapshot is the Python build-time measurement, not browser or model latency.

## FIRST-PARTY DEMO EVENTS (`first_party_demo`)

The storefront produces local in-memory QA events. It clears ecommerce state before delivery, uses random `demo-` transaction IDs, collects no checkout PII and never accepts payments. Consent is necessary for dataLayer delivery. GTM is optional and absent from the deployed fixture demo. QA event downloads remain a separate source and never enter the historical dashboard. Reloading loses the local event trail.

## GOOGLE PUBLIC / HISTORICAL (`google_public_historical`)

The fixed BigQuery table is `bigquery-public-data.ga4_obfuscated_sample_ecommerce.events_*`. Google's documented range is 2020-11-01 through 2021-01-31. It is obfuscated, contains placeholders and has limited internal consistency. On 25 October 2026, three authenticated **unbilled Console** jobs verified one UTC day (1 January 2021), including the complete 22,096-event extraction, independent aggregation and adjacent-partition date audit. All nine local SQLite aggregates matched. See the [actual analysis and receipts](bigquery-analysis-2026-10-25.md). Raw identities are not committed. The interactive dashboard/client PDF remain synthetic. Owner project/ADC are required for the separate SDK path: live SDK authentication/transport is NOT YET VERIFIED. SDK cost guards and query protocol still have mocked tests only.

The adapter uses UTC timestamps and purchase_revenue_in_usd, scopes wildcard suffixes with parameters, performs a dry run, caps billing at at most 1 GB, times out, and refuses >200,000 rows. Narrow the date range rather than accepting a partial sample. Fingerprint deduplication can collapse indistinguishable legitimate repeated events. This limitation needs reconciliation against live export semantics. `traffic_source` is acquisition metadata; public channel comparisons must not be called session-level attribution.

[Google's dataset documentation](https://developers.google.com/analytics/bigquery/web-ecommerce-demo-dataset) supports the historical range, access requirements and consistency limitations. The linked one-day historical analysis is separate from the synthetic dashboard and from owner first-party collection. It cannot be compared with Google's Analytics demo account, whose data differs.
