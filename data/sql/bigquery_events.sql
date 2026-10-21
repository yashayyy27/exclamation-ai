-- Fixed public table; no user-provided identifiers. USD revenue, UTC date.
-- Limit +1 allows the adapter to reject incomplete extracts, never silently sample.
SELECT TO_HEX(SHA256(TO_JSON_STRING(STRUCT(event_timestamp,event_name,user_pseudo_id,event_bundle_sequence_id,event_params,ecommerce)))) AS event_id,
 event_name, event_timestamp, user_pseudo_id,
 (SELECT value.int_value FROM UNNEST(event_params) WHERE key='ga_session_id' LIMIT 1) AS ga_session_id,
 CONCAT(COALESCE(traffic_source.source,'(unknown)'), ' / ', COALESCE(traffic_source.medium,'(unknown)')) AS source_medium,
 traffic_source.name AS campaign,
 ecommerce.transaction_id, ecommerce.purchase_revenue_in_usd
FROM `bigquery-public-data.ga4_obfuscated_sample_ecommerce.events_*`
WHERE _TABLE_SUFFIX BETWEEN @start_suffix AND @end_suffix
AND DATE(TIMESTAMP_MICROS(event_timestamp), 'UTC') BETWEEN PARSE_DATE('%Y%m%d', @start_suffix) AND PARSE_DATE('%Y%m%d', @end_suffix)
ORDER BY event_timestamp, event_id
LIMIT 200001
