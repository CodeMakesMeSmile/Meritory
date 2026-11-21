# API design

A public API is a promise. Once customers build on it, every field name, status code, and page boundary becomes something you can't easily take back. And when your product is an API over other people's APIs, you live on both sides of that promise: you design a clean contract for your customers while coping with providers whose contracts are messy, slow, and sometimes wrong.

This chapter covers the parts interviewers probe most for a data-heavy, server-to-server API: resources, pagination, incremental sync, webhooks, rate limits, idempotency, errors, versioning, and auth.

## Resources and status codes

Model the API around **resources**, the nouns customers care about, with plural names and stable ids. Use HTTP methods for what they mean: `GET` reads and never changes anything, `POST` creates or triggers an action, `PATCH` changes part of a resource, and `DELETE` removes one.

```text
GET    /v1/connections
POST   /v1/connections
GET    /v1/connections/{id}
GET    /v1/connections/{id}/records?updated_after=...&cursor=...
POST   /v1/connections/{id}/syncs
GET    /v1/syncs/{id}
```

Long-running work, like a full sync, shouldn't hold a request open. Return `202 Accepted` with a link to a resource the client can poll, like a sync job with a status, and send a webhook when it finishes.

Use status codes the way generic HTTP tools expect, because proxies, SDKs, and retry logic all read them:

| Code | Meaning for the client |
|---|---|
| 200, 201, 202 | It worked, it was created, or it was accepted for later |
| 400 or 422 | The request is wrong. Fix it, don't retry it |
| 401 | No valid credentials |
| 403 | Valid credentials, but not allowed |
| 404 | No such resource, or one this caller can't see |
| 409 | Conflicts with current state, like an idempotency key already in use |
| 429 | Too many requests. Slow down and retry later |
| 500, 502, 503, 504 | Server-side trouble. Usually safe to retry with backoff |

### Error bodies

A status code alone rarely says enough. **RFC 9457, Problem Details for HTTP APIs**, defines a standard JSON error body with the media type `application/problem+json`. Using it means customers don't have to learn your own error format.

```json
{
  "type": "https://api.example.com/problems/connection-disconnected",
  "title": "The connection needs to be reauthorized",
  "status": 409,
  "detail": "The provider rejected the stored credentials on its last three sync attempts.",
  "instance": "/v1/connections/conn_123/syncs/sync_456",
  "connection_id": "conn_123",
  "reconnect_url": "https://app.example.com/reconnect/conn_123"
}
```

- `type` is a URI that identifies the kind of problem, and it's what clients should branch on. Ideally it links to documentation. When it's missing, it means `about:blank`, a problem with no meaning beyond the status code.
- `title` is a short, stable summary of the type.
- `status` repeats the HTTP status for convenience. It must match the real one.
- `detail` explains this occurrence and should help the client fix it. Clients shouldn't parse it.
- `instance` identifies this occurrence, which helps support find it.
- **Extension members**, like `connection_id` above, carry machine-readable extras. Clients must ignore extensions they don't recognise, which lets you add more later.

When several different problems occur at once, return the most important one. Never put stack traces or internal details in an error body, because they help attackers more than customers.

## Pagination

Any list can grow without limit, so every list endpoint needs pagination from day one. Adding it later is a breaking change.

**Offset pagination**, like `?offset=200&limit=100`, is simple and lets users jump to page 7. It has two problems. Deep offsets get slow, because the database still walks past every skipped row. And when rows are added or removed while a client pages, items shift between pages, so the client skips some and sees others twice.

**Cursor pagination** returns an opaque token that marks where the page ended, and the next request passes it back. Under the hood the cursor encodes a position in a stable sort order, like the last row's `(created_at, id)`, so the next query is "rows after this position," which an index answers quickly no matter how deep you are. Inserts and deletes elsewhere don't shift the pages.

```json
{
  "data": [ { "id": "rec_901" }, { "id": "rec_902" } ],
  "has_more": true,
  "next_cursor": "eyJ1IjoiMjAyNi0xMS0yMFQxMDowMDowMFoiLCJpIjoicmVjXzkwMiJ9"
}
```

A few rules make cursors safe:

- Sort by a unique key, or add the id as a tie-breaker, so no two rows share a position.
- Keep the cursor opaque, so you can change what's inside it without breaking clients.
- Cap the page size, like 1 to 100 with a sensible default, so one request can't ask for everything.
- Return `has_more` or a `next_cursor`, so clients know when to stop.

Use offsets for small admin screens where jumping to a page matters. Use cursors for anything large, changing, or read by machines.

## Incremental sync

Customers rarely want everything every time. They want what changed since they last asked. The usual tool is a **modified-after filter** plus a **checkpoint**: the client stores the newest `updated_at` it has processed and asks for records updated after it next time.

Your sync workers do the same thing against providers. It sounds simple, and it has traps.

