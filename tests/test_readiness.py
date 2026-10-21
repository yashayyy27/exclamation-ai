"""Adversarial regressions and independent marketing arithmetic."""

import copy
import json
from types import SimpleNamespace
import pytest
from fastapi.testclient import TestClient
from services.api.agent import FixtureProvider, OpenAIProvider, ask, run_tool, validate_decision
from services.api.analytics import Analytics, ROOT
from services.api.main import app, limits
from services.api.marketing import attribution_demo, wilson
from services.api.models import AskRequest, Metric, ModelDecision
from evals.heldout import grade


def test_near_equal_duplicate_cannot_replace_missing_metric():
    a = Analytics()
    evidence = run_tool("get_funnel", a.snapshot(), a)
    decision, _ = FixtureProvider().decide("get_funnel", evidence, "v2")
    forged = decision.model_dump()
    forged["evidence"][1] = copy.deepcopy(forged["evidence"][0])
    forged["evidence"][1]["value"] += 0.00001
    with pytest.raises(ValueError, match="identit"):
        validate_decision(ModelDecision.model_validate(forged), evidence, "get_funnel")


@pytest.mark.parametrize("value", [float("nan"), float("inf"), -float("inf")])
def test_nonfinite_metrics_rejected(value):
    with pytest.raises(ValueError):
        Metric(
            metric="revenue", value=value, unit="USD", source_id="test", query_id="test", date_range=["2021-01-01", "2021-01-14"]
        )


def test_empty_period_never_substitutes_revenue_for_conversion():
    records = json.loads((ROOT / "data/fixtures/events.json").read_text())
    records = [r for r in records if r["event_timestamp"] >= 1610064000000000]
    ans = ask(AskRequest(question="Compare periods"), analytics=Analytics(records))
    assert ans.status == "REVIEW_REQUIRED" and not ans.supporting_metrics


def test_input_fingerprint_changes_lineage_without_changing_counts():
    a = Analytics()
    records = copy.deepcopy(a.records)
    records[0]["event_params"]["campaign"] = "different"
    b = Analytics(records)
    assert a.snapshot()["metrics"][0]["value"] == b.snapshot()["metrics"][0]["value"]
    assert a.snapshot()["query_id"] != b.snapshot()["query_id"]
    assert (
        run_tool("get_data_quality", a.snapshot(), a)["metrics"][0]["query_id"]
        != run_tool("get_data_quality", b.snapshot(), b)["metrics"][0]["query_id"]
    )


def test_source_fallback_fails_closed():
    ans = ask(AskRequest(question="Show funnel", source="bigquery"))
    assert ans.status == "REVIEW_REQUIRED" and ans.supporting_metrics == []


def test_invalid_nested_dimension_is_quarantined():
    record = copy.deepcopy(Analytics().records[0])
    record["event_params"]["source_medium"] = {"instruction": "bad"}
    assert Analytics([record]).quality()["schema_mismatches"] == 1


@pytest.mark.parametrize("tx", ["", " ", "(not set)"])
def test_invalid_transaction_does_not_count_as_purchase(tx):
    records = copy.deepcopy(Analytics().records)
    next(r for r in records if r["event_name"] == "purchase")["ecommerce"]["transaction_id"] = tx
    s = Analytics(records).snapshot()
    assert next(m["value"] for m in s["metrics"] if m["metric"] == "purchases") == 62
    assert s["transactions"] == 62


def test_marketing_denominators_ranking_and_uncertainty():
    s = Analytics().snapshot()
    assert s["priorities"][0] == {
        "from": "Product views",
        "to": "Add to cart",
        "entrants": 336,
        "lost": 144,
        "loss_pct": 42.86,
        "score": 61.71,
    }
    assert max(s["priorities"], key=lambda r: r["loss_pct"])["to"] == "Purchase"
    assert sum(c["sessions"] for c in s["campaigns"]) == 420
    assert sum(c["purchases"] for c in s["campaigns"]) == 63
    assert len({c["campaign"] for c in s["campaigns"]}) == 1
    assert all(c["spend_usd"] is None and c["roas"] is None for c in s["campaigns"])
    assert wilson(0, 0) is None and wilson(0, 10)[0] == 0
    assert wilson(5, 10)[0] < 50 < wilson(5, 10)[1]


def test_attribution_rules_conserve_only_invented_revenue():
    demo = attribution_demo()
    assert sum(j["revenue_usd"] for j in demo["journeys"]) == 150
    for credit in demo["credits_usd"].values():
        assert sum(credit.values()) == 150
    assert demo["credits_usd"]["first"]["email"] == 100
    assert demo["credits_usd"]["last"]["organic"] == 150
    assert demo["credits_usd"]["linear"]["email"] == 50


