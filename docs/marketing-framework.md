# Marketing intelligence and decision logic

Business question: where should a team investigate conversion friction before investing? Objective: improve ordered purchase-session conversion without harming revenue per session or checkout reliability. No business outcome is claimed.

| KPI | Definition / use | What is unavailable |
|---|---|---|
| Eligible sessions | Distinct valid user/session keys with session_start in scope | People and cross-device identity |
| Ordered conversion | Sessions completing every ordered stage / eligible sessions | Incrementality and a causal effect |
| Checkout completion | Ordered purchasing sessions / ordered checkout sessions | Payment failure reasons |
| Transaction revenue | USD, once per valid transaction ID, attached to an eligible session | Profit, refunds/returns and matched spend |
| Channel/campaign conversion | Same session denominator within declared acquisition group | Session-touch attribution for public GA4; campaign lift from one fixture campaign |
| Guardrail revenue/session | Scoped transaction revenue / eligible sessions, if both are verified | Reliable guardrail without complete monetary data |
| Funnel absolute loss | Prior stage sessions minus next stage sessions | Recoverable customers |
| Funnel proportional loss | Lost sessions / prior stage entrants | Root cause |

Fixture diagnosis: 336 views → 192 cart sessions loses 144 (42.86%). Checkout → purchase loses 76/139 (54.68%). Rank diagnostic work by **lost sessions × conditional loss fraction**: product/cart 61.71, checkout/purchase 41.55, session/view 16.8, cart/checkout 14.63. The score is a transparent heuristic, not a forecast or currency. Confidence, effort and commercial value are not fabricated. First gate is measurement QA. An owner must add implementation cost and value before using this to allocate resources.

Channel/campaign table uses explicit grains and reconciles back to the scoped totals. Wilson 95% intervals describe binomial uncertainty under independent-session assumptions; they do not correct confounding, clustering or multiple comparisons. There is only one fixture campaign. All spend/ROAS fields are null. Do not rank investment by conversion alone.

A separate, opt-in **three-journey synthetic example** compares first, last and linear credit in an invented complete seven-day same-device window. Each rule allocates exactly USD 150. It is never joined to the dashboard. The difference demonstrates attribution-model sensitivity, not an empirically preferred model or incremental channel contribution. Real attribution remains unavailable without observed sequences, identity policy, a lookback window, conversion IDs and channel/spend reconciliation.

Competing explanations: product relevance (needs research), interaction friction (needs usability/error/device evidence), and instrumentation loss (needs tag delivery and transaction reconciliation). Current stage counts cannot distinguish these. One recommendation: validate the product-to-cart transition, collect diagnostic evidence, then test one proposition if supported. Defer channel budget changes.

Experiment: baseline 15%, 10% relative MDE = 1.5 percentage points; equal arms, two-sided alpha .05, 80% power. The existing approximate normal two-proportion calculator gives 8,896 independent sessions per arm. It uses baseline variance, not an exact power solver. Randomize by stable consenting visitor; repeated sessions need a design-effect adjustment. Agree sample size, duration in whole weeks, lag, eligibility, owner and guardrail thresholds before launch. No peeking or unplanned multiple testing.

Proposed decision: ship only if the 95% effect interval is positive, the point estimate meets the predeclared MDE and guardrails pass; otherwise retain control or report inconclusive. Pause for broken delivery, sample-ratio mismatch, checkout errors or material revenue/session deterioration. Thresholds require owner judgment; no experiment or uplift has been observed.
