"""Offline adversarial spend controls, not measured vendor/model results."""

from datetime import date
from types import SimpleNamespace as NS

import pytest

from evals import spend


class Response:
    model = "gpt-5.4-mini-2026-03-17"
    service_tier = "default"
    status = "completed"

    def __init__(self):
        self.usage = NS(input_tokens=100, output_tokens=50, total_tokens=150, input_tokens_details=NS(cached_tokens=20))

    def model_dump(self, **_):
        return {"model": self.model, "status": self.status, "output": [{"text": "offline fixture"}]}


class Client:
    base_url = "https://api.openai.com/v1/"
    max_retries = 0

    def __init__(self):
        self.responses = self
        self.input_tokens = self
        self.count_calls, self.create_calls = [], []
        self.count_value = 100
        self.response = Response()
        self.error = False

    def count(self, **kwargs):
        self.count_calls.append(kwargs)
        return NS(input_tokens=self.count_value)

    def create(self, **kwargs):
        self.create_calls.append(kwargs)
        if self.error:
            raise TimeoutError("fixture only; no network")
        return self.response


@pytest.fixture
def setup(tmp_path, monkeypatch):
    monkeypatch.setattr(spend, "PRICE_DATE", date.today().isoformat())
    return spend.SpendGuard(tmp_path / "guard.sqlite3", 48, spend.PRICE_DATE), Client()


def body():
    return {
        "input": [{"role": "user", "content": "Synthetic funnel?"}],
        "instructions": "Copy evidence",
        "max_output_tokens": 800,
        "tools": [{"type": "function", "name": "get_funnel"}],
        "tool_choice": "required",
    }


def test_exact_payload_count_reservation_and_measured_token_cost(setup):
    guard, client = setup
    guard.request(client, body())
    counted = client.count_calls[0]
    generated = client.create_calls[0]
    assert {k: v for k, v in generated.items() if k not in {"max_output_tokens", "service_tier", "store"}} == counted
    assert generated["model"] == spend.MODEL and generated["service_tier"] == "default"
    assert generated["store"] is False
    report = guard.report()
    assert report["known_token_cost_usd"] == "0.0002865"
    assert report["unresolved_reservation_usd"] == "0"
    assert report["complete"] and guard.tokens == 150
    assert report["requests"][0]["response"]["output"][0]["text"] == "offline fixture"


def test_timeout_reservation_survives_restart_and_prevents_all_later_network(setup):
    guard, client = setup
    client.error = True
    with pytest.raises(spend.SpendBlocked):
        guard.request(client, body())
    resumed = spend.SpendGuard(guard.path, 48, spend.PRICE_DATE)
    client.error = False
    with pytest.raises(spend.SpendBlocked):
        resumed.request(client, body())
    assert len(client.create_calls) == len(client.count_calls) == 1
    assert not resumed.report()["complete"]
    assert resumed.report()["unresolved_reservation_usd"] == "0.003675"


def test_pending_reservation_blocks_competing_instance(setup):
    guard, client = setup
    guard.reserve(100, {"fixture": True})
    competing = spend.SpendGuard(guard.path, 48, spend.PRICE_DATE)
    with pytest.raises(spend.SpendBlocked):
        competing.request(client, body())
    assert not client.count_calls and not client.create_calls


def test_persistent_request_ceiling_cannot_reset_on_restart(setup):
    guard, client = setup
    guard.ceiling = 1
    guard.request(client, body())
    resumed = spend.SpendGuard(guard.path, 1, spend.PRICE_DATE)
    with pytest.raises(spend.SpendBlocked):
        resumed.request(client, body())
    assert len(client.create_calls) == 1


def test_dollar_limit_admission_is_atomic_and_rejects_before_generation(setup):
    guard, _ = setup
    rid = guard.reserve(spend.MAX_USD_NANO - 1, {})
    guard.update(rid, "settled", {}, spend.MAX_USD_NANO - 1)
    with pytest.raises(spend.SpendBlocked):
        guard.reserve(2, {})
    assert guard.report()["cumulative_requests"] == 1


@pytest.mark.parametrize("field,value", [("model", "other-model"), ("service_tier", "priority"), ("status", "incomplete")])
def test_unexpected_response_blocks_further_calls(setup, field, value):
    guard, client = setup
    setattr(client.response, field, value)
    with pytest.raises(spend.SpendBlocked):
        guard.request(client, body())
    with pytest.raises(spend.SpendBlocked):
        guard.request(client, body())
    assert len(client.create_calls) == 1 and not guard.report()["complete"]


@pytest.mark.parametrize(
    "field,value", [("input_tokens", 101), ("output_tokens", 801), ("total_tokens", 151), ("input_tokens", None)]
)
def test_unknown_or_excess_usage_keeps_reservation(setup, field, value):
    guard, client = setup
    setattr(client.response.usage, field, value)
    with pytest.raises(spend.SpendBlocked):
        guard.request(client, body())
    assert guard.report()["unresolved_reservation_usd"] == "0.003675"


@pytest.mark.parametrize("change", ["endpoint", "retry", "hosted_tool", "extra_field", "oversize_output", "image"])
def test_unsupported_billable_features_rejected_before_network(setup, change):
    guard, client = setup
    payload = body()
    if change == "endpoint":
        client.base_url = "https://example.invalid/"
    if change == "retry":
        client.max_retries = 1
    if change == "hosted_tool":
        payload["tools"] = [{"type": "web_search"}]
    if change == "extra_field":
        payload["background"] = True
    if change == "oversize_output":
        payload["max_output_tokens"] = 2501
    if change == "image":
        payload["input"] = [{"role": "user", "content": [{"type": "input_image"}]}]
    with pytest.raises(spend.SpendBlocked):
        guard.request(client, payload)
    assert not client.count_calls and not client.create_calls


def test_oversize_exact_input_blocks_generation(setup):
    guard, client = setup
    client.count_value = 16001
    with pytest.raises(spend.SpendBlocked):
        guard.request(client, body())
    assert len(client.count_calls) == 1 and not client.create_calls


def test_stale_prices_and_excess_request_authorization_fail_closed(tmp_path):
    with pytest.raises(spend.SpendBlocked):
        spend.SpendGuard(tmp_path / "x", 48, "2000-01-01")
    with pytest.raises(spend.SpendBlocked):
        spend.SpendGuard(tmp_path / "x", 49, spend.PRICE_DATE)


def test_owner_config_is_data_not_shell_and_not_printed(tmp_path, monkeypatch, capsys):
    monkeypatch.delenv("OPENAI_API_KEY", raising=False)
    p = tmp_path / ".env.owner"
    p.write_text("OPENAI_API_KEY=offline-value\nOPENAI_MODEL=gpt-5.4-mini\n")
    p.chmod(0o600)
    spend.load_owner_config(p)
    assert capsys.readouterr().out == ""
    p.write_text("echo execute-shell-code\n")
    with pytest.raises(spend.SpendBlocked):
        spend.load_owner_config(p)
