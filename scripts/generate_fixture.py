"""Deterministic invented events for reproducible engineering tests, never observed users."""

import json
from datetime import datetime, timedelta, timezone
from pathlib import Path

root = Path(__file__).resolve().parents[1]
events = []
for i in range(420):
    day = i % 14
    stamp = datetime(2021, 1, 1, tzinfo=timezone.utc) + timedelta(days=day, hours=i % 20)
    channel = ["google / organic", "newsletter / email", "google / cpc"][i % 3]
    steps = ["session_start"]
    if i % 10 < 8:
        steps += ["view_item"]
        if i % 7 < 4:
            steps += ["add_to_cart"]
            if i % 11 < 8:
                steps += ["begin_checkout"]
                if i % 13 < (4 if i % 3 == 2 else 7):
                    steps += ["purchase"]
    for n, name in enumerate(steps):
        events.append(
            {
                "event_id": f"e-{i}-{n}",
                "event_name": name,
                "event_timestamp": int((stamp + timedelta(minutes=n)).timestamp() * 1000000),
                "user_pseudo_id": f"synthetic-{i}",
                "event_params": {
                    "ga_session_id": i + 1,
                    "source_medium": channel,
                    "campaign": "fixture-winter",
                    "currency": "USD",
                },
                "ecommerce": {
                    "transaction_id": f"fixture-t-{i}" if name == "purchase" else None,
                    "purchase_revenue_in_usd": 80.0 if name == "purchase" else 0.0,
                },
            }
        )
# Deliberate messy records: test deduplication and exclusion, visible in QA.
events.extend([events[0].copy(), events[1].copy()])
events += [
    {
        "event_id": "bad-null",
        "event_name": "purchase",
        "event_timestamp": 1609459200000000,
        "user_pseudo_id": None,
        "event_params": {"ga_session_id": None, "source_medium": None, "currency": "USD"},
        "ecommerce": {"transaction_id": "bad", "purchase_revenue_in_usd": -10},
    }
]
(root / "data/fixtures/events.json").write_text(json.dumps(events, indent=2) + "\n")
print(f"Wrote {len(events)} synthetic raw events")
