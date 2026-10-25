"""Offline reconciliation of complete Console JSON exports; never authenticates or queries Google."""

from __future__ import annotations
import argparse
import hashlib
import json
import math
import sys
from datetime import datetime, timezone
from pathlib import Path
from typing import Any

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from services.api.analytics import Analytics, validate_window
from services.api.bigquery import PUBLIC_SOURCE
from services.api.marketing import prioritise

COUNT_KEYS = ("raw_events", "clean_events", "sessions", "views", "carts", "checkouts", "purchases", "transactions")


def integer(value: Any) -> int:
    # Console encodes INT64 as strings. Reject fractions rather than truncating them.
    if isinstance(value, bool) or not isinstance(value, (str, int)):
        raise ValueError("Expected integral BigQuery value")
    result = int(value)
    if str(result) != str(value):
        raise ValueError("Expected canonical integral BigQuery value")
    return result


def reconcile_export(extract: Path, oracle: Path, start: str, end: str) -> dict[str, Any]:
    validate_window(start, end, PUBLIC_SOURCE)
    raw, reference = extract.read_bytes(), oracle.read_bytes()
    rows, expected_rows = json.loads(raw), json.loads(reference)
    if not isinstance(rows, list) or len(rows) > 200000:
        raise ValueError("Require a complete JSON array of at most 200,000 events")
    if not isinstance(expected_rows, list) or len(expected_rows) != 1:
        raise ValueError("Require the independent aggregate query's single result row")
    expected = expected_rows[0]
    if set(expected) != {*COUNT_KEYS, "revenue_usd"}:
        raise ValueError("Require all nine aggregate columns")
    expected = {k: integer(expected[k]) for k in COUNT_KEYS} | {
        "revenue_usd": float(expected["revenue_usd"]) if expected["revenue_usd"] is not None else None
    }
    if any(v is not None and (not math.isfinite(v) or v < 0) for v in expected.values()):
        raise ValueError("Aggregate values must be finite and nonnegative")
    if len(rows) != expected["raw_events"]:
        raise ValueError("Extract row count differs from independent raw count; refuse partial exports")
    records = []
    for r in rows:
        timestamp = integer(r["event_timestamp"])
        day = datetime.fromtimestamp(timestamp / 1e6, timezone.utc).date().isoformat()
        if not start <= day <= end:
            raise ValueError("Export contains events outside the requested UTC window")
        records.append(
            {
                "event_id": r["event_id"],
                "event_name": r["event_name"],
                "event_timestamp": timestamp,
                "user_pseudo_id": r["user_pseudo_id"],
                "event_params": {
                    "ga_session_id": integer(r["ga_session_id"]) if r["ga_session_id"] is not None else None,
                    "source_medium": r["source_medium"],
                    "campaign": r["campaign"],
                    "currency": "USD",
                },
                "ecommerce": {
                    "transaction_id": r["transaction_id"],
                    "purchase_revenue_in_usd": float(r["purchase_revenue_in_usd"])
                    if r["purchase_revenue_in_usd"] is not None
                    else None,
                },
            }
        )
    analytics = Analytics(records, {**PUBLIC_SOURCE, "start": start, "end": end})
    snapshot = analytics.snapshot(start, end)
    observed = dict(zip(["sessions", "views", "carts", "checkouts", "purchases"], [f["value"] for f in snapshot["funnel"]]))
    observed.update(
        raw_events=snapshot["quality"]["raw_events"],
        clean_events=snapshot["quality"]["clean_events"],
        transactions=snapshot["transactions"],
        revenue_usd=next((m["value"] for m in snapshot["metrics"] if m["metric"] == "revenue"), None),
    )
    checks = {
        k: observed[k] is not None and expected[k] is not None
        and math.isclose(observed[k], expected[k], rel_tol=0, abs_tol=0.00005 if k == "revenue_usd" else 0)
        for k in expected
    }
    return {
        "status": "EXPORT_RECONCILED" if all(checks.values()) else "RECONCILIATION_FAILED",
        "verification_boundary": "Local arithmetic only. Google origin, authentication and job costs require separate Console receipts. SDK transport is not verified by this command.",
        "window": [start, end],
        "timezone": "UTC",
        "revenue_unit": "USD",
        "export_sha256": hashlib.sha256(raw).hexdigest(),
        "oracle_export_sha256": hashlib.sha256(reference).hexdigest(),
        "observed": observed,
        "oracle": expected,
        "checks": checks,
        "quality": snapshot["quality"],
        "lineage": snapshot["lineage"],
        "funnel": snapshot["funnel"],
        "funnel_priority": prioritise(snapshot["funnel"]),
        "acquisition_groups": snapshot["channels"],
    }


def main() -> None:
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument("--extract", type=Path, required=True)
    parser.add_argument("--oracle", type=Path, required=True)
    parser.add_argument("--start", default="2021-01-01")
    parser.add_argument("--end", default="2021-01-01")
    parser.add_argument("--output", type=Path, required=True)
    args = parser.parse_args()
    report = reconcile_export(args.extract, args.oracle, args.start, args.end)
    # Preserve earlier receipts and never overwrite raw inputs.
    with args.output.open("x") as out:
        out.write(json.dumps(report, indent=2) + "\n")
    print(json.dumps({"status": report["status"], "checks": report["checks"]}, indent=2))
    if report["status"] != "EXPORT_RECONCILED":
        sys.exit(1)


if __name__ == "__main__":
    main()
