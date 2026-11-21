# Case studies

This chapter puts the earlier ones to work on two full cases: a unified API over hundreds of outside data providers, and a webhook delivery service. Both are common prompts for backend roles at companies whose product is an integration platform, and both reward the same habits: pinning down the hard requirements early, doing the few estimates that matter, and spending the deep dives on failure.

Read this chapter first, then try each exercise on a timer before opening the model answer. Score yourself honestly against the rubric. A first attempt that runs out of time is normal and tells you exactly what to practice.

## Running the 45 minutes

Here's how the method from the first chapter plays out on a case like these. Times are a guide, not a rule.

**Minutes 0 to 7, requirements.** Restate the prompt in a sentence. Then ask the questions that change the design. For an integration platform, the big ones are:

- Who are the customers, and who are their end users? Usually your customers are businesses, and each of them connects many end-user accounts at many providers.
- How do providers deliver data? Pull through their APIs on a schedule, push through their webhooks, or both.
- How fresh must the data be? Minutes, hours, or a daily batch changes everything about scheduling.
- How do customers get the data? Through your API, webhooks, bulk files, or a stream.
- What must never happen? Usually: data from one tenant reaching another, records silently lost, and one customer or provider slowing everyone else.

Close by naming the hardest requirement out loud, like "the hard part is syncing from hundreds of unreliable, rate-limited providers while keeping each customer's data fresh and isolated."

**Minutes 7 to 12, estimates.** Do two or three numbers that size the design: records or bytes per day, sync jobs per second, and outbound calls to providers per second. Say what each number decides.

**Minutes 12 to 17, API and entities.** List the core entities, like tenant, connection, sync, record, and webhook endpoint, and the handful of calls customers make.

**Minutes 17 to 30, high-level design.** Draw the path of one record from the provider to the customer, end to end, before adding anything else. Then add the control plane: how connections are created, scheduled, and monitored.

**Minutes 30 to 42, deep dives.** Pick the riskiest two or three parts and lead. For these cases that's usually rate limits and fairness, failure handling and health, and correctness under retries and late data.

**Minutes 42 to 45, wrap-up.** Name the main trade-offs, how the system fails, and what you'd build next.

If you fall behind, cut breadth, not depth. A design that handles one provider type well, with the others described in a sentence, beats one that lists every feature and explains none.

## What senior and staff answers add

Interviewers for these roles mostly look for judgement about failure and operations. A few things set strong answers apart:

- **Treating providers as unreliable by default.** Timeouts, retries with backoff and jitter, rate limits, and long outages are part of the core design, not an afterthought.
- **Separating "their problem" from "our problem."** A revoked credential needs the customer to act. A provider outage needs you to wait and tell people. A bug in your mapping needs you to fix and replay. Different causes need different states, alerts, and owners.
- **Designing for replay.** Keeping raw data lets you fix a bug and rebuild, instead of asking hundreds of providers for history again.
- **Naming the multi-tenant risks.** Isolation of data, fairness of capacity, and blast radius when something breaks.
- **Talking about operations.** What's on the dashboard, what pages someone at night, and what the customer sees.

## Patterns for integration platforms

These are the building blocks both model answers use. Learn the reasoning, not the boxes.

### A connector framework

With hundreds of providers, you can't hand-write a whole service per provider. Split what varies from what doesn't.

What varies per provider lives in a **connector**: how to authenticate (OAuth with refresh, API keys, or a username and password), how to call the API (REST, SOAP, or file drops), how to page (cursors, offsets, page tokens, or dates), what rate limits apply, and how to map responses to your common model. Much of this can be declarative configuration, with code hooks for the quirks.

What's shared lives in the **runtime**: scheduling, retries, rate limiting, credential storage, raw data capture, metrics, and health reporting. Every connector gets these for free, so fixing a retry bug fixes it for all 300 providers at once.

Connectors need their own engineering practice: a fixed interface, versioning, tests against recorded responses, and a way to roll out a new connector version to a few connections first. Provider APIs change without notice, so a connector that worked yesterday can fail today, and the system has to notice quickly.

### Scheduling, on-demand syncs, and backfills

Three kinds of sync work share the same workers but need different treatment:

| Kind | Trigger | Priority | Notes |
|---|---|---|---|
| Scheduled | A per-connection interval, like every 15 minutes | Normal | Spread start times with jitter so they don't all fire at once |
| On-demand | A customer asks for fresh data now | High | Deduplicate if one is already queued or running |
| Backfill | A new connection, or a fix that needs history | Low | Split into time chunks and track progress so it can resume |

