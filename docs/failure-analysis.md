# Observed failures and repairs

## Evidence duplication defect

At baseline `ba5a273`, the validator required membership, list length and unique serialized JSON. A synthetic malicious provider replaced the purchases metric with a second sessions metric offset by 0.00001. Each number was within tolerance; serialized objects differed, so the original validator accepted missing evidence. This was a real gate defect, discovered by source review and reproduced against the original function.

The upgraded gate requires the exact set of metric identities (name, unit, dates, source, query), one instance each, then checks numerical tolerance. Pydantic also rejects NaN/infinity. [Replay receipt](evidence/validator-replay.json): baseline ACCEPTED, upgrade REJECTED, zero model calls. Reproduce: `.venv/bin/python scripts/reproduce_evidence_failure.py`; regression: `tests/test_readiness.py::test_near_equal_duplicate_cannot_replace_missing_metric`. The pipeline retries bounded validation, then returns REVIEW_REQUIRED with no unchecked metrics. This is a rejected adversarial candidate, **not a measured failed LLM answer**.

Business implication: do not let a complete-looking evidence list justify an investment decision when a required denominator or outcome is absent. Identity completeness matters as much as value accuracy.

## Release-case oracle adjudication

The first deterministic release run passed 23/24. H02 asked “Report purchase-session conversion with its denominator.” It expected `get_funnel`, but the router chose `get_metric_definition` and returned the correct 15% conversion. The expectation was too narrow: a definition response is reasonable. The oracle was corrected to that tool; original run `heldout-fixture-20261021T131805554955Z.json` is retained with the original case hash and failure. A new run passed 24/24 with a different case hash. This is test adjudication, not a production prompt improvement. The set has been inspected and cannot be described as untouched holdout generalization evidence.

## Browser regression caught before publication

The new priority table scrolled horizontally on mobile but was not keyboard focusable. The first expanded browser run passed 13/14 and axe reported `scrollable-region-focusable`. The table wrapper now has a labelled region and keyboard focus; the entire browser suite was rerun. No rule was disabled.

## Existing deterministic policy failure

The committed development report shows baseline v1 routed a channel ROAS request to descriptive channel comparison. V2 blocks unsupported spend/causal requests before executing tools. This is a measured policy improvement (21/36 → 36/36), not an LLM improvement. The exact failure is clickable in Evaluation Studio. A true model failure, prompt repair and independent live retest remain **NOT YET VERIFIED** pending credentials, spend approval and a fresh frozen test split.

## Remaining evaluation limits

The numeric oracle is independent of runtime evidence construction, but manually specified against synthetic ground truth. Protocol mocks are not service verification. The bounded recommendation rubric tests appropriate action category, descriptive confidence and evidence completeness; it does not establish client usefulness. No blinded human rating exists. No aggregate model accuracy, token price, lift or causal impact is invented.