**Ties and ordering.** Many records can share an `updated_at`. If you ask for records strictly after the last timestamp, you skip any that shared it but landed on the next page. Use a compound position, `(updated_at, id)`, or ask for "at or after" and rely on idempotent writes to absorb the repeats.

**Late-arriving data.** A record's `updated_at` can be earlier than your checkpoint by the time it becomes visible: the provider's replica lags, a transaction committed late, a device uploaded hours of data after reconnecting, or clocks disagree. A checkpoint that moves straight to "the newest timestamp seen" will miss those records forever.

The standard fix has two parts:

1. **Re-query a trailing window.** Start each sync from the checkpoint minus an overlap, like 10 minutes or a day, depending on how late the source's data tends to arrive.
2. **Make writes idempotent upserts**, keyed by the source's record id, and keep the higher version. The overlap then costs only some repeated reads, never duplicate records.

```ts
const since = new Date(checkpoint.getTime() - overlapMs)
let cursor: string | undefined
let newest = checkpoint
do {
  const page = await provider.listRecords({ updatedAfter: since, cursor })
  await upsertRecords(page.items)
  for (const item of page.items) {
    if (item.updatedAt > newest) newest = item.updatedAt
  }
  cursor = page.nextCursor
} while (cursor)
await saveCheckpoint(newest)
```

Save the checkpoint only after every page has been written. If the run dies halfway, the next run starts from the old checkpoint and redoes the work safely.

**Deletes.** A modified-after query never returns a record that was deleted. Either the source exposes deletions, as tombstone records or a deleted-events feed, or you run a periodic full reconciliation that compares ids and marks missing ones as deleted.

Offer customers the same contract you'd want from a provider: `updated_after` plus a cursor, a stable sort, tombstones for deletes, and documentation that says how late data can arrive.

## Webhooks

Webhooks let you tell customers about changes without them polling. They're HTTP requests from your servers to an endpoint the customer registers. Designing them well is mostly about the bad cases.

### Signing

Anyone can send a request to a public URL, so customers need to know a webhook really came from you and wasn't changed or replayed. The common scheme signs each delivery with **HMAC-SHA256** using a secret unique to that endpoint. The signed content includes a **message id**, a **timestamp**, and the **exact raw body**. The Standard Webhooks spec, for instance, signs `id.timestamp.body` and sends three headers: `webhook-id`, `webhook-timestamp`, and `webhook-signature`.

The receiver:

1. Recomputes the signature over the raw body, before any JSON parsing changes a byte.
2. Compares it in constant time, so timing doesn't leak the signature.
3. Rejects timestamps too far from now, often five minutes, which blocks replays of captured requests. A tolerance of zero turns the check off, so never use it.
4. Accepts any of several signatures in the header, which lets the sender rotate secrets with an overlap and no downtime.

```ts
import { createHmac, timingSafeEqual } from "node:crypto"

export function verifyWebhook(rawBody: string, headers: Headers, secret: Buffer): boolean {
  const id = headers.get("webhook-id")
  const timestamp = Number(headers.get("webhook-timestamp"))
  const signatures = headers.get("webhook-signature")?.split(" ") ?? []
  if (!id || !Number.isFinite(timestamp)) return false
  if (Math.abs(Date.now() / 1000 - timestamp) > 300) return false
  const expected = createHmac("sha256", secret).update(`${id}.${timestamp}.${rawBody}`).digest()
  return signatures.some((entry) => {
    const [version, value] = entry.split(",")
    if (version !== "v1" || !value) return false
    const given = Buffer.from(value, "base64")
    return given.length === expected.length && timingSafeEqual(given, expected)
  })
}
```

### Retries and dead endpoints

A delivery succeeds only on a 2xx response within a timeout, often 15 to 30 seconds. Treat everything else as a failure, including redirects. Retry on a schedule that spans days with exponential backoff and jitter, like seconds, then minutes, then hours. Respect `429` and `Retry-After`, and treat `410 Gone` as the customer asking you to stop.

When an endpoint has failed for a long time, **disable it** and tell the customer through another channel, like email. Keep the undelivered events, and give customers a way to see failed deliveries and **replay** them, one event or a time range, once they've fixed their side.

### Duplicates and order

Retries mean customers will sometimes get the same event twice, for instance when their handler did the work but the response timed out. Give every event a unique id that stays the same across retries, and tell customers to use it as an idempotency key. Handlers should record processed event ids and skip repeats.

Order isn't guaranteed either. Retries and parallel delivery mean `record.updated` can arrive before `record.created`. Customers shouldn't depend on order. Include a version or the resource's updated time so handlers can ignore stale events, or have them fetch the current state from the API.

Tell customers to **acknowledge fast and process later**: verify the signature, put the event on their own queue, and return 2xx. Slow handlers time out and cause retries, and a burst of webhooks can overwhelm a handler that does all its work inline.

### Thin and fat payloads

