# ! — quality assurance

## Reproduce local verification

Use Node 24 and Python 3.12+. Install locked dependencies, then run `make check`, `make eval` and `npm run test:e2e`. See README for exact setup. Browser tests launch/reuse Vite and test desktop and mobile Chromium. They capture real screenshots and download the six-slide PDF from Client Room after explicit review.

Coverage:
- SQL ground truth: 420 sessions, 336 ordered views, 192 cart sessions, 139 checkouts, 63 purchases. USD 5,040 deduplicated transaction revenue and 15% ordered conversion.
- Data-quality exclusion, event and transaction deduplication, event order, filter reconciliation, date/SQL-injection boundaries and snapshot parity.
- Exact evidence values/units/dates/query/source IDs; mismatched provider output retries then returns REVIEW_REQUIRED; empty evidence abstains.
- BigQuery dry-run and hard budget, parameter values and complete-row-limit rejection via mocked SDK. No live SQL execution claimed.
- Responses API function-call and strict JSON-schema protocol with a mocked SDK; no live model test claimed.
- Store product/list/cart/checkout, removal, consent gate, no delivery before opt-in, unique repeated transaction IDs, local event payload schema.
- Every page navigation, responsive overflow, axe WCAG A/AA automated scans, supported answer and unsupported ROAS, baseline failure details, editable recommendation, review reset and PDF/Markdown downloads.

Visual checklist: actual desktop/mobile screenshots; no clipped charts; source/period/currency near analytics results; selected filters change aggregates; charts expose denominator; focus visible; dialogs contain focus and close on Escape; reduced motion honored; exports show source and limitations on every page. Automated checks cannot replace a human screen-reader review.

## External integration record

| Check | Status | Required evidence |
|---|---|---|
| GTM no request before grant / no ecommerce delivery after revoke | NOT YET VERIFIED externally | Network log and redacted Tag Assistant screenshot |
| GA4 receives eight correct ecommerce/page events once | NOT YET VERIFIED | DebugView screenshot and payload inspection |
| BigQuery real public extraction and UTC reconciliation | NOT YET VERIFIED | Job ID, byte estimate, actual row coverage and metric reconciliation |
| OpenAI live semantic/tool/evidence quality | NOT YET VERIFIED | Separate live report, model ID, per-case outcomes, token/latency record |
| Owner first-party GA4 export | NOT CONFIGURED | Separate dataset, scope and consent verification |

Never substitute generated screenshots or a mocked SDK test for any external evidence above.
