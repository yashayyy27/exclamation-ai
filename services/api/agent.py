"""Bounded evidence pipeline. The fixture provider is deterministic, not an LLM."""

from __future__ import annotations
import json
import logging
import os
import re
import time
from typing import Any
from services.api.analytics import Analytics, ROOT
from services.api.models import Answer, AskRequest, ModelDecision

LOG = logging.getLogger("exclamation.audit")
TOOL_MAP = {
    "get_funnel": ("funnel_opportunity", "audit_then_test"),
    "compare_channels": ("channel_comparison", "validate_channel_quality"),
    "get_data_quality": ("data_quality", "repair_tracking"),
    "get_metric_definition": ("metric_definition", "clarify_definition"),
    "compare_periods": ("period_comparison", "review_periods"),
    "propose_experiment": ("experiment_plan", "run_controlled_test"),
}
ACTIONS = {
    "audit_then_test": "Audit product-to-cart tracking, then test a clearer product proposition.",
    "validate_channel_quality": "Inspect channel quality and instrumentation before reallocating any budget.",
    "repair_tracking": "Review excluded and duplicate events before interpreting performance.",
    "clarify_definition": "Preserve the selected metric definition, unit and source scope when comparing results.",
    "review_periods": "Investigate the period difference; do not attribute it to a campaign without an experiment.",
    "run_controlled_test": "Randomize an instrumented product-page variant against the current experience.",
}
FINDINGS = {
    "funnel_opportunity": "The ordered session funnel exposes a transition worth investigating.",
    "channel_comparison": "Session-source conversion differs descriptively; traffic quality and causality remain unresolved.",
    "data_quality": "Raw records include known data-quality issues; the pipeline excludes invalid and duplicate records.",
    "metric_definition": "The selected metric has a declared unit, definition and source scope.",
    "period_comparison": "Equivalent adjacent windows can be compared descriptively; differences are not treatment effects.",
    "experiment_plan": "A randomized test can evaluate a product-page hypothesis after instrumentation QA.",
}
TEST_PLAN = "Randomize eligible sessions 50/50. Primary: ordered purchase-session conversion. Guardrails: revenue per session and checkout errors. Set sample size and duration before launch; review with the owner."


def classify(question: str, version: str = "v2") -> tuple[str | None, str | None]:
    q = question.lower()
    if version == "v2":
        if re.search(r"ignore|system prompt|drop table|execute|override|secret|api.?key|<script|exfiltrat|bypass", q):
            return None, "Untrusted instructions cannot change tool permissions."
        if re.search(
            r"roas|\bcpa\b|ad spend|profit|caus|caused|cross.device|identity|incremental|guarantee|forecast|predict|attribution|first.touch|last.touch|linear credit",
            q,
        ):
            return None, "No matched spend, causal design, multi-touch identity or predictive evidence is available."
        if re.search(r"last month|last week|today|yesterday|2020|2022|2026|eur|aud|denominator unclear|all time", q):
            return None, "Clarify a supported source date range, currency and denominator using the filters."
        if re.search(r"@|\b\d{9,}\b|phone|email address|customer name", q):
            return None, "Personal information is not accepted in analytics questions."
        if re.search(r"null-only|missing data|empty dataset|obfuscated identifier", q):
            return None, "Available evidence is insufficient for the requested claim."
    if any(w in q for w in ["channel", "source", "campaign"]):
        return "compare_channels", None
    if any(w in q for w in ["quality", "duplicate", "invalid", "tracking"]):
        return "get_data_quality", None
    if any(w in q for w in ["definition", "define", "denominator", "meaning"]):
        return "get_metric_definition", None
    if any(w in q for w in ["compare period", "week", "trend", "period"]):
        return "compare_periods", None
    if any(w in q for w in ["experiment", "sample size", "hypothesis", "test plan"]):
        return "propose_experiment", None
    if any(w in q for w in ["funnel", "conversion", "checkout", "purchase", "session", "revenue", "cart", "recommend"]):
        return "get_funnel", None
    return None, "Question is outside the registered analytics intents."


def definition_metric(question: str) -> str:
    q = question.lower()
    if "revenue" in q:
        return "revenue"
    if "checkout" in q:
        return "checkout_completion"
    if "purchase" in q:
        return "purchases"
    if "session" in q and "conversion" not in q:
        return "sessions"
    return "conversion_rate"


