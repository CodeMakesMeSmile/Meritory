# Model answer

This is one strong answer, not the only one. Compare where it spends its time with where you spent yours.

## Requirements

**Functional**

1. Customers connect end-user accounts at any supported provider, and see each connection's status.
2. Data syncs on a schedule, on demand, and as a history backfill for new connections.
3. Data is normalized into a common model, and the raw provider data is kept.
4. Customers get data through an API with cursors and an `updated_after` filter, through webhooks, and through bulk export to their S3 or Kafka.

Out of scope for now: writing data back to providers, and the customer-facing dashboard beyond what the API exposes.

**Non-functional**

- **Isolation**: no tenant ever sees another tenant's data.
- **Fairness**: one customer or one provider can't slow everyone else.
- **Freshness**: scheduled data is no older than its sync interval plus a small margin, like 15 minutes plus 5.
- **No silent loss**: every record a provider returned is either stored or shows up as an issue.
- **Resilience**: provider failures are normal, and an outage at one provider affects only that provider's connections.

The hardest part, said out loud: syncing reliably from 300 unreliable, rate-limited providers while keeping each customer's data fresh, correct, and isolated.

## Estimates

```text
Ingest: 2 TB/day / 1e5 s = ~20 MB/s average, plan ~70 MB/s peak
Records: at ~2 KB raw each, ~1e9/day = ~12,000/s average, ~35,000/s peak
Connections: assume 1 million, synced every 15 minutes = 96 runs/day each
Sync runs: 1e6 x 96 / 86,400 = ~1,100/s
Provider calls: ~3 pages per run = ~3,300/s average, ~10,000/s peak
Raw storage: 2 TB/day x 30 days = 60 TB in S3, much less compressed
```

What they decide: sync workers are I/O bound and need high concurrency, not big machines. The rate limiter must answer about 10,000 checks a second, which a Redis cluster handles easily. Writes at 35,000 a second at peak point to a store that scales writes horizontally. Raw data belongs in object storage, not a database.

## API and entities

Entities: **Tenant**, **Connection** (tenant, provider, credential reference, status, schedule, checkpoint), **SyncRun**, **Issue** (connection, code, first seen, last seen, count), **Record** (tenant, connection, type, provider record id, version, updated at, normalized fields, raw reference), **WebhookEndpoint**, and **Export**.

```text
POST /v1/connect-sessions                 -> hosted link for the end user to sign in
GET  /v1/connections?status=...           -> list with status and open issues
GET  /v1/connections/{id}
POST /v1/connections/{id}/syncs           -> 202, a SyncRun to poll
GET  /v1/data/{type}?connection_id=..&updated_after=..&cursor=..
POST /v1/webhook-endpoints                { url, event_types }
POST /v1/exports                          { destination, types, schedule }
```

The end user signs in through a hosted page, so customers never handle provider passwords. Tenant identity comes from the customer's API key. Every `POST` accepts an `Idempotency-Key`.

## High-level design

1. **Connection service** (TypeScript on ECS, Aurora Postgres) owns tenants, connections, schedules, and health. Provider credentials are encrypted with KMS envelope keys and stored apart from everything else, readable only by the sync runtime.
2. **Scheduler** scans for connections whose `next_sync_at` has passed and enqueues jobs. Start times get a fixed per-connection offset, so syncs don't all fire on the hour. Jobs go into three SQS lanes: on-demand (high priority), scheduled (normal), and backfill (low).
3. **Sync workers** run the shared connector runtime. For each job: take a token from the provider's rate limiter in Redis, refresh the OAuth token if it's close to expiring, fetch a page, write the raw page to S3 under tenant, connection, and date, and publish a small message pointing at it to a Kafka topic `raw-pages`, keyed by connection id. Workers repeat until the last page, then report the run's outcome.
4. **Normalizers** consume `raw-pages`, map each page with the connector's versioned mapping, validate the records, and upsert them into the record store, keyed by tenant, connection, type, and provider record id, keeping the higher version. Records that fail validation become data issues instead of disappearing.
5. **Record store**: DynamoDB, with an index on connection, type, and `(updated_at, id)` for modified-after queries. Its change stream feeds a Kafka topic `record-changes`, keyed by connection.
6. **Delivery**: the API reads the record store. The webhook service and the export service both consume `record-changes`. Exports write hourly files to the customer's S3 bucket or produce to their Kafka.
7. **Health service** consumes sync outcomes, keeps each connection's state and open issues, and watches error rates per provider.

## Deep dives

### Rate limits and fairness

