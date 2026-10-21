from __future__ import annotations
import hmac
import logging
import os
import time
from collections import defaultdict, deque
from typing import Annotated
from fastapi import Depends, FastAPI, Header, HTTPException, Query, Request
from fastapi.middleware.cors import CORSMiddleware
from services.api.agent import ask
from services.api.analytics import Analytics
from services.api.models import AskRequest

audit = logging.getLogger("exclamation.audit")
audit.setLevel(logging.INFO)
if not audit.handlers:
    audit.addHandler(logging.StreamHandler())
audit.propagate = False

app = FastAPI(title="! — Marketing Intelligence", version="0.1.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://127.0.0.1:5173", "http://localhost:5173"],
    allow_methods=["GET", "POST"],
    allow_headers=["Authorization", "Content-Type"],
)
limits: dict[str, deque] = defaultdict(deque)


def protect(request: Request, authorization: Annotated[str | None, Header()] = None) -> None:
    host = request.client.host if request.client else "unknown"
    now = time.monotonic()
    q = limits[host]
    while q and q[0] < now - 60:
        q.popleft()
    if len(q) >= 20:
        raise HTTPException(429, "Rate limit: 20 requests per minute")
    q.append(now)
    token = os.getenv("API_ACCESS_TOKEN")
    if token and not hmac.compare_digest(authorization or "", "Bearer " + token):
        raise HTTPException(401, "Valid API access token required")


def require_paid_opt_in() -> None:
    if os.getenv("OWNER_ALLOW_PAID_CALLS") != "1":
        raise HTTPException(403, "Owner paid-call opt-in is disabled")


@app.get("/health")
def health() -> dict:
    return {
        "status": "ok",
        "default_source": "fixture",
        "default_provider": "fixture",
        "bigquery_configured": bool(os.getenv("GOOGLE_CLOUD_PROJECT")),
        "openai_configured": bool(os.getenv("OPENAI_API_KEY") and os.getenv("OPENAI_MODEL")),
    }


@app.get("/analytics", dependencies=[Depends(protect)])
def analytics(
    start: str = "2021-01-01",
    end: str = "2021-01-14",
    channel: str = "all",
    source: str = Query("fixture", pattern="^(fixture|bigquery)$"),
) -> dict:
    try:
        if source == "bigquery":
            if not os.getenv("API_ACCESS_TOKEN"):
                raise HTTPException(403, "External queries require configured API_ACCESS_TOKEN")
            require_paid_opt_in()
            from services.api.bigquery import BigQueryAdapter

            a, audit = BigQueryAdapter().load(start, end)
            return {**a.snapshot(start, end, channel), "query_audit": audit}
        return Analytics().snapshot(start, end, channel)
    except ValueError as exc:
        raise HTTPException(422, str(exc)) from exc
    except HTTPException:
        raise
    except Exception as exc:
        raise HTTPException(503, "External source unavailable; inspect local credentials and narrow date range") from exc


@app.post("/ask", dependencies=[Depends(protect)])
def ask_route(req: AskRequest) -> dict:
    if (req.provider == "openai" or req.source == "bigquery") and not os.getenv("API_ACCESS_TOKEN"):
        raise HTTPException(403, "Paid/external integrations require server access token")
    if req.provider == "openai" or req.source == "bigquery":
        require_paid_opt_in()
    a = None
    if req.source == "bigquery":
        try:
            from services.api.bigquery import BigQueryAdapter

            a, _ = BigQueryAdapter().load(req.start, req.end)
        except Exception as exc:
            raise HTTPException(503, "BigQuery unavailable; no source fallback performed") from exc
    return ask(req, analytics=a).model_dump()
