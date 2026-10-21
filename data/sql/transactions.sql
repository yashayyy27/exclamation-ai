-- Grain: one transaction ID; duplicate purchase records cannot inflate revenue.
SELECT transaction_id, MIN(session_key) AS session_key, MIN(ts) AS ts,
 MIN(day) AS day, MAX(revenue) AS revenue
FROM events WHERE name='purchase' AND transaction_id IS NOT NULL
GROUP BY transaction_id;