Each provider gets a token bucket in Redis, keyed by provider, and also by provider account when the provider limits per credential. Workers can't call a provider without a token, so the system never exceeds a limit by design. A 429 still triggers backoff with jitter and respects `Retry-After`, and it lowers that bucket's refill rate for a while.

Within one provider, capacity is shared fairly between tenants. The scheduler releases jobs round-robin across tenants for each provider, so a customer with 100,000 connections gets a fair share rather than the whole limit. Backfills use only the low lane and are capped at a share of each provider's tokens, like 20 percent, so history loads never hurt freshness for everyone else.

### Failure handling and health

Every connector error is classified once, in the shared runtime:

| Error | Handling | Connection state |
|---|---|---|
| Timeout, 5xx, connection reset | Retry with capped backoff and jitter | Sync failing, if it lasts past a threshold |
| 429 | Back off, respect Retry-After, slow the bucket | Healthy, unless it lasts |
| 401 or refresh failure | Don't retry | Disconnected, customer must reconnect |
| Response doesn't match the expected shape | Don't retry, keep the raw page | Data issue, connector owner alerted |

Retries happen in one place, the job level, with a retry budget per provider. Jobs that exhaust their attempts go to a dead-letter queue with an alarm.

Issues are stored as codes, like `auth_revoked` or `provider_timeout`, with one open issue per connection and code, plus first-seen, last-seen, and count. Customers get a `connection.status_changed` webhook only when the state changes, not on every failed run.

**Provider outages**: the health service tracks each provider's error rate across all its connections per minute. When it jumps for many connections at once, it opens a provider incident. Syncs to that provider slow down, per-connection alerts are suppressed, connections stay in sync failing rather than disconnected, and the status page says what's happening. When the provider recovers, normal scheduling plus the trailing window catches up.

### Correctness under retries and late data

- Every write is an idempotent upsert keyed by provider record id, keeping the higher version, so retries, redeliveries, and replays never duplicate data.
- Incremental syncs start from the checkpoint minus an overlap window tuned per provider, so late-arriving data is caught. The checkpoint moves only after the run's pages are all written.
- Deletes come from provider tombstones where available, and from a nightly reconciliation of ids otherwise.
- Kafka keys by connection id, so each connection's pages are normalized in order.
- **Replay**: each record notes the mapping version that produced it. After a mapping bug, fix the mapping, re-publish the affected raw pages from S3 to `raw-pages`, and let upserts correct the records. Change events tell customers what changed.

### Backfills

A backfill is a long, multi-step job that must survive restarts and pause during provider incidents. It runs as a durable workflow, in Temporal or Step Functions Standard, that splits history into time chunks and runs each chunk as an activity with its own retry policy. Progress is saved per chunk, so a backfill resumes rather than restarts. Routine scheduled syncs stay as plain SQS jobs, because they're single, short steps that don't need a workflow engine.

### Connectors

Each connector implements one interface: authenticate, list pages for a resource since a checkpoint, and map a raw page. Auth style, pagination style, and rate limits are configuration. Connectors are versioned, tested against recorded provider responses, and rolled out to a small share of connections first, with automatic rollback if their error rate rises. Unknown or missing fields in responses raise a data issue so drift is noticed within minutes, not weeks.

## Trade-offs

- **Kafka between fetching and normalizing** gives replay, ordering per connection, and room for more consumers, at the cost of running a managed Kafka cluster. If replay came only from S3, SQS would be simpler, but Kafka also feeds delivery.
- **Keeping raw pages** costs storage but turns mapping bugs into a replay instead of a re-sync from hundreds of rate-limited providers.
- **DynamoDB for records** scales writes without sharding work. The cost is less flexible querying, which is why analytics go to a data lake fed from the change stream.
- **Polling plus provider webhooks**: where a provider offers webhooks, they trigger an on-demand sync, but scheduled polling stays as the safety net because provider webhooks get lost.
- **Thin customer webhooks**: one extra API call per event, but never stale data and every read goes through access control.

## Failure modes

- **Redis rate limiter unavailable**: workers fall back to conservative local limits per provider and run slower rather than risk being blocked by providers.
- **A poison page** that always fails normalization goes to a dead-letter queue, raises a data issue, and doesn't block the rest of the connection's pages for long.
- **An availability zone fails**: every component runs across zones. A full region outage is a later step, starting with replicated S3 and database backups.
- **A tenant's credentials store entry is corrupted**: that connection goes to disconnected with a clear reason, and nothing else is affected.

## What I'd do next

Per-tenant cells for the largest customers, a self-serve connector test harness for faster provider onboarding, and freshness reports per provider that customers can see.
