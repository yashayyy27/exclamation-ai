-- Independent GoogleSQL aggregate oracle. Same extract definition, separate engine.
WITH raw AS (
 SELECT TO_HEX(SHA256(TO_JSON_STRING(STRUCT(event_timestamp,event_name,user_pseudo_id,event_bundle_sequence_id,event_params,ecommerce)))) event_id,
 event_name name, event_timestamp ts, user_pseudo_id,
 (SELECT value.int_value FROM UNNEST(event_params) WHERE key='ga_session_id' LIMIT 1) sid,
 ecommerce.transaction_id tx, ecommerce.purchase_revenue_in_usd revenue
 FROM `bigquery-public-data.ga4_obfuscated_sample_ecommerce.events_*`
 WHERE _TABLE_SUFFIX BETWEEN @start_suffix AND @end_suffix
 AND DATE(TIMESTAMP_MICROS(event_timestamp), 'UTC') BETWEEN PARSE_DATE('%Y%m%d', @start_suffix) AND PARSE_DATE('%Y%m%d', @end_suffix)
), dedup AS (SELECT * FROM raw QUALIFY ROW_NUMBER() OVER(PARTITION BY event_id ORDER BY ts)=1),
 clean AS (SELECT *, CONCAT(user_pseudo_id, ':', CAST(sid AS STRING)) sk FROM dedup WHERE user_pseudo_id IS NOT NULL AND sid IS NOT NULL AND ts>0 AND COALESCE(revenue,0)>=0),
 starts AS (SELECT sk, MIN(ts) started FROM clean WHERE name='session_start' GROUP BY sk),
 views AS (SELECT s.*, MIN(e.ts) viewed FROM starts s LEFT JOIN clean e ON e.sk=s.sk AND e.name='view_item' AND e.ts>=s.started GROUP BY s.sk,s.started),
 carts AS (SELECT v.*, MIN(e.ts) carted FROM views v LEFT JOIN clean e ON e.sk=v.sk AND e.name='add_to_cart' AND e.ts>=v.viewed GROUP BY v.sk,v.started,v.viewed),
 checks AS (SELECT c.*, MIN(e.ts) checked FROM carts c LEFT JOIN clean e ON e.sk=c.sk AND e.name='begin_checkout' AND e.ts>=c.carted GROUP BY c.sk,c.started,c.viewed,c.carted),
 funnel AS (SELECT c.*, MIN(e.ts) purchased FROM checks c LEFT JOIN clean e ON e.sk=c.sk AND e.name='purchase' AND e.ts>=c.checked AND TRIM(COALESCE(e.tx,'')) NOT IN ('','(not set)') GROUP BY c.sk,c.started,c.viewed,c.carted,c.checked),
 tx AS (SELECT tx, MIN(sk) sk, MAX(COALESCE(revenue,0)) revenue FROM clean WHERE name='purchase' AND TRIM(COALESCE(tx,'')) NOT IN ('','(not set)') GROUP BY tx)
SELECT (SELECT COUNT(*) FROM raw) raw_events, (SELECT COUNT(*) FROM clean) clean_events,
 COUNT(*) sessions, COUNTIF(viewed IS NOT NULL) views, COUNTIF(carted IS NOT NULL) carts,
 COUNTIF(checked IS NOT NULL) checkouts, COUNTIF(purchased IS NOT NULL) purchases,
 (SELECT COUNT(*) FROM tx JOIN starts USING(sk)) transactions,
 (SELECT SUM(revenue) FROM tx JOIN starts USING(sk)) revenue_usd
FROM funnel
