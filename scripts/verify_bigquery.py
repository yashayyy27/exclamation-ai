"""Owner-only dry-run/reconciliation. No raw Google identities are persisted."""

import argparse
import hashlib
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

sys.path.insert(0, str(Path(__file__).resolve().parents[1]))
from services.api.analytics import ROOT, validate_window
from services.api.bigquery import BigQueryAdapter, PUBLIC_SOURCE


def main() -> None:
    p = argparse.ArgumentParser()
    p.add_argument("--start", default="2021-01-01")
    p.add_argument("--end", default="2021-01-01")
    p.add_argument("--execute", action="store_true")
    p.add_argument("--allow-paid", action="store_true")
    p.add_argument("--maximum-bytes", type=int, default=1_000_000_000)
    args = p.parse_args()
    if args.execute and not args.allow_paid:
        p.error("Execution requires explicit owner spend approval and --allow-paid")
    if not 20_000_000 <= args.maximum_bytes <= 2_000_000_000:
        p.error("Total two-query byte ceiling must be 20 MB..2 GB")
    validate_window(args.start, args.end, PUBLIC_SOURCE)
    os.environ["BIGQUERY_MAX_BYTES"] = str(args.maximum_bytes // 2)
    adapter = BigQueryAdapter()
    params = [
        adapter.sdk.ScalarQueryParameter(k, "STRING", v.replace("-", ""))
        for k, v in [("start_suffix", args.start), ("end_suffix", args.end)]
    ]
    estimates = {}
    for filename in ["bigquery_events", "bigquery_reconcile"]:
        sql = (ROOT / f"data/sql/{filename}.sql").read_text()
        job = adapter.client.query(
            sql,
            job_config=adapter.sdk.QueryJobConfig(dry_run=True, use_query_cache=False, query_parameters=params),
            location="US",
        )
        if job.total_bytes_processed is None:
            raise ValueError("Unknown byte estimate; refuse execution")
        estimates[filename] = job.total_bytes_processed
    if any(v > args.maximum_bytes // 2 for v in estimates.values()):
        raise ValueError("Narrow date range: per-query dry run exceeds half the total budget")
    report = {
        "status": "DRY_RUN_ONLY",
        "window": [args.start, args.end],
        "project": os.environ["GOOGLE_CLOUD_PROJECT"],
        "dataset": "bigquery-public-data.ga4_obfuscated_sample_ecommerce",
        "timezone": "UTC",
        "revenue_unit": "USD",
        "dry_run_bytes": estimates,
        "maximum_total_bytes_billed": args.maximum_bytes,
        "cost_usd": None,
        "limitations": "Historical obfuscation; acquisition metadata, no spend; UTC boundary sessions may be truncated. No GA4 UI parity claimed.",
    }
    if args.execute:
        analytics, receipt = adapter.load(args.start, args.end)
        s = analytics.snapshot(args.start, args.end)
        sql = (ROOT / "data/sql/bigquery_reconcile.sql").read_text()
        config = adapter.sdk.QueryJobConfig(
            query_parameters=params, maximum_bytes_billed=args.maximum_bytes // 2, job_timeout_ms=20000
        )
        job = adapter.client.query(sql, job_config=config, location="US", timeout=25)
        oracle = dict(next(iter(job.result(timeout=25))))
        observed = dict(zip(["sessions", "views", "carts", "checkouts", "purchases"], [f["value"] for f in s["funnel"]]))
        observed.update(
            raw_events=s["quality"]["raw_events"], clean_events=s["quality"]["clean_events"], transactions=s["transactions"]
        )
        money = next((m["value"] for m in s["metrics"] if m["metric"] == "revenue"), None)
        if money is not None:
            observed["revenue_usd"] = money
        checks = {k: abs(v - (oracle[k] or 0)) < 0.00005 for k, v in observed.items()}
        report.update(
            status="VERIFIED" if all(checks.values()) else "RECONCILIATION_FAILED",
            extract=receipt,
            oracle_job={"job_id": job.job_id, "bytes_billed": job.total_bytes_billed, "cache_hit": job.cache_hit},
            oracle=oracle,
            observed=observed,
            checks=checks,
            lineage=s["lineage"],
            missing_revenue_events=s["quality"]["missing_purchase_revenue"],
        )
    report["sql_sha256"] = {n: hashlib.sha256((ROOT / f"data/sql/{n}.sql").read_bytes()).hexdigest() for n in estimates}
    stamp = datetime.now(timezone.utc).strftime("%Y%m%dT%H%M%S%fZ")
    dest = ROOT / f"docs/evidence/bigquery-{stamp}.json"
    dest.write_text(json.dumps(report, indent=2) + "\n")
    print(json.dumps(report, indent=2))
    if report["status"] == "RECONCILIATION_FAILED":
        sys.exit(1)


if __name__ == "__main__":
    main()
