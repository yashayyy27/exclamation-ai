from __future__ import annotations
from typing import Literal
from pydantic import BaseModel, ConfigDict, Field

ToolName = Literal[
    "get_funnel", "compare_channels", "get_data_quality", "get_metric_definition", "compare_periods", "propose_experiment"
]


class StrictModel(BaseModel):
    model_config = ConfigDict(extra="forbid", allow_inf_nan=False)


class Metric(StrictModel):
    metric: str
    value: float
    unit: str
    date_range: list[str] = Field(min_length=2, max_length=2)
    source_id: str
    query_id: str


class ModelDecision(StrictModel):
    """Constrained authoring keeps unsupported numeric/causal prose out of client output."""

    finding: Literal[
        "funnel_opportunity", "channel_comparison", "data_quality", "metric_definition", "period_comparison", "experiment_plan"
    ]
    evidence: list[Metric] = Field(min_length=1, max_length=10)
    action: Literal[
        "audit_then_test",
        "validate_channel_quality",
        "repair_tracking",
        "clarify_definition",
        "review_periods",
        "run_controlled_test",
    ]
    confidence: Literal["DESCRIPTIVE_ONLY", "LIMITED_EVIDENCE"]


class AskRequest(StrictModel):
    question: str = Field(min_length=3, max_length=500)
    start: str = "2021-01-01"
    end: str = "2021-01-14"
    channel: str = "all"
    source: Literal["fixture", "bigquery"] = "fixture"
    provider: Literal["fixture", "openai"] = "fixture"


class Answer(StrictModel):
    question: str
    status: Literal["SUPPORTED", "INSUFFICIENT_EVIDENCE", "REVIEW_REQUIRED"]
    finding: str
    supporting_metrics: list[Metric]
    caveats: list[str]
    recommended_action: str
    expected_direction: str
    how_to_test: str
    confidence_label: str
    needs_human_review: bool = True
    trace: dict
