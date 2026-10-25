"""Owner-only token spend guard. No network calls are made by importing this file.

One persistent ledger covers the complete 48-request authorization, including
restarts. Never delete/reset it to retry a run. Unknown charges retain their
reservation and block further calls. Dollar figures are token-price calculations,
not provider invoices or protection against unrelated account traffic/taxes.
"""

from __future__ import annotations

import hashlib
import json
import os
import sqlite3
from datetime import date, datetime, timezone
from decimal import Decimal
from pathlib import Path
from typing import Any

MODEL = "gpt-5.4-mini"
RETURNED_MODELS = {MODEL, "gpt-5.4-mini-2026-03-17"}
PRICE_DATE = "2026-10-26"
PRICE_SOURCE = "https://developers.openai.com/api/docs/models/gpt-5.4-mini"
# Integer nano-USD per token: $0.75 / $0.075 / $4.50 per million.
INPUT, CACHED, OUTPUT = 750, 75, 4500
MAX_INPUT = 16000
MAX_OUTPUT = 2500
MAX_USD_NANO = 3_000_000_000
MAX_REQUESTS = 48


class SpendBlocked(ValueError):
    """Fail closed without exposing SDK exception text or credentials."""


def integer(value: Any) -> int:
    if type(value) is not int or value < 0:
        raise SpendBlocked("Missing or invalid token accounting")
    return value


def plain(value: Any) -> Any:
    return json.loads(json.dumps(value, default=lambda x: x.model_dump(mode="json")))


