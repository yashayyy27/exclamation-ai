"""Replay a synthetic provider mutation against the inspected baseline and current gate."""

import ast
import json
import subprocess
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from services.api.agent import FixtureProvider, TOOL_MAP, run_tool, validate_decision
from services.api.analytics import Analytics, ROOT
from services.api.models import ModelDecision

baseline = "ba5a2738339fa939002bef9a43cbd6e76d207677"
source = subprocess.check_output(["git", "show", f"{baseline}:services/api/agent.py"], cwd=ROOT, text=True)
function = next(n for n in ast.parse(source).body if isinstance(n, ast.FunctionDef) and n.name == "validate_decision")
namespace = {"ModelDecision": ModelDecision, "TOOL_MAP": TOOL_MAP, "Any": object, "json": json}
exec(compile(ast.Module(body=[function], type_ignores=[]), "<baseline-validator>", "exec"), namespace)
a = Analytics()
e = run_tool("get_funnel", a.snapshot(), a)
candidate, _ = FixtureProvider().decide("get_funnel", e, "v2")
forged = candidate.model_dump()
forged["evidence"][1] = dict(forged["evidence"][0])
forged["evidence"][1]["value"] += 0.00001
candidate = ModelDecision.model_validate(forged)
results = {}
for label, validator in [("baseline", namespace["validate_decision"]), ("upgrade", validate_decision)]:
    try:
        validator(candidate, e, "get_funnel")
        results[label] = "ACCEPTED"
    except ValueError:
        results[label] = "REJECTED"
report = {
    "kind": "SYNTHETIC ADVERSARIAL PROVIDER REPLAY; NO MODEL CALL",
    "baseline_commit": baseline,
    "mutation": "Replace purchases evidence with a second sessions metric, differing by 0.00001 within tolerance.",
    "results": results,
    "api_calls": 0,
    "expected": {"baseline": "ACCEPTED", "upgrade": "REJECTED"},
}
(ROOT / "docs/evidence/validator-replay.json").write_text(json.dumps(report, indent=2) + "\n")
print(json.dumps(report, indent=2))
assert results == report["expected"]
