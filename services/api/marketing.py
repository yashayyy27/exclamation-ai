"""Descriptive decision support: no causal credit, spend estimates or uplift forecasts."""

from __future__ import annotations
import math
from typing import Any


def wilson(successes: int, total: int) -> list[float] | None:
    if not total:
        return None
    z, p = 1.96, successes / total
    d = 1 + z * z / total
    centre = (p + z * z / (2 * total)) / d
    half = z * math.sqrt(p * (1 - p) / total + z * z / (4 * total * total)) / d
    return [round(100 * (centre - half), 2), round(100 * (centre + half), 2)]


def prioritise(funnel: list[dict[str, Any]]) -> list[dict[str, Any]]:
    rows = []
    for before, after in zip(funnel, funnel[1:]):
        lost = before["value"] - after["value"]
        rate = lost / before["value"] if before["value"] else None
        rows.append(
            {
                "from": before["name"],
                "to": after["name"],
                "entrants": before["value"],
                "lost": lost,
                "loss_pct": round(100 * rate, 2) if rate is not None else None,
                "score": round(lost * rate, 2) if rate is not None else None,
            }
        )
    return sorted(rows, key=lambda r: r["score"] if r["score"] is not None else -1, reverse=True)


def attribution_demo() -> dict[str, Any]:
    # Explicit, tiny separate scenario. Never joined to fixture or Google performance.
    journeys: list[dict[str, Any]] = [
        {"id": "invented-A", "touches": ["email", "organic"], "revenue_usd": 100},
        {"id": "invented-B", "touches": ["paid search", "organic"], "revenue_usd": 50},
        {"id": "invented-C", "touches": ["paid search"], "revenue_usd": 0},
    ]
    credits: dict[str, dict[str, float]] = {m: {} for m in ["first", "last", "linear"]}
    for j in journeys:
        touches, value = j["touches"], j["revenue_usd"]
        for model, allocation in [("first", [touches[0]]), ("last", [touches[-1]]), ("linear", touches)]:
            for channel in allocation:
                credits[model][channel] = credits[model].get(channel, 0) + value / len(allocation)
    return {
        "label": "SEPARATE SYNTHETIC ATTRIBUTION SCENARIO",
        "lookback": "Invented complete 7-day same-device journeys",
        "journeys": journeys,
        "credits_usd": credits,
        "limitation": "Three invented journeys explain sensitivity to credit rules. No incremental effect, spend, cross-device match or real channel recommendation.",
    }