class SpendGuard:
    def __init__(self, path: Path, ceiling: int, prices_reviewed_on: str):
        if type(ceiling) is not int or not 0 < ceiling <= MAX_REQUESTS:
            raise SpendBlocked("Request limit must be 1..48")
        if prices_reviewed_on != PRICE_DATE or abs((date.today() - date.fromisoformat(PRICE_DATE)).days) > 1:
            raise SpendBlocked("Review current official prices and update the dated rate card before execution")
        self.path, self.ceiling = path, ceiling
        path.parent.mkdir(parents=True, exist_ok=True, mode=0o700)
        with self.connect() as db:
            db.execute(
                "CREATE TABLE IF NOT EXISTS requests (id INTEGER PRIMARY KEY, state TEXT NOT NULL, reserved INTEGER NOT NULL, charged INTEGER, receipt TEXT NOT NULL)"
            )
        path.chmod(0o600)
        self.calls = 0
        self.request_ids: list[int] = []
        self.tokens = 0
        self.usage_complete = True

    def connect(self) -> sqlite3.Connection:
        db = sqlite3.connect(self.path, timeout=5)
        db.execute("PRAGMA synchronous=FULL")
        return db

    def reserve(self, amount: int, receipt: dict) -> int:
        with self.connect() as db:
            db.execute("BEGIN IMMEDIATE")
            rows = db.execute("SELECT state, reserved, charged FROM requests").fetchall()
            if any(state != "settled" for state, _, _ in rows):
                raise SpendBlocked("Unresolved prior request; owner reconciliation required")
            if len(rows) >= self.ceiling or sum(charged for _, _, charged in rows) + amount > MAX_USD_NANO:
                raise SpendBlocked("Persistent request or USD authorization exhausted")
            cur = db.execute("INSERT INTO requests(state,reserved,receipt) VALUES ('pending',?,?)", (amount, json.dumps(receipt)))
            assert cur.lastrowid is not None
            return cur.lastrowid

    def update(self, request_id: int, state: str, receipt: dict, charged: int | None = None) -> None:
        with self.connect() as db:
            db.execute(
                "UPDATE requests SET state=?,charged=?,receipt=? WHERE id=?", (state, charged, json.dumps(receipt), request_id)
            )

    def request(self, client: Any, payload: dict) -> Any:
        with self.connect() as db:
            rows = db.execute("SELECT state FROM requests").fetchall()
        if len(rows) >= self.ceiling or any(r[0] != "settled" for r in rows):
            raise SpendBlocked("Prior authorization exhausted or unresolved; no network calls allowed")
        # Fixed vendor endpoint/tier, no SDK retries, no hosted tools or opaque history.
        if str(client.base_url) != "https://api.openai.com/v1/" or client.max_retries != 0:
            raise SpendBlocked("Use the standard OpenAI endpoint with automatic retries disabled")
        allowed = {"instructions", "input", "tools", "tool_choice", "parallel_tool_calls", "text", "max_output_tokens"}
        if set(payload) - allowed or any(tool.get("type") != "function" for tool in payload.get("tools", [])):
            raise SpendBlocked("Unsupported billable request features")
        output_limit = integer(payload.get("max_output_tokens"))
        if not 16 <= output_limit <= MAX_OUTPUT:
            raise SpendBlocked("Output limit exceeds authorization")
        body = plain(payload)
        for item in body.get("input", []):
            if item.get("type", "message") not in {"message", "function_call", "function_call_output"}:
                raise SpendBlocked("Only text and local function protocol supported")
            if "content" in item and not isinstance(item["content"], str):
                raise SpendBlocked("Only plain text input supported")
        counted = {k: v for k, v in body.items() if k != "max_output_tokens"}
        counted.update(model=MODEL, reasoning={"effort": "none"}, truncation="disabled")
        # Count schemas, instructions and function history as well as question text.
        try:
            count = integer(client.responses.input_tokens.count(**counted).input_tokens)
        except Exception:
            raise SpendBlocked("Exact token preflight failed; no generation submitted") from None
        if count > MAX_INPUT:
            raise SpendBlocked("Exact input count exceeds 16000-token limit")
        receipt = {
            "started_at": datetime.now(timezone.utc).isoformat(),
            "model_requested": MODEL,
            "price_verified_on": PRICE_DATE,
            "price_source": PRICE_SOURCE,
            "input_tokens_preflight": count,
            "max_output_tokens": output_limit,
            "request_sha256": hashlib.sha256(json.dumps(counted, sort_keys=True).encode()).hexdigest(),
        }
        reserved = count * INPUT + output_limit * OUTPUT
        request_id = self.reserve(reserved, receipt)
        receipt["ledger_request_id"] = request_id
        self.request_ids.append(request_id)
        self.calls += 1
        charged = None
        try:
            result = client.responses.create(**counted, max_output_tokens=output_limit, service_tier="default", store=False)
            # Only the synthetic evaluation payload/output is saved; never client config/headers.
            receipt["response"] = plain(result)
            usage = result.usage
            n_in, n_out, total = integer(usage.input_tokens), integer(usage.output_tokens), integer(usage.total_tokens)
            cached = integer(usage.input_tokens_details.cached_tokens)
            if (
                result.model not in RETURNED_MODELS
                or result.service_tier != "default"
                or total != n_in + n_out
                or n_in > count
                or n_out > output_limit
                or cached > n_in
                or getattr(usage.input_tokens_details, "cache_write_tokens", 0) != 0
            ):
                raise SpendBlocked("Unexpected model, tier or usage; retain reservation")
            charged = (n_in - cached) * INPUT + cached * CACHED + n_out * OUTPUT
            if charged > reserved:
                raise SpendBlocked("Usage exceeds reserved monetary bound")
            receipt["token_cost_usd"] = str(Decimal(charged) / Decimal(1_000_000_000))
            self.tokens += total
            self.update(request_id, "settled" if result.status == "completed" else "blocked", receipt, charged)
            if result.status != "completed":
                raise SpendBlocked("Incomplete response; stop for owner review")
            return result
        except BaseException:
            self.usage_complete = False
            receipt["error_code"] = "UNCONFIRMED_OR_INCOMPLETE_RESPONSE"
            # Retain the entire reservation even if submission timed out/interrupted.
            self.update(request_id, "blocked", receipt, charged)
            raise SpendBlocked("Response not fully confirmed; no further calls allowed") from None

    def report(self) -> dict:
        with self.connect() as db:
            rows = db.execute("SELECT state,reserved,charged,receipt FROM requests ORDER BY id").fetchall()
        return {
            "scope": "Cumulative owner verification authorization; model token costs only, not invoice totals",
            "max_requests": self.ceiling,
            "max_usd": 3,
            "cumulative_requests": len(rows),
            "known_token_cost_usd": str(Decimal(sum(r[2] or 0 for r in rows)) / Decimal(1_000_000_000)),
            "unresolved_reservation_usd": str(Decimal(sum(r[1] for r in rows if r[0] != "settled")) / Decimal(1_000_000_000)),
            "complete": all(r[0] == "settled" for r in rows),
            "requests": [{"state": r[0], **json.loads(r[3])} for r in rows],
        }


def load_owner_config(path: Path) -> None:
    """Read two data fields, never execute a shell file or print its values."""
    if not path.exists():
        return
    if path.stat().st_mode & 0o077:
        raise SpendBlocked("Owner config requires chmod 600")
    for line in path.read_text().splitlines():
        if not line.strip() or line.lstrip().startswith("#"):
            continue
        key, sep, value = line.partition("=")
        if not sep or key not in {"OPENAI_API_KEY", "OPENAI_MODEL"}:
            raise SpendBlocked("Unexpected owner config field")
        if value:
            os.environ.setdefault(key, value)
