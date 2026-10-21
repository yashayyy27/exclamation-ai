-- Closed ordered funnel, one session key; each step must follow its predecessor.
WITH starts AS (
 SELECT session_key, MIN(ts) AS started, MIN(day) AS day,
 MAX(channel) AS channel, MAX(campaign) AS campaign
 FROM events WHERE name = 'session_start' GROUP BY session_key
), views AS (
 SELECT s.*, (SELECT MIN(ts) FROM events e WHERE e.session_key=s.session_key
 AND name='view_item' AND ts>=s.started) AS viewed FROM starts s
), carts AS (
 SELECT v.*, (SELECT MIN(ts) FROM events e WHERE e.session_key=v.session_key
 AND name='add_to_cart' AND ts>=v.viewed) AS carted FROM views v
), checkouts AS (
 SELECT c.*, (SELECT MIN(ts) FROM events e WHERE e.session_key=c.session_key
 AND name='begin_checkout' AND ts>=c.carted) AS checked FROM carts c
)
SELECT c.*, (SELECT MIN(ts) FROM events e WHERE e.session_key=c.session_key
 AND name='purchase' AND ts>=c.checked AND transaction_id IS NOT NULL) AS purchased
FROM checkouts c;
