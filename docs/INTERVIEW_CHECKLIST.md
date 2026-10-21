# ! — R/GA Interview Evidence Checklist

Use this to evaluate the completed product. These are evidence requirements, not claims that the product already meets them.

## Gap 1: Production-style LLM pipeline / evaluation
- [ ] Demonstrate a question causing a registered tool call, real data computation, structured answer and exact evidence IDs.
- [ ] Show one deliberately unsupported question (e.g., 'Which channel causally drove growth?') and a correct abstention.
- [ ] Walk through 30+ curated tests, including 10+ failures/adversarial cases.
- [ ] Show a before/after prompt version and measured changes without inflated statistics.
- [ ] Explain tool permissions, prompt-injection defence, runtime errors and costs.

## Gap 2: GA4, Google Tag Manager, BigQuery
- [ ] Walk through the Demo Store checkout and inspect correct GTM `dataLayer` events.
- [ ] Verify Tag Assistant and GA4 DebugView **from a real account** and retain authentic screenshots.
- [ ] Explain GA4 event schema, parameters, purchase deduplication and consent.
- [ ] Run an SQL query over a BigQuery sample table; explain nested event params and billing precautions.
- [ ] Demonstrate a duplicate/null event QA check and distinguish fixture tests from cloud tests.

## Gap 3: Marketing measurement / attribution
- [ ] State a business objective, metric definition and appropriate action.
- [ ] Explain ordered funnel conversion and denominator choices.
- [ ] Explain why first-touch vs last-touch models vary and what available GA4 data cannot tell us.
- [ ] Never confuse attributed conversions with causal campaign impact.
- [ ] Explain why historical public GA4 data alone is insufficient for *actual* ROAS/CPA without ad-spend joins.
- [ ] Propose an A/B test with guardrails and a measurable success criterion.

## Gap 4: Client communication
- [ ] Present a six-slide mock client review in under seven minutes.
- [ ] Say the main recommendation in one sentence, then support with evidence and caveats.
- [ ] Explain commercial relevance using only defensible metrics.
- [ ] Handle a skeptical stakeholder question: 'How do you know the campaign caused the improvement?'
- [ ] Show a human review/approval step before publishing advice.

## Recruiter-ready package
- [ ] Public repository with functional README and clean commit history.
- [ ] Live demo URL if feasible; never label offline simulation as live analytics.
- [ ] Two-minute product walkthrough showing actual functionality.
- [ ] BigQuery SQL, source documentation, measurement plan and evaluated AI tests.
- [ ] A truthful resume entry reflecting implemented features, not planned features.
- [ ] A 60-second explanation of which parts Codex assisted with and which choices/tests you owned.

## Questions you must be able to answer yourself
1. Why does this need an LLM rather than ordinary SQL + dashboards?
2. What happens when the LLM invents a number?
3. What exactly is evaluated? How was the gold set labelled?
4. Which data are real, obfuscated, test-generated and simulated?
5. What event fires on a demo purchase and how do you prevent duplicates?
6. What can't your attribution model prove?
7. What is the highest-value recommendation you can justify from the current data?
8. What would you improve with two more weeks and real client access?

**Application rule:** Apply for the job promptly; do not wait for every checkbox to be checked. Tailor the resume to skills already held, then add new evidence as it's actually completed.

## R/GA Signature Behaviours proof
- [ ] **Make Things Happen:** show a working feature, tests, CI and a public GitHub commit.
- [ ] **Make Things Together:** show handover documentation and explain how a colleague can reproduce results.
- [ ] **Make Things New:** contrast evaluated AI workflows with a normal dashboard, and justify when AI should not be used.
- [ ] **Make Things Matter:** connect the finding to one recommendation and an experimental measure of impact.

## Important reality check
No portfolio can guarantee a job offer. Submit the job application promptly. If a live GA4/GTM or LLM integration is incomplete, explain the exact blocker honestly instead of presenting offline fixtures as live production.
