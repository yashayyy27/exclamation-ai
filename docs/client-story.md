# ! — client narrative

**Business question:** where should the team investigate experience friction before committing to an experiment?

**Evidence:** the committed synthetic fixture contains 420 eligible sessions and 63 ordered purchasing sessions, giving a 15% ordered session conversion rate. The largest absolute step loss is 144 sessions between 336 product-view sessions and 192 cart sessions. These numbers prove the pipeline's calculation, not a real commercial opportunity.

**One recommendation:** audit product-to-cart instrumentation, then test a clearer product proposition. Avoid reallocating channel budget from these descriptive conversion rates: no matched spend or causal evidence exists.

**Test:** randomize eligible sessions between control and a specific proposition variant after tracking QA. Primary metric: ordered purchase-session conversion. Guardrails: revenue per eligible session and checkout errors. Agree sample size, duration, owner and review date before launch. Customer Journey exposes a transparent approximate sample-size calculator. No actual experiment or uplift has been observed.

**Human checkpoint:** Client Room lets the reviewer edit one recommendation. Editing or changing scope clears review. A checkbox enables the executive Markdown note and six-slide PDF. It is a local advisory review flag, not a signed approval/audit system. Export source, currency, date range and limitations on every page.

Skeptical-client Q&A:

- “Is the drop-off definitely a UX issue?” No. Audit event order and instrumentation before forming a treatment hypothesis.
- “Can we increase spend on the best channel?” Not responsibly from these numbers alone. We need matched spend, quality controls and a causal design.
- “Did AI calculate this?” No. SQL/Python calculate the aggregates. The optional model can select a constrained decision using approved evidence, then the validator checks it.
- “Is 36/36 proof the model is reliable?” No. Those are deterministic fixture cases. Live model evaluation is unverified.
- “What changes with production data?” Reconcile identity/timezone semantics, consent, permissions, cost, incomplete events and independent holdout evaluation before authorizing client decisions.