A **fat** payload includes the full resource, so the customer needs no extra call. A **thin** payload includes only the type and the ids, and the customer fetches what they need.

| | Fat | Thin |
|---|---|---|
| Extra API calls | None | One per event |
| Staleness | Can be out of date by the time it's handled | Always fetches current state |
| Size | Can be large | Small |
| Data exposure | Sends data to every endpoint | Access goes through the API, so it's authorized and audited |
| Evolving | Payload shape is part of the contract | Easier to change |

Thin payloads pair well with out-of-order delivery, since the fetch always returns the latest state. Many APIs send thin events by default and keep payloads small, well under about 20 KB.

### Safety on the sender side

Customers choose the URLs you call, which makes the webhook sender an **SSRF** risk: someone could register an internal address and make your servers call it. Send webhooks from workers in an isolated network, through a proxy that blocks private and metadata addresses. Some customers need a fixed list of source IPs to allow through their firewall, so publish one.

## Rate limits

Rate limits protect your service from overload and keep one customer from starving the others.

- Return **429 Too Many Requests** when a client goes over, with a **Retry-After** header saying when to try again. Some APIs add a header explaining which limit was hit.
- A **token bucket** is the usual algorithm. Each client has a bucket that refills at a steady rate up to a maximum. Each request takes a token. The maximum allows short bursts, and the refill rate sets the long-run average.
- Limit **per tenant**, and often per endpoint too, so one customer's backfill can't slow everyone else. Expensive operations, like list calls or exports, can have lower limits or a separate concurrency limit on requests in flight.
- Keep the counters in a fast shared store, like Redis, so every API server sees the same buckets.

You'll also be on the other side, calling providers with their own limits. Treat their limits as hard constraints in the design. Keep a client-side token bucket per provider, and per provider account when limits are per account, so the sync scheduler never exceeds them. When a 429 arrives anyway, back off with jitter and respect `Retry-After`. A provider's rate limit often decides how fast a backfill can possibly run, which is worth saying in an interview.

## Idempotent POST requests

`GET`, `PUT`, and `DELETE` are idempotent by definition. `POST` usually isn't, so a retried create can create twice. Accept an **`Idempotency-Key`** header on every `POST` that changes state.

- The client generates the key, like a V4 UUID, and reuses it on retries.
- The server stores the key, scoped to the caller, with the request's parameters and the response, **in the same transaction as the change**.
- A repeat with the same key gets the saved response, not a second change.
- A repeat with the same key but a **different body** is an error, because the caller is asking for something else under the same key.
- If the original request is still running, a concurrent repeat gets `409 Conflict` and can retry shortly.
- Keys expire after a window, like 24 hours.

Don't build keys from sensitive data like email addresses, and don't derive them from a hash of the body, because two identical requests can be two intentional actions.

## Versioning and compatible change

The best versioning strategy is to rarely need a new version. Most changes can be **backwards compatible**:

| Safe | Breaking |
|---|---|
| Add a new endpoint | Remove or rename an endpoint or field |
| Add an optional request field | Add a required request field |
| Add a response field | Change a field's type or meaning |
| Add a value to an enum documented as open | Change a default behavior |
| Add a new event type | Change error codes clients branch on |

Compatibility depends on clients too. Document that clients must ignore unknown fields and handle unknown enum values with a safe default. Otherwise adding a field or an enum value breaks a strict client.

For changes that must break, version explicitly. Common choices are a version in the path, like `/v2/`, or a date-based version in a header that each account is pinned to, so customers move when they're ready. Run old versions for a published period, measure who still uses them, and help those customers move before turning anything off. Webhook payloads need the same care, because an event's shape is part of the contract.

## Server-to-server auth

Machines, not people, call this kind of API, so auth looks different from a login screen.

- **API keys** are the simplest. Issue keys per environment, show them once, store only a hash, let customers create several with narrow scopes, and rotate them without downtime. Keys belong in a secrets store, never in source code or client apps.
- **OAuth 2.0 client credentials** suits machine-to-machine calls with no user involved. The client trades its client id and secret for a short-lived access token at the token endpoint, and requests a new one when it expires. There's no refresh token, and a leaked access token stops working soon.
- **Per-connection tokens** fit an API that acts on behalf of many end customers. When an end customer links an account, you issue a token scoped to that one connection. A leaked token then exposes one connection, not the whole tenant, and revoking it is precise.

Whatever the scheme, derive the tenant and connection from the credential, never from a request field, and check on every request that the resource belongs to them. Returning 404 instead of 403 for resources from other tenants avoids confirming that they exist.

Providers will use every auth style there is: OAuth with refresh tokens that expire or get revoked, static API keys, and even usernames and passwords. Store those credentials encrypted with a key management service, refresh OAuth tokens before they expire, and treat a failed refresh as a reason to mark the connection as needing the customer's attention, not as a sync error to retry forever.
