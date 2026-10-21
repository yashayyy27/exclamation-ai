# ! — measurement plan

Business objective: evaluate friction between product discovery and an ordered purchase, then test a specific experience hypothesis. The Demo Store is an instrumented sandbox, not a trading business.

| Objective / KPI | Event | Contract | QA / expected action |
|---|---|---|---|
| Reach / page context | page_view | safe page_path, demo source, debug flag, campaign allowlist | Exactly one explicit page view on sandbox entry. Disable automatic GA4 page views. |
| Discovery / list exposure | view_item_list | items with item_id, item_name, price, quantity; USD/value | Enter store; compare list payload to catalog. |
| Product selection | select_item | selected item in items | Open a product; only that product is selected. |
| Consideration / detail | view_item | selected item, USD/value | Product dialog opens and emits detail event. |
| Intent / cart sessions | add_to_cart | added quantity, not entire cart | Add twice; each event adds one item. |
| Cart correction | remove_from_cart | removed quantity | Remove one; quantity cannot become negative. |
| Checkout progress | begin_checkout | current cart, summed value | Empty cart cannot start checkout. |
| Demo completion / conversion | purchase | current items, USD/value, unique demo transaction_id | Complete twice; two different transaction IDs. No actual payment. |

All events carry `source_id=first_party_demo`, `debug_mode=true`, session-scoped allowlisted UTM tags. Currency and value must agree with item totals. Local QA works without consent; nonessential delivery and GTM loading require explicit analytics consent. Advertising storage, user data and personalization stay denied. Campaign values allow only short alphanumeric/dash/underscore strings. Do not place personal data in campaign names.

Metric tree: discovery → product engagement → cart intent → checkout → ordered purchase. Primary experiment metric is purchase-session conversion. Guardrails: revenue per eligible session and checkout errors. Do not optimize a stage metric by harming final conversion. Historical fixture and in-browser events are separate sources.

Privacy limitations: this consent control is a basic portfolio mechanism, not a certified consent management platform or jurisdictional legal assessment. Consent persists locally; the QA trail does not. Revocation sends a denied consent update and prevents subsequent analytics events. An already loaded GTM container remains in the page; configure its tags to honor consent and verify behavior regionally. No server-side Measurement Protocol workaround is used.

Reference: [Google ecommerce implementation](https://developers.google.com/analytics/devguides/collection/ga4/ecommerce). Local automated contract verification is complete; external Tag Assistant and GA4 DebugView collection are NOT YET VERIFIED.
