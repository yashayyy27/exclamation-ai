-- Read-only date-boundary audit: distinguish daily table suffixes from UTC dates.
-- Bind a one-day requested window. Scan its adjacent partitions for spillover.
SELECT _TABLE_SUFFIX AS table_suffix,
 COUNT(*) AS partition_events,
 COUNTIF(DATE(TIMESTAMP_MICROS(event_timestamp), 'UTC') BETWEEN
   PARSE_DATE('%Y%m%d', @start_suffix) AND PARSE_DATE('%Y%m%d', @end_suffix)) AS events_in_requested_utc_window,
 MIN(TIMESTAMP_MICROS(event_timestamp)) AS first_event_utc,
 MAX(TIMESTAMP_MICROS(event_timestamp)) AS last_event_utc
FROM `bigquery-public-data.ga4_obfuscated_sample_ecommerce.events_*`
WHERE _TABLE_SUFFIX BETWEEN
 FORMAT_DATE('%Y%m%d', DATE_SUB(PARSE_DATE('%Y%m%d', @start_suffix), INTERVAL 1 DAY)) AND
 FORMAT_DATE('%Y%m%d', DATE_ADD(PARSE_DATE('%Y%m%d', @end_suffix), INTERVAL 1 DAY))
GROUP BY table_suffix
ORDER BY table_suffix
