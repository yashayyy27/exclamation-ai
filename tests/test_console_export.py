"""Export-path regressions use tiny invented rows, never masquerading as Google receipts."""

import json
from pathlib import Path
import pytest
from scripts.reconcile_bigquery_export import reconcile_export


def exports(tmp_path: Path) -> tuple[Path, Path]:
    rows = [
        {
            "event_id": f"invented-{i}", "event_name": name, "event_timestamp": str(1609459200000000 + i),
            "user_pseudo_id": "invented-user", "ga_session_id": "1", "source_medium": "example / test",
            "campaign": "invented", "transaction_id": "invented-tx" if name == "purchase" else None,
            "purchase_revenue_in_usd": "7.5" if name == "purchase" else None,
        }
        for i, name in enumerate(["session_start", "view_item", "purchase"])
    ]
    extract, oracle = tmp_path / "extract.json", tmp_path / "oracle.json"
    extract.write_text(json.dumps(rows))
    oracle.write_text(json.dumps([{
        "raw_events": "3", "clean_events": "3", "sessions": "1", "views": "1", "carts": "0",
        "checkouts": "0", "purchases": "0", "transactions": "1", "revenue_usd": "7.5",
    }]))
    return extract, oracle


def test_console_int64_and_money_reconcile_without_inventing_funnel_purchase(tmp_path):
    extract, oracle = exports(tmp_path)
    report = reconcile_export(extract, oracle, "2021-01-01", "2021-01-01")
    assert report["status"] == "EXPORT_RECONCILED"
    assert len(report["checks"]) == 9 and all(report["checks"].values())
    assert report["observed"]["purchases"] == 0 and report["observed"]["transactions"] == 1
    assert report["acquisition_groups"][0]["roas"] is None


def test_wrong_oracle_and_missing_money_fail_reconciliation(tmp_path):
    extract, oracle = exports(tmp_path)
    rows = json.loads(extract.read_text())
    rows[-1]["purchase_revenue_in_usd"] = None
    extract.write_text(json.dumps(rows))
    report = reconcile_export(extract, oracle, "2021-01-01", "2021-01-01")
    assert report["status"] == "RECONCILIATION_FAILED"
    assert report["observed"]["revenue_usd"] is None and not report["checks"]["revenue_usd"]
    rows[-1]["purchase_revenue_in_usd"] = "7.5"
    extract.write_text(json.dumps(rows))
    expected = json.loads(oracle.read_text())
    expected[0]["views"] = "0"
    oracle.write_text(json.dumps(expected))
    assert not reconcile_export(extract, oracle, "2021-01-01", "2021-01-01")["checks"]["views"]


@pytest.mark.parametrize("change,match", [("partial", "row count"), ("date", "UTC window"), ("fraction", "integral")])
def test_partial_or_wrong_scope_or_fractional_ids_are_refused(tmp_path, change, match):
    extract, oracle = exports(tmp_path)
    rows = json.loads(extract.read_text())
    if change == "partial":
        rows.pop()
    elif change == "date":
        rows[0]["event_timestamp"] = "1609545600000000"
    else:
        rows[0]["ga_session_id"] = 1.5
    extract.write_text(json.dumps(rows))
    with pytest.raises(ValueError, match=match):
        reconcile_export(extract, oracle, "2021-01-01", "2021-01-01")
