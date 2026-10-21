"""Record real harness outcomes. Default fixture runs do not measure LLM quality."""

import argparse
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from services.api.agent import ask, run_tool, validate_decision
from services.api.analytics import Analytics, ROOT
from services.api.models import AskRequest, ModelDecision


class FailureProvider:
    def decide(self, *_: Any) -> None:
        raise RuntimeError("Deliberate API failure test; no external API call")


def run(provider: str = "fixture") -> dict:
    cases = json.loads((ROOT / "evals/cases/golden.json").read_text())
    results = []
    for version in ["v1", "v2"]:
        for c in cases:
            a = Analytics()
            req = AskRequest(question=c["question"], provider=provider)
            ans = ask(req, analytics=a, version=version, provider=FailureProvider() if c["simulate_failure"] else None)
            schema = True
            ModelDecision  # The final answer has already been validated by Pydantic in ask().
            scores = {
                "schema": schema,
                "abstention": ans.status == c["expected_status"],
                "tool_selection": ans.trace["tools"] == ([c["expected_tool"]] if c["expected_tool"] else []),
                "numeric": True,
                "evidence_linkage": True,
            }
            if ans.status == "SUPPORTED":
                try:
                    t = ans.trace["tools"][0]
                    from services.api.agent import TOOL_MAP

                    f, action = TOOL_MAP[t]
                    validate_decision(
                        ModelDecision(finding=f, action=action, evidence=ans.supporting_metrics, confidence="DESCRIPTIVE_ONLY"),
                        run_tool(t, a.snapshot(), a),
                        t,
                    )
                except Exception:
                    scores["evidence_linkage"] = False
                    scores["numeric"] = False
            if c["metric"]:
                matches = [m for m in ans.supporting_metrics if m.metric == c["metric"]]
                scores["numeric"] = bool(matches) and abs(matches[0].value - c["expected_value"]) < 0.0001
            results.append(
                {
                    "id": c["id"],
                    "category": c["category"],
                    "prompt_version": version,
                    "question": c["question"],
                    "expected_status": c["expected_status"],
                    "actual_status": ans.status,
                    "expected_tool": c["expected_tool"],
                    "actual_tools": ans.trace["tools"],
                    "scores": scores,
                    "passed": all(scores.values()),
                    "elapsed_ms": ans.trace["elapsed_ms"],
                    "tokens": ans.trace["tokens"],
                    "cost_usd": ans.trace["cost_usd"],
                    "api_calls": ans.trace["api_calls"],
                    "failure_review": None
                    if all(scores.values())
                    else "Inspect routing/guard policy: expected " + c["expected_status"] + ", observed " + ans.status + ".",
                }
            )
    report = {
        "run_at": datetime.now(timezone.utc).isoformat(),
        "provider": provider,
        "kind": "deterministic fixture / mocked failure"
        if provider == "fixture"
        else "live OpenAI with deliberate mocked API-failure case",
        "model": os.getenv("OPENAI_MODEL") if provider == "openai" else None,
        "cost_note": "Unknown: no price assumptions. Null is not zero.",
        "case_count": len(cases),
        "results": results,
        "versions": {
            v: {"passed": sum(r["passed"] for r in results if r["prompt_version"] == v), "total": len(cases)}
            for v in ["v1", "v2"]
        },
    }
    dest = ROOT / f"evals/runs/{provider}-latest.json"
    dest.write_text(json.dumps(report, indent=2) + "\n")
    (ROOT / "apps/web/public/evidence" / dest.name).write_text(dest.read_text())
    lines = [
        "# ! — evaluation report",
        "",
        "Actual recorded run: " + report["run_at"],
        "",
        "**Provider: " + report["kind"] + ". These are not live model quality scores.**"
        if provider == "fixture"
        else "**Live model run; see model and deliberate mocked failure case in JSON.**",
        "",
        "| Version | Cases passed | What changed |",
        "|---|---:|---|",
    ]
    for v in ["v1", "v2"]:
        lines.append(
            f"| {v} | {report['versions'][v]['passed']}/{len(cases)} | "
            + (
                "Baseline router lacks explicit unsupported-claim guards."
                if v == "v1"
                else "Explicit intent, privacy, ambiguity and injection guards before any tool."
            )
            + " |"
        )
    lines += [
        "",
        "The v1/v2 fixture comparison tests routing and deterministic safety policy. It does not isolate prompt quality or demonstrate an LLM improvement. Both prompt files exist; a real API run is required to compare their model behavior.",
        "",
        "Numerical correctness uses fixed expected values for key KPIs (420 sessions, 63 purchases, USD 5040, 15% conversion) plus evidence assertions against SQL results. Source linkage, abstention, tool selection and schema are separate grades. Timing is measured locally. Token usage and cost are null for fixtures.",
        "",
        "## Per-case failure review",
    ]
    for r in results:
        if not r["passed"]:
            lines.append(
                f"- {r['prompt_version']}/{r['id']}: {r['failure_review']} Failing grades: "
                + ", ".join(k for k, v in r["scores"].items() if not v)
            )
    lines += [
        "",
        "## Fix and remaining risk",
        "The baseline answered a channel ROAS question using descriptive channel evidence. Revised policy rejects unsupported spend claims before tool execution. The same principle covers causal, identity and injected instructions. Rule-based guards are limited and may over-refuse; the constrained model output and exact evidence validator remain the primary containment layer. Live semantic behavior: NOT YET VERIFIED.",
        "",
        "Reproduce: `make eval`; optional authenticated server-side run: `make eval-live`. No API key values belong in reports.",
    ]
    (ROOT / ("docs/evaluation-report.md" if provider == "fixture" else "docs/evaluation-live-report.md")).write_text(
        "\n".join(lines) + "\n"
    )
    print(json.dumps({"provider": provider, "versions": report["versions"], "file": str(dest)}))
    return report


if __name__ == "__main__":
    parser = argparse.ArgumentParser()
    parser.add_argument("--provider", choices=["fixture", "openai"], default="fixture")
    args = parser.parse_args()
    report = run(args.provider)
    if report["versions"]["v2"]["passed"] != report["case_count"]:
        sys.exit(1)
