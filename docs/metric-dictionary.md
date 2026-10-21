# ! — metric dictionary

| Metric | Grain and denominator | Caveat |
|---|---|---|
| Eligible sessions | Distinct `user_pseudo_id:ga_session_id` with session_start in selected UTC window | Not people. Missing identifiers excluded. No cross-device stitching. |
| Product views / cart / checkout / purchase | Sessions reaching each step in timestamp order after session_start | Closed funnel, not independent event counts. Ties allowed. Repeat stages count once. |
| Session conversion | Ordered purchasing sessions / eligible sessions × 100 | Not transaction count / users. Descriptive only. |
| Checkout completion | Ordered purchasing sessions / ordered checkout sessions × 100 | Undefined when denominator is zero; undefined ratio metrics are omitted and no-evidence advice abstains. |
| Revenue | USD purchase revenue, one row per transaction ID, joined to eligible sessions | Separate from ordered funnel count. No spend, CPA or ROAS. If any scoped purchase has missing revenue, omit the total and abstain from monetary advice; unknown is not zero. Duplicate transaction values use MAX and require review if conflicting. |
| Source conversion | Ordered purchasing sessions / eligible sessions within each source group | Fixture: session source is explicit. Public GA4: `traffic_source` is first-user acquisition metadata, not a reconstructed session-touch attribution model. |
| Funnel proportional loss | (Prior step minus current step) / prior-step entrants × 100 | Undefined for no entrants; severity differs from absolute volume. |
| Diagnostic priority | Absolute loss × conditional loss fraction | Investigation heuristic only, not expected recovered sessions or revenue. |
| Funnel loss | Previous ordered step sessions minus current step sessions | Largest absolute loss locates a hypothesis, not its cause. |
| Quality counters | Entire loaded source, independent of active reporting filters | Missing ID and negative value counts overlap. Invalid total counts distinct excluded rows. |

Dates are inclusive. SQLite and the browser use UTC calendar days, not GA4 property-local event_date. Boundary sessions are truncated to events extracted in the window; do not compare to GA4 UI without reconciling timezone, identity, attribution and scope. The public demo is entirely invented fixture data, even though dates overlap Google's public historical dataset.
