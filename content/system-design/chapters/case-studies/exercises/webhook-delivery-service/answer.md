# Model answer

This is one strong answer, not the only one. Notice how much of it is about endpoints that misbehave.

## Requirements

**Functional**

1. Customers register endpoints and choose event types for each.
2. Every event reaches every subscribed endpoint, signed.
3. Failed deliveries retry with backoff for up to three days.
4. Endpoints that keep failing are disabled and their owners told.
5. Customers can replay one event or a time range, and see a dashboard per endpoint.

**Non-functional**

- **At-least-once delivery**: no event is silently dropped. Duplicates are possible and documented.
- **Isolation**: a slow or dead endpoint never delays healthy endpoints, and one tenant's burst never delays other tenants.
- **Latency**: healthy endpoints get events within a few seconds, p99.
- **Security**: deliveries are signed, and the sender can't be tricked into calling internal addresses.

The hardest part: keeping delivery fast for healthy endpoints while thousands of others are slow, failing, or down for days.

## Estimates

```text
Deliveries: 50M events x 3 endpoints = 150M/day = ~1,700/s average, ~9,000/s peak
Retries: if 5% fail and average 4 more tries, about +30M attempts/day
In flight: 9,000/s x 0.3 s typical response = ~2,700 concurrent requests
Slow endpoints: 1% of traffic at a 20 s timeout = 90/s x 20 s = ~1,800 more in flight
Event storage for replay: 50M x 2 KB = 100 GB/day, x 30 days = 3 TB
```

What they decide: the senders need thousands of concurrent outbound connections, so they're async I/O workers, not one thread per request. And just 1 percent of traffic going to slow endpoints nearly doubles the connections in flight, which is why slow endpoints need their own lane.

## API

```text
POST   /v1/webhook-endpoints               { url, event_types } -> Endpoint with signing secret
PATCH  /v1/webhook-endpoints/{id}          change url, event types, or enable again
POST   /v1/webhook-endpoints/{id}/rotate-secret
GET    /v1/webhook-endpoints/{id}/deliveries?status=..&cursor=..
POST   /v1/webhook-endpoints/{id}/replays  { event_id } or { from, to }
```

Each delivery carries `webhook-id` (the event id, the same on every retry and replay), `webhook-timestamp`, and `webhook-signature`, an HMAC-SHA256 over id, timestamp, and body with the endpoint's secret.

## High-level design

1. **Event intake**: producers write events through a transactional outbox into a Kafka topic, keyed by tenant. Every event is also stored by id, in DynamoDB with the body in S3 for large ones, and kept 30 days for replay.
2. **Fan-out workers** consume the topic, look up the subscribed endpoints from a cached subscription table, and create one **delivery** per endpoint: event id, endpoint id, attempt count, status, and next attempt time. Creating deliveries is idempotent, keyed by event id and endpoint id, so a redelivered event doesn't fan out twice.
3. **Per-endpoint queues**: the deliveries table, keyed by endpoint, is the source of truth. A due index, a Redis sorted set of endpoint ids scored by each endpoint's earliest next attempt, tells dispatchers which endpoints have work.
4. **Dispatchers** pop due endpoints and send up to that endpoint's concurrency cap, like 5 at once, so no single endpoint can hold many workers. Requests go out through an egress proxy that blocks private and metadata addresses, from published static IPs.
5. **Outcome handling** records each attempt (status code, latency, short error), updates the delivery, and schedules the next try or marks it done.
6. **Endpoint health** keeps rolling success rates and latency per endpoint and drives the slow lane, disabling, and the dashboard.

## Deep dives

### Isolation from bad endpoints

Per-endpoint concurrency caps stop one endpoint from using all the workers. On top of that, endpoints whose recent latency is high or that keep timing out move to a **slow lane**, a separate dispatcher pool with its own capacity. Healthy endpoints never wait behind them. An endpoint moves back once it answers quickly again.

Fairness across tenants comes from the dispatcher choosing due endpoints round-robin by tenant, plus a cap on in-flight deliveries per tenant. A tenant whose own system emits a burst of a million events slows only its own deliveries.

### Retries and disabling

| Response | Action |
|---|---|
| 2xx within the timeout | Success |
| 410 Gone | Disable the endpoint now |
| 429 or 503 with Retry-After | Wait at least that long |
| Other 4xx, 5xx, timeout, or redirect | Retry on the schedule |

The schedule backs off over about three days, for example 5 seconds, 5 minutes, 30 minutes, 2 hours, 5 hours, 10 hours, 14 hours, 20 hours, and 24 hours, each with jitter. A request timeout of 15 to 30 seconds gives slow handlers a fair chance.

When an endpoint has failed every attempt for several days, it's disabled and the owner gets an email and a dashboard notice. Undelivered events stay stored, so after the fix the owner can enable the endpoint and replay the gap.

### Ordering

By default there's no ordering promise, which is what most webhook senders do. Retries and parallel sends mean a later event can arrive first. Each payload includes the resource's version and the event time, and payloads are thin, so handlers can ignore stale events or fetch the current state.

Endpoints can opt in to **ordered delivery**: concurrency drops to one, and the next event waits until the current one succeeds or exhausts its retries. That's head-of-line blocking, so a single bad event can hold up the endpoint for days. The trade is documented, and an ordered endpoint that's stuck shows clearly on the dashboard.

### Signing and secrets

Each endpoint has its own secret. Rotation keeps the old secret valid for a window, during which every delivery carries two signatures, so customers can switch with no downtime. Customers are told to verify the raw body, compare in constant time, reject timestamps older than a few minutes, and deduplicate by `webhook-id`.

### Replay and dashboards

A replay request creates new deliveries for stored events, with the **same event ids**, so a customer's idempotent handler skips what it already processed. Replays are rate limited per endpoint and run at lower priority than live traffic.

Every attempt is written to an attempt log, partitioned by endpoint and time. Per-minute counts of successes, failures, and latency per endpoint go to a time-series store for the dashboard. The deliveries API lets customers list failures and see the status code and error for each attempt.

## Trade-offs

- **A deliveries table plus a Redis due index** instead of an SQS queue per endpoint: thousands of queues are awkward to manage, and backing off for days doesn't fit a visibility timeout that tops out at 12 hours. The cost is running the scheduling logic ourselves.
- **SQS FIFO with one message group per endpoint** would be a simpler alternative for ordered endpoints, at the cost of the same head-of-line blocking and the same 12-hour limit on long backoffs.
- **Thin payloads** cost customers an extra API call per event but avoid stale data and keep payloads small.

## Failure modes

- **Redis due index lost**: rebuild it by scanning pending deliveries in the table. Deliveries are delayed, not lost.
- **Dispatcher crashes mid-request**: the delivery is retried, so the customer may see it twice, which `webhook-id` handles.
- **Kafka consumer lag in fan-out**: alarm on lag, scale fan-out workers up to the partition count.
- **Mass endpoint failure**, like a cloud provider outage on the customer side: retries spread by jitter, and the per-tenant caps keep the backlog from crowding out others.

## What I'd do next

Endpoint verification before the first delivery, asymmetric signatures so customers verify with a public key, and per-endpoint alerts customers can subscribe to.