def test_token_unknown_is_not_zero_and_model_has_real_choice(monkeypatch):
    monkeypatch.setenv("OPENAI_MODEL", "mock-only")
    requests = []

    class Responses:
        def create(self, **kwargs):
            requests.append(kwargs)
            return SimpleNamespace(
                output=[SimpleNamespace(type="function_call", name="abstain", arguments="{}", call_id="mock")], usage=None
            )

    p = OpenAIProvider(SimpleNamespace(responses=Responses()))
    assert p.select("Calculate ROAS") is None
    assert len(requests[0]["tools"]) == 7
    assert requests[0]["tool_choice"] == "required"
    assert requests[0]["input"][0]["content"] == "Calculate ROAS"
    assert not p.usage_complete


def test_paid_calls_require_separate_explicit_opt_in(monkeypatch):
    monkeypatch.setenv("API_ACCESS_TOKEN", "test-token")
    monkeypatch.delenv("OWNER_ALLOW_PAID_CALLS", raising=False)
    limits.clear()
    client = TestClient(app)
    response = client.post(
        "/ask", json={"question": "Show funnel", "provider": "openai"}, headers={"Authorization": "Bearer test-token"}
    )
    assert response.status_code == 403 and "opt-in" in response.text


def test_independent_oracle_detects_self_consistent_wrong_number():
    a = Analytics()
    e = run_tool("get_funnel", a.snapshot(), a)
    e["metrics"][0]["value"] = 421
    decision, _ = FixtureProvider().decide("get_funnel", e, "v2")
    scores = grade({"tool": "get_funnel", "category": "numerical"}, "get_funnel", decision, e)
    assert scores["evidence_grounding"] is True
    assert scores["numerical_accuracy"] is False


def test_bigquery_receipt_uses_extracted_scope_and_unknown_estimate_fails():
    from services.api.bigquery import BigQueryAdapter

    class Client:
        def __init__(self, estimate):
            self.estimate = estimate
            self.calls = 0

        def query(self, sql, job_config, **kwargs):
            self.calls += 1
            return (
                SimpleNamespace(total_bytes_processed=self.estimate)
                if job_config.dry_run
                else SimpleNamespace(
                    job_id="mock-scope-only",
                    result=lambda **kwargs: [],
                    total_bytes_processed=12,
                    total_bytes_billed=10000000,
                    cache_hit=False,
                )
            )

    unknown = Client(None)
    with pytest.raises(ValueError, match="Unknown"):
        BigQueryAdapter(unknown).load("2021-01-01", "2021-01-01")
    assert unknown.calls == 1
    a, receipt = BigQueryAdapter(Client(12)).load("2021-01-01", "2021-01-01")
    assert a.source["start"] == a.source["end"] == "2021-01-01"
    assert a.source["available_start"] == "2020-11-01"
    assert receipt["actual_bytes_billed"] == 10000000 and receipt["cost_usd"] is None
    assert a.snapshot("2021-01-01", "2021-01-01")["funnel"][0]["rate"] is None


def test_model_unregistered_tool_never_executes(monkeypatch):
    monkeypatch.setenv("OPENAI_MODEL", "mock-only")

    class Responses:
        def create(self, **kwargs):
            return SimpleNamespace(
                output=[SimpleNamespace(type="function_call", name="execute_sql", arguments="{}")],
                usage=SimpleNamespace(total_tokens=10),
            )

    provider = OpenAIProvider(SimpleNamespace(responses=Responses()))
    with pytest.raises(ValueError, match="unapproved"):
        provider.select("Show funnel")
    assert provider.calls == 1


def test_larger_complete_extract_reconciles_with_indexed_session_lookup():
    records = []
    seed = Analytics().records
    for i in range(24):
        for original in seed:
            e = copy.deepcopy(original)
            e["event_id"] = f"batch-{i}-{e['event_id']}"
            if e.get("user_pseudo_id") is not None:
                e["user_pseudo_id"] = f"batch-{i}-{e['user_pseudo_id']}"
            if e["ecommerce"].get("transaction_id"):
                e["ecommerce"]["transaction_id"] = f"batch-{i}-{e['ecommerce']['transaction_id']}"
            records.append(e)
    a = Analytics(records)
    s = a.snapshot()
    assert [f["value"] for f in s["funnel"]] == [10080, 8064, 4608, 3336, 1512]
    assert next(m["value"] for m in s["metrics"] if m["metric"] == "revenue") == 120960
    plan = a.rows(
        "EXPLAIN QUERY PLAN SELECT MIN(ts) FROM events WHERE session_key=? AND name=? AND ts>=?", ("example", "view_item", 0)
    )
    assert any("USING COVERING INDEX" in row["detail"] for row in plan)