def run_tool(name: str, snapshot: dict[str, Any], analytics: Analytics, metric_key: str = "conversion_rate") -> dict[str, Any]:
    if name not in TOOL_MAP:
        raise ValueError("Unregistered tool")
    rows: Any = snapshot["funnel"]
    metrics = list(snapshot["metrics"])
    base = metrics[0]
    if name == "compare_channels":
        rows = snapshot["channels"]
        metrics = [{**base, "metric": f"channel_conversion:{r['channel']}", "value": r["conversion"], "unit": "%"} for r in rows]
    elif name == "get_data_quality":
        rows = snapshot["quality"]
        metrics = [
            {
                **base,
                "metric": k,
                "value": v,
                "unit": "events",
                "date_range": [analytics.source["start"], analytics.source["end"]],
                "query_id": "q-quality-" + analytics.source["id"],
            }
            for k, v in rows.items()
        ]
    elif name == "get_metric_definition":
        definitions = {
            "sessions": "Distinct eligible sessions starting in the selected window.",
            "purchases": "Sessions reaching purchase after all ordered funnel steps.",
            "conversion_rate": "Ordered purchasing sessions / eligible sessions × 100.",
            "revenue": "USD revenue summed once per transaction ID in eligible sessions, independent of ordered funnel completion.",
            "checkout_completion": "Ordered purchasing sessions / ordered checkout sessions × 100.",
        }
        rows = {"metric": metric_key, "definition": definitions[metric_key]}
        metrics = [m for m in metrics if m["metric"] == metric_key]
    elif name == "compare_periods":
        from datetime import date, timedelta

        start, end = [date.fromisoformat(d) for d in snapshot["window"]]
        if (end - start).days < 1 or ((end - start).days + 1) % 2:
            raise ValueError("Period comparison requires an even number of days")
        mid = start + timedelta(days=((end - start).days + 1) // 2)
        periods = [
            analytics.snapshot(start.isoformat(), (mid - timedelta(days=1)).isoformat(), snapshot["channel"]),
            analytics.snapshot(mid.isoformat(), end.isoformat(), snapshot["channel"]),
        ]
        metrics = [p["metrics"][2] for p in periods]
        rows = [p["trend"] for p in periods]
    elif name == "propose_experiment":
        rows = {"hypothesis": "Clearer product proposition improves ordered purchase-session conversion.", "test": TEST_PLAN}
    return {"tool": name, "rows": rows, "metrics": metrics}


def validate_decision(candidate: ModelDecision, evidence: dict[str, Any], expected_tool: str) -> None:
    finding, action = TOOL_MAP[expected_tool]
    if candidate.finding != finding or candidate.action != action:
        raise ValueError("Finding/action does not match approved intent")
    allowed = evidence["metrics"]
    for m in candidate.evidence:
        item = m.model_dump()
        if not any(
            all(item[k] == row[k] for k in ["metric", "unit", "date_range", "source_id", "query_id"])
            and abs(item["value"] - row["value"]) < 0.00005
            for row in allowed
        ):
            raise ValueError("Evidence numeric/source/date consistency failed")
    if len(candidate.evidence) != len(allowed):
        raise ValueError("Evidence incomplete")
    if len({m.model_dump_json() for m in candidate.evidence}) != len(allowed):
        raise ValueError("Duplicate evidence")


class FixtureProvider:
    def decide(self, tool: str, evidence: dict[str, Any], version: str) -> tuple[ModelDecision, dict]:
        finding, action = TOOL_MAP[tool]
        return ModelDecision.model_validate(
            {"finding": finding, "action": action, "evidence": evidence["metrics"], "confidence": "DESCRIPTIVE_ONLY"}
        ), {
            "model": None,
            "tokens": None,
            "cost_usd": None,
            "api_calls": 0,
        }


class OpenAIProvider:
    def __init__(self, client: Any = None):
        from openai import OpenAI

        if not os.getenv("OPENAI_MODEL"):
            raise ValueError("OPENAI_MODEL must be configured")
        self.client: Any = client or OpenAI(timeout=20, max_retries=0)
        self.calls = 0

    def decide(self, tool: str, evidence: dict[str, Any], version: str) -> tuple[ModelDecision, dict]:
        model = os.environ["OPENAI_MODEL"]
        prompt = (ROOT / f"services/api/prompts/{version}.txt").read_text()
        # No raw question, identity, event metadata or free-form SQL reaches the model.
        fn = {
            "type": "function",
            "name": tool,
            "description": "Get server-scoped aggregate analytics evidence.",
            "strict": True,
            "parameters": {"type": "object", "properties": {}, "required": [], "additionalProperties": False},
        }
        self.calls += 1
        first = self.client.responses.create(
            model=model,
            instructions=prompt,
            store=False,
            input="Use the registered tool for the server-approved analytics intent.",
            tools=[fn],
            tool_choice={"type": "function", "name": tool},
            parallel_tool_calls=False,
            max_output_tokens=800,
        )
        calls = [i for i in first.output if i.type == "function_call"]
        if len(calls) != 1 or calls[0].name != tool or json.loads(calls[0].arguments) != {}:
            raise ValueError("Model attempted unapproved tool or arguments")
        self.calls += 1
        final = self.client.responses.create(
            model=model,
            instructions=prompt,
            store=False,
            input=[*first.output, {"type": "function_call_output", "call_id": calls[0].call_id, "output": json.dumps(evidence)}],
            text={
                "format": {"type": "json_schema", "name": "decision", "schema": ModelDecision.model_json_schema(), "strict": True}
            },
            max_output_tokens=2500,
        )
        decision = ModelDecision.model_validate_json(final.output_text)
        usage = sum(getattr(x.usage, "total_tokens", 0) for x in [first, final])
        return decision, {"model": model, "tokens": usage, "cost_usd": None, "api_calls": 2}


def ask(req: AskRequest, analytics: Analytics | None = None, version: str = "v2", provider: Any = None) -> Answer:
    began = time.perf_counter()
    trace: dict[str, Any] = {
        "provider": req.provider,
        "prompt_version": version,
        "tools": [],
        "model": None,
        "tokens": None,
        "cost_usd": None,
        "api_calls": 0,
        "attempts": 0,
    }

    def response(status: str, finding: str, metrics: list, action: str, confidence: str) -> Answer:
        trace["elapsed_ms"] = round((time.perf_counter() - began) * 1000, 3)
        LOG.info(json.dumps({**trace, "outcome": status}))
        return Answer.model_validate(
            dict(
                question="Server-scoped analytics question",
                status=status,
                finding=finding,
                supporting_metrics=metrics,
                caveats=[
                    "Synthetic mode is illustrative, not an observed business result."
                    if req.source == "fixture"
                    else "Historical obfuscated Google data has limited internal consistency.",
                    "Descriptive evidence does not establish causality; human review is required.",
                ],
                recommended_action=action,
                expected_direction="Hypothesis only: improve ordered conversion; no uplift promised.",
                how_to_test=TEST_PLAN,
                confidence_label=confidence,
                trace=trace,
            )
        )

    tool, reason = classify(req.question, version)
    if not tool:
        return response(
            "INSUFFICIENT_EVIDENCE",
            reason or "Unsupported intent.",
            [],
            "Clarify the question or supply independently verified evidence.",
            "INSUFFICIENT_EVIDENCE",
        )
    try:
        a = analytics or Analytics()
        snapshot = a.snapshot(req.start, req.end, req.channel)
        if not snapshot["metrics"][0]["value"]:
            return response(
                "INSUFFICIENT_EVIDENCE",
                "No eligible sessions in this window.",
                [],
                "Supply a window with evidence.",
                "INSUFFICIENT_EVIDENCE",
            )
        if tool == "compare_channels" and len(snapshot["channels"]) < 2:
            return response(
                "INSUFFICIENT_EVIDENCE",
                "Select all channels to compare at least two source groups.",
                [],
                "Widen the channel scope.",
                "INSUFFICIENT_EVIDENCE",
            )
        metric_key = definition_metric(req.question)
        evidence = run_tool(tool, snapshot, a, metric_key)
        trace["tools"] = [tool]
        trace["query_ids"] = sorted({m["query_id"] for m in evidence["metrics"]})
        selected = provider or (OpenAIProvider() if req.provider == "openai" else FixtureProvider())
        failure: Exception | None = None
        for attempt in range(2):
            trace["attempts"] = attempt + 1
            try:
                candidate, usage = selected.decide(tool, evidence, version)
                trace.update(usage)
                trace["api_calls"] = getattr(selected, "calls", usage["api_calls"])
                validate_decision(candidate, evidence, tool)
                trace["evidence_rows"] = evidence["rows"]
                return response(
                    "SUPPORTED", FINDINGS[candidate.finding], candidate.evidence, ACTIONS[candidate.action], candidate.confidence
                )
            except (ValueError, TypeError) as exc:
                trace["api_calls"] = getattr(selected, "calls", trace["api_calls"])
                failure = exc
        raise ValueError("Generated evidence failed validation") from failure
    except Exception:
        # Never return provider exception bodies: they may contain request metadata.
        trace["error_code"] = "PIPELINE_OR_PROVIDER_ERROR"
        return response(
            "REVIEW_REQUIRED",
            "The evidence pipeline could not verify an answer.",
            [],
            "Check server configuration or narrow the question; no unchecked advice was published.",
            "REVIEW_REQUIRED",
        )
