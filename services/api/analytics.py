"""Read-only SQLite transformations shared by offline snapshots and API."""

from __future__ import annotations
import hashlib
import json
import math
import sqlite3
from datetime import date
from pathlib import Path
from typing import Any

ROOT = Path(__file__).resolve().parents[2]
SOURCE = {
    "id": "synthetic_fixture_v1",
    "label": "SYNTHETIC / ILLUSTRATIVE",
    "currency": "USD",
    "timezone": "UTC",
    "start": "2021-01-01",
    "end": "2021-01-14",
    "sampling": "Deterministic complete fixture; no sampling. Not Google data.",
    "generated_at": "2026-10-21",
    "obfuscation": "Invented event records, not an extract of public GA4.",
}


def validate_window(start: str, end: str, source: dict[str, Any]) -> None:
    a, b = date.fromisoformat(start), date.fromisoformat(end)
    if a > b or start < source["start"] or end > source["end"] or (b - a).days > 92:
        raise ValueError("Date window outside source scope or exceeds 93 days")


class Analytics:
    def __init__(self, records: list[dict[str, Any]] | None = None, source: dict[str, Any] | None = None):
        self.source = source or SOURCE.copy()
        self.records = records if records is not None else json.loads((ROOT / "data/fixtures/events.json").read_text())
        self.db = sqlite3.connect(":memory:")
        self.db.row_factory = sqlite3.Row
        self.db.execute(
            "CREATE TABLE raw_events(event_id TEXT,name TEXT,ts REAL,user_id TEXT,session_id TEXT,channel TEXT,campaign TEXT,currency TEXT,transaction_id TEXT,revenue REAL)"
        )
        self.schema_mismatches = 0
        for e in self.records:
            try:
                p, t = e.get("event_params", {}), e.get("ecommerce", {})
                if (
                    not isinstance(e.get("event_id"), str)
                    or not e["event_id"]
                    or not isinstance(e.get("event_name"), str)
                    or not isinstance(p, dict)
                    or not isinstance(t, dict)
                    or not isinstance(e.get("event_timestamp"), (int, float))
                    or not math.isfinite(e["event_timestamp"])
                    or not isinstance(t.get("purchase_revenue_in_usd") or 0, (int, float))
                    or not math.isfinite(t.get("purchase_revenue_in_usd") or 0)
                ):
                    raise ValueError("Raw event schema mismatch")
            except (AttributeError, TypeError, ValueError):
                self.schema_mismatches += 1
                continue
            self.db.execute(
                "INSERT INTO raw_events VALUES(?,?,?,?,?,?,?,?,?,?)",
                (
                    e["event_id"],
                    e["event_name"],
                    e["event_timestamp"] / 1e6,
                    e.get("user_pseudo_id"),
                    p.get("ga_session_id"),
                    p.get("source_medium") or "(unknown)",
                    p.get("campaign") or "(unknown)",
                    p.get("currency", "USD"),
                    t.get("transaction_id"),
                    t.get("purchase_revenue_in_usd") or 0,
                ),
            )
        for table, file in [("events", "clean_events"), ("sessions", "sessions"), ("transactions", "transactions")]:
            self.db.execute(f"CREATE TABLE {table} AS " + (ROOT / f"data/sql/{file}.sql").read_text())
        self.db.execute("PRAGMA query_only=ON")

    def rows(self, sql: str, args: tuple = ()) -> list[dict[str, Any]]:
        return [dict(r) for r in self.db.execute(sql, args).fetchall()]

    def quality(self) -> dict[str, int]:
        raw = len(self.records)
        clean = self.db.execute("SELECT COUNT(*) FROM events").fetchone()[0]
        duplicate = self.db.execute("SELECT COUNT(*)-COUNT(DISTINCT event_id) FROM raw_events").fetchone()[0]
        return {
            "raw_events": raw,
            "clean_events": clean,
            "duplicates": duplicate,
            "invalid_records": raw - clean - duplicate,
            "schema_mismatches": self.schema_mismatches,
            "missing_identifiers": self.db.execute(
                "SELECT COUNT(*) FROM raw_events WHERE user_id IS NULL OR session_id IS NULL"
            ).fetchone()[0],
            "negative_revenue": self.db.execute("SELECT COUNT(*) FROM raw_events WHERE revenue<0").fetchone()[0],
            "missing_channel": self.db.execute("SELECT COUNT(*) FROM events WHERE channel='(unknown)'").fetchone()[0],
        }

    def snapshot(self, start: str = "2021-01-01", end: str = "2021-01-14", channel: str = "all") -> dict[str, Any]:
        validate_window(start, end, self.source)
        if channel not in ["all", "google / organic", "newsletter / email", "google / cpc", "(unknown)"]:
            raise ValueError("Channel not in allowlist")
        where = "day BETWEEN ? AND ? AND (? = 'all' OR channel=?)"
        args = (start, end, channel, channel)
        s = self.rows("SELECT * FROM sessions WHERE " + where, args)
        counts = [len(s)] + [sum(r[k] is not None for r in s) for k in ["viewed", "carted", "checked", "purchased"]]
        names = ["Sessions", "Product views", "Add to cart", "Checkout", "Purchase"]
        funnel = [
            {
                "name": n,
                "value": v,
                "rate": round(v / counts[0] * 100, 4) if counts[0] else 0,
                "step_rate": round(v / counts[i - 1] * 100, 4) if i and counts[i - 1] else 100 if v else 0,
            }
            for i, (n, v) in enumerate(zip(names, counts))
        ]
        revenue = self.rows(
            "SELECT COALESCE(SUM(t.revenue),0) AS revenue, COUNT(*) AS transactions FROM transactions t JOIN sessions s USING(session_key) WHERE s."
            + where,
            args,
        )[0]
        channels = self.rows(
            "SELECT channel, COUNT(*) AS sessions, SUM(purchased IS NOT NULL) AS purchases, ROUND(100.0*SUM(purchased IS NOT NULL)/COUNT(*),4) AS conversion FROM sessions WHERE "
            + where
            + " GROUP BY channel ORDER BY sessions DESC, channel",
            args,
        )
        trend = self.rows(
            "SELECT day, COUNT(*) AS sessions, SUM(purchased IS NOT NULL) AS purchases FROM sessions WHERE "
            + where
            + " GROUP BY day ORDER BY day",
            args,
        )
        qid = (
            "q-" + hashlib.sha256(json.dumps([self.source["id"], start, end, channel], sort_keys=True).encode()).hexdigest()[:12]
        )
        metric_values = [
            ("sessions", counts[0], "sessions"),
            ("purchases", counts[-1], "sessions"),
            ("conversion_rate", counts[-1] / counts[0] * 100 if counts[0] else 0, "%"),
            ("revenue", revenue["revenue"], "USD"),
            ("checkout_completion", counts[-1] / counts[-2] * 100 if counts[-2] else 0, "%"),
        ]
        metrics = [
            {
                "metric": n,
                "value": round(v, 4),
                "unit": u,
                "date_range": [start, end],
                "source_id": self.source["id"],
                "query_id": qid,
            }
            for n, v, u in metric_values
        ]
        losses = [counts[i - 1] - counts[i] for i in range(1, len(counts))]
        biggest = max(range(len(losses)), key=losses.__getitem__) if counts[0] else None
        return {
            "source": self.source,
            "window": [start, end],
            "channel": channel,
            "query_id": qid,
            "metrics": metrics,
            "funnel": funnel,
            "channels": channels,
            "trend": trend,
            "quality": self.quality(),
            "transactions": revenue["transactions"],
            "decision": {
                "step": names[biggest + 1] if biggest is not None else None,
                "lost_sessions": losses[biggest] if biggest is not None else 0,
                "action": "Test a clearer product-to-cart proposition; audit instrumentation before changing the experience.",
                "caveat": "Synthetic fixture demonstrates diagnosis, not a real commercial opportunity. Drop-off does not establish its cause.",
            },
            "attribution": {
                "status": "INSUFFICIENT_EVIDENCE",
                "reason": "One observed session per synthetic identity. No multi-touch or cross-device evidence; only descriptive session-source comparison.",
            },
        }
