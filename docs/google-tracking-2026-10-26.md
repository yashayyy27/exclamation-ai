# Genuine GA4 / GTM preview verification

**VERIFIED: authenticated local Preview → GA4 DebugView.** On 26 October 2026 (Sydney), the owner test property received all eight specified ecommerce event types from the existing Measurement Lab. These are genuine collection events about an imaginary store, not customer transactions, production adoption or marketing outcomes. The public Pages build still has no GTM ID and sends no demo analytics.

## Actual owner resources

| Resource | Name | Actual non-secret ID | Find it again |
|---|---|---|---|
| Cloud project | Exclamation AI Portfolio | `exclamation-ai-yh-20261025` | Cloud Console → project selector / IAM & Admin → Settings |
| GTM web container | Exclamation AI Demo | `GTM-PFQ2M7ZG` | Tag Manager → Admin → Container Settings |
| GA4 property | Exclamation AI Analytics | `560653438` | Analytics → Admin → Property details |
| GA4 web stream | Exclamation AI Demo | `16197776847` | Admin → Data streams → web stream |
| GA4 measurement | Exclamation AI Demo | `G-E1MF7870B8` | The same stream's Measurement ID |

The owner personally completed account/terms steps. Existing resources were reused, not duplicated. The Cloud project has no linked billing account; no trial/billing activation occurred. Property currency is USD, reporting timezone Australia/Sydney, enhanced measurement off. That timezone differs from the separate historical public analysis's UTC scope.

## Inspect the evidence

- [Dated receipt with code hashes, observed counts, payload fields and limits](evidence/ga4-gtm-preview-20261026.json).
- [Actual native GTM workspace export](evidence/gtm-owner-workspace-20261026.json), downloaded after import/configuration and checked against the tested workspace. It is not an invented container recipe. The two tags require analytics consent; the event trigger matches only the eight names and `source_id=first_party_demo`. Automatic optional event detection and user-provided-data detection are disabled.
- [GA4 DebugView screenshot](screenshots/ga4-debugview-20261026.jpg), [two received purchases](screenshots/ga4-two-purchases-20261026.jpg), [first transaction identity](screenshots/ga4-purchase-transaction-20261026.jpg), [second transaction identity](screenshots/ga4-second-transaction-20261026.jpg).
- [Purchase tag succeeded](screenshots/gtm-purchase-tag-20261026.jpg), [actual campaign request fields](screenshots/gtm-campaign-hit-20261026.jpg), [consent revoked](screenshots/gtm-consent-revoked-20261026.jpg). Campaign screenshot is a direct crop of the actual browser screenshot, excluding the client identifier.

The first walk-through received: page_view 1, view_item_list 1, select_item 1, view_item 1, add_to_cart 2, remove_from_cart 1, begin_checkout 1, purchase 1. GA4 additionally emitted first_visit, session_start and user_engagement. The native base tag did not produce a duplicate page_view: one explicit page_view arrived per page load.

Two purchases arrived under distinct IDs:

1. `demo-fe1d1f4d-001b-482f-88f6-c817c7a0cef9`
2. `demo-553bbc01-71d0-4816-8513-079369c09feb`

Each actual collect hit carried value 24, currency USD, one `object-01` / Signal notebook at price 24, quantity 1, `source_id=first_party_demo` and debug mode. GA4 confirmed transaction IDs, currency, value and source. The second request also carried campaign source `portfolio`, medium `qa`, name `owner_verification`; this is instrumentation QA, not an attribution finding. Final DebugView totals were 18 events including two purchases. A revoked-consent cart click increased local QA from 9 to 10 while the GTM ecommerce execution count stayed 9, with Consent Update remaining the newest GTM event. Consent was left revoked after testing.

## A real failure found and repaired

Returning visitors with saved consent could queue the initial storefront events before the root component's passive effect restored the consent commands. The added desktop/mobile regression failed on the original implementation: consent default appeared at queue index 3, after page_view at index 0. Moving saved-consent restoration to a root layout effect made the same regression pass on both viewports. This establishes ordering before child event effects, rather than relying on a delayed Google script to hide a race. See [the fix](../apps/web/src/main.tsx) and [browser regression](../tests/browser/app.spec.ts).

## Reproduce safely

Keep `VITE_GTM_ID=GTM-PFQ2M7ZG` only in ignored `apps/web/.env.local`. Start Vite on a local port, then GTM → Workspace → Preview → enter that local URL with `#Measurement%20Lab`. Both windows must remain open. The first visit intentionally blocks Google scripts until Allow analytics; reload after opting in to test the initial page/list events with saved consent. Drive view → add → remove → add → checkout → purchase. Check Tag Assistant Hits Sent and GA4 Admin → Data display → DebugView. Repeat once for unique transaction identity, then revoke consent.

For automated checks, override `VITE_GTM_ID=` so test clicks cannot pollute the owner property. No Google credentials or Measurement Protocol secret belong in the frontend. The current published GTM version is still **1 / Empty Container**; verification used unpublished workspace 2 in Preview. No public tracking rollout is implied.

## Precise remaining limits

- No raw browser network log or HTTP response-status receipt was captured. Tag Assistant's actual collect parameters and independent GA4 ingestion were observed; HTTP 204 is not claimed.
- DebugView's item panel displayed raw price `24000000`, while the actual transmitted item was `pr24` and event value was 24 USD. [The actual item screenshot](screenshots/ga4-purchase-item-20261026.jpg) preserves this discrepancy. Do not treat that display as dollar revenue; export-level price/unit reconciliation remains outstanding.
- No GA4 reporting API, first-party BigQuery export, public visitor tracking, production consent certification or server SDK authentication is verified by this test.
- The historical public BigQuery analysis is a separate [genuine receipt](bigquery-analysis-2026-10-25.md). Its sessions, revenue and UTC date must never be joined to these local demo clicks as though they were one dataset.

Daily GA4 → BigQuery export may use the unbilled sandbox within Google's limits. Streaming and Fresh Daily are excluded. A link creates a Google export resource identity and grants BigQuery project access, so owner confirmation is required at that final step. Actual export delivery must be checked separately after creation; current-day DebugView arrival does not prove a daily table exists. [Google export setup and sandbox guidance](https://support.google.com/analytics/answer/9823238?hl=en).

## Daily export link created with owner confirmation

The owner explicitly approved the final access grant, and Google displayed **LINK CREATED** on 26 October. Link ID: `F0mQFps2QVehkk3nA37JCQ`. The persisted detail view confirms the actual project, US location, one selected stream, daily event export on, streaming off, advertising identifiers off and user-data export off. [Saved project/link evidence](screenshots/ga4-bigquery-linked-20261026.jpg), [saved frequency evidence](screenshots/ga4-bigquery-daily-only-20261026.jpg). These are direct browser captures cropped to omit the owner's email. The exact export identity's IAM membership has not yet been independently inspected. [Cloud billing rechecked after creation](screenshots/cloud-still-unbilled-20261026.jpg): still no billing account linked.

**First-party export delivery remains NOT YET VERIFIED.** After the first daily delivery, inspect the actual `analytics_560653438` dataset and generated dated table, dry-run a fixed aggregate query, reconcile event names, USD values and transaction IDs, and record the actual job/bytes/results. Do not assume a dataset/table exists or that DebugView totals equal export totals. Google's documentation describes delivery starting within 24 hours and daily files for the preceding reporting day; late arrivals and the Sydney timezone require explicit reconciliation.