A scheduler finds connections that are due, like rows where `next_sync_at` has passed, and enqueues jobs. Workers take jobs, but before calling a provider they take a token from that provider's rate limiter. Backfills run in their own lower-priority lane, so a big new customer's history doesn't delay everyone's routine syncs.

### Raw and normalized data

Write every raw response to object storage, like S3, before you transform it. Then normalize it into the common model and upsert the result, keyed by provider and the provider's record id, keeping the newer version.

Keeping the raw data gives you three things. You can **replay** after fixing a mapping bug, without calling the provider again. You can **debug** a customer complaint by looking at exactly what the provider sent. And you can offer raw fields to customers who need something your model doesn't cover. The cost is storage, which object storage makes cheap, and a retention policy to set.

### Connection health

Customers need to know whether each connection works, and "error" isn't enough. Track separate states with separate owners:

| State | Example cause | Who acts |
|---|---|---|
| Healthy | Syncs succeed on schedule | Nobody |
| Disconnected | Credentials revoked or expired, consent withdrawn | The customer or end user, by reconnecting |
| Sync failing | Provider errors, timeouts, or an outage | You retry, and escalate if it lasts |
| Data issue | Records fail validation, or fields are missing | You or the customer, depending on the cause |

Record problems as **issue codes**, like `auth_revoked` or `provider_timeout`, and deduplicate them per connection: one open issue with a first-seen time, a last-seen time, and a count, not a new alert every sync. That keeps dashboards readable and alerts meaningful.

Watch for **provider outages** across connections. When one provider's error rate jumps for many connections at once, the cause is the provider, not each connection. Mark a provider incident, slow its retries with a retry budget, and don't flip thousands of connections to disconnected or page the customer for each one.

### Delivery

Customers consume data in different ways, and a mature platform offers several:

- **An API** with cursor pagination and an `updated_after` filter, for pulling changes.
- **Webhooks**, usually thin, that announce changes so customers don't have to poll.
- **Bulk export** of files to the customer's S3 bucket, or a stream to their Kafka, for large volumes and warehouses.

All three read from the same source: a change stream produced from the normalized store, through an outbox or change data capture. That keeps them consistent with each other.

### Tenancy and fairness

Put the tenant id in every key, every query, and every log line. Derive it from credentials, never from input. Then think about fairness, which is about capacity, not data:

- **Rate limits per tenant** on your API.
- **Fair scheduling per tenant** within each provider's capacity, so one customer with 100,000 connections to a provider doesn't use its whole rate limit.
- **Separate lanes** for heavy work like backfills and exports.
- **Cells** for very large tenants, so their load and their incidents stay contained.

### Webhook delivery at scale

The second case is a service that sends webhooks for many customers. The core idea is a **queue per endpoint**, usually a virtual one: delivery attempts stored with the endpoint id and the next attempt time, and dispatchers that take due attempts with a cap on how many run at once for each endpoint. One slow or dead endpoint then backs up only its own deliveries, not anyone else's.

Around that core go signing with a per-endpoint secret, retries with backoff and jitter over days, disabling endpoints that keep failing, replay by event id or time range, and dashboards that show customers each endpoint's success rate, latency, and last error.

## Follow-up questions to expect

Interviewers often push on the same points. Have an answer ready for each:

- **A provider is down for six hours. What happens?** Jobs fail and back off, the retry budget keeps retries from flooding the provider, the provider incident shows on the status page, connection states say sync failing rather than disconnected, and when it recovers the trailing window catches up on what was missed.
- **You shipped a mapping bug a week ago. How do you fix the data?** Fix the mapping, replay raw payloads for the affected connections and dates through the new version, and let idempotent upserts correct the records. Emit change events so customers see the fixes.
- **One customer adds 50,000 connections at once. What breaks?** Their backfills go to the low-priority lane, per-tenant fairness caps their share of each provider's rate limit, and other customers' scheduled syncs keep their freshness.
- **How do you know data is fresh?** Track time since the last successful sync per connection, and alert on the share of connections past their freshness target, per provider.
- **How do you stop one tenant seeing another's data?** Tenant from credentials, tenant in every key and query, tests that try cross-tenant access, and audits of access.

## Practicing with the exercises

Try the hard case first if you have more time, or the medium one if you want a faster win. Set a 45-minute timer, talk out loud or write as if you were at a whiteboard, then score yourself on the six rubric criteria before reading the model answer. Look first at where the model answer spent its deep dives, and ask whether you would have found those risks on your own. That's the skill that improves most with practice.
