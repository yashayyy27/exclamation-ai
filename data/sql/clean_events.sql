-- Grain: one event fingerprint. Currency USD; event timestamps UTC.
WITH ranked AS (
 SELECT *, ROW_NUMBER() OVER(PARTITION BY event_id ORDER BY ts) AS duplicate_rank
 FROM raw_events
)
SELECT event_id, name, ts, date(ts, 'unixepoch') AS day, user_id,
 user_id || ':' || session_id AS session_key, channel, campaign, currency,
 transaction_id, revenue
FROM ranked
WHERE duplicate_rank = 1 AND user_id IS NOT NULL AND session_id IS NOT NULL
 AND ts > 0 AND revenue >= 0 AND currency = 'USD';
