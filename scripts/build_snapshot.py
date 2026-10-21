import json
import sys
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from services.api.analytics import Analytics, ROOT
from services.api.agent import ask
from services.api.models import AskRequest

questions = {
    "get_funnel": "Show the funnel",
    "compare_channels": "Compare channels",
    "get_data_quality": "Check data quality",
    "get_metric_definition": "Define conversion denominator",
    "compare_periods": "Compare periods",
    "propose_experiment": "Propose an experiment",
}
a = Analytics()
snapshots = {}
for period, (start, end) in {
    "full": ("2021-01-01", "2021-01-14"),
    "first": ("2021-01-01", "2021-01-07"),
    "second": ("2021-01-08", "2021-01-14"),
}.items():
    for channel in ["all", "google / organic", "newsletter / email", "google / cpc"]:
        s = a.snapshot(start, end, channel)
        s["answers"] = {
            tool: ask(AskRequest(question=q, start=start, end=end, channel=channel), analytics=a).model_dump()
            for tool, q in questions.items()
        }
        for ans in s["answers"].values():
            ans["trace"]["execution"] = (
                "Python precomputed deterministic fixture; elapsed time is build-time, not a browser model call."
            )
        snapshots[period + "|" + channel] = s
(ROOT / "apps/web/src/snapshot.json").write_text(json.dumps(snapshots, indent=2) + "\n")
print(f"Built {len(snapshots)} scoped snapshots from raw SQL transformations")
