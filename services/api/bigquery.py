"""Optional real SDK adapter; never runs unless source explicitly selected."""

from __future__ import annotations
import os
from typing import Any
from services.api.analytics import Analytics, ROOT, validate_window

PUBLIC_SOURCE = {
    "id": "google_public_historical",
    "label": "GOOGLE PUBLIC / HISTORICAL",
    "start": "2020-11-01",
    "end": "2021-01-31",
    "currency": "USD",
    "timezone": "UTC",
    "sampling": "Bounded complete extraction; oversized windows rejected.",
    "obfuscation": "Google obfuscates identifiers and values; internal inconsistencies exist.",
}


class BigQueryAdapter:
    def __init__(self, client: Any = None):
        from google.cloud import bigquery

        project = os.environ.get("GOOGLE_CLOUD_PROJECT")
        if client is None and not project:
            raise ValueError("Owner Google Cloud project is required")
        self.client = client or bigquery.Client(project=project, location="US")
        self.sdk = bigquery
        self.cap = min(int(os.getenv("BIGQUERY_MAX_BYTES", "1000000000")), 1000000000)
        if self.cap <= 0:
            raise ValueError("Positive bytes cap required")

    def load(self, start: str, end: str) -> tuple[Analytics, dict[str, Any]]:
        validate_window(start, end, PUBLIC_SOURCE)
        params = [
            self.sdk.ScalarQueryParameter("start_suffix", "STRING", start.replace("-", "")),
            self.sdk.ScalarQueryParameter("end_suffix", "STRING", end.replace("-", "")),
        ]
        sql = (ROOT / "data/sql/bigquery_events.sql").read_text()
        dry_config = self.sdk.QueryJobConfig(dry_run=True, use_query_cache=False, query_parameters=params)
        dry = self.client.query(sql, job_config=dry_config, location="US")
        estimate = dry.total_bytes_processed
        if estimate is None:
            raise ValueError("Unknown dry-run estimate; query refused")
        if estimate > self.cap:
            raise ValueError("Query dry-run exceeds hard byte budget; narrow the window")
        config = self.sdk.QueryJobConfig(maximum_bytes_billed=self.cap, query_parameters=params, job_timeout_ms=20000)
        job = self.client.query(sql, job_config=config, location="US", timeout=25)
        rows = list(job.result(timeout=25, max_results=200001))
        if len(rows) > 200000:
            raise ValueError("Extract exceeds complete-row limit; narrow date range. No partial metrics published.")
        records = [
            {
                "event_id": r["event_id"],
                "event_name": r["event_name"],
                "event_timestamp": r["event_timestamp"],
                "user_pseudo_id": r["user_pseudo_id"],
                "event_params": {
                    "ga_session_id": r["ga_session_id"],
                    "source_medium": r["source_medium"],
                    "campaign": r["campaign"],
                    "currency": "USD",
                },
                "ecommerce": {"transaction_id": r["transaction_id"], "purchase_revenue_in_usd": r["purchase_revenue_in_usd"]},
            }
            for r in rows
        ]
        return Analytics(
            records,
            {
                **PUBLIC_SOURCE,
                "available_start": PUBLIC_SOURCE["start"],
                "available_end": PUBLIC_SOURCE["end"],
                "start": start,
                "end": end,
            },
        ), {
            "job_id": job.job_id,
            "dry_run_bytes": estimate,
            "maximum_bytes_billed": self.cap,
            "rows": len(rows),
            "actual_bytes_processed": getattr(job, "total_bytes_processed", None),
            "actual_bytes_billed": getattr(job, "total_bytes_billed", None),
            "cache_hit": getattr(job, "cache_hit", None),
            "cost_usd": None,
            "cost_note": "Billed bytes are measured; dollar cost depends on owner pricing, credits and billing mode.",
        }
