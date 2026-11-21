# Queues and async work

Any system that talks to outside services spends much of its life dealing with calls that are slow, fail, or fail halfway. Queues, retries, and workflows are how you turn that mess into work that finishes exactly as often as it should. This chapter covers the tools and, more importantly, the failure cases interviewers probe: duplicates, retry storms, poison messages, lost events, and order.

## Timeouts come first

Every remote call needs a timeout. A call with no timeout can hold a connection, a thread, or a Lambda invocation forever, and enough of them stuck at once will exhaust the caller. Set both a connection timeout and a request timeout.

Choosing the value is the hard part. Too long, and resources stay tied up while you wait. Too short, and normal slow calls time out and get retried, which adds load just when the service is struggling. A good starting point inside one region is the downstream service's latency at a high percentile, like p99.9, so that only about one call in a thousand times out by mistake. Calls over the internet, like those to third-party providers, need extra room for network delay.

## Retries, backoff, and jitter

Many failures are brief: a dropped connection, a server restarting, or a short spike in load. Trying again often works. But retries have a cost. Each retry asks the struggling service to do more work, so retries help with rare, random failures and hurt when the failure is caused by overload.

Three habits make retries safe:

1. **Back off.** Wait longer after each failed attempt, doubling the wait each time. This is exponential backoff.
2. **Cap it.** Exponential growth gets huge fast, so set a maximum wait and a maximum number of attempts. Then give up and handle the failure some other way.
3. **Add jitter.** If a thousand clients fail at the same moment and all back off by the same amount, they all retry at the same moment too, and the spike repeats. Picking a random wait between zero and the current ceiling, called full jitter, spreads retries out evenly.

```ts
async function withRetries<T>(call: () => Promise<T>, maxAttempts = 3): Promise<T> {
  const baseMs = 100
  const capMs = 5_000
  let attempt = 0
  while (true) {
    try {
      return await call()
    } catch (error) {
      attempt += 1
      if (attempt >= maxAttempts || !isRetryable(error)) throw error
      const ceiling = Math.min(capMs, baseMs * 2 ** attempt)
      await sleep(Math.random() * ceiling)
    }
  }
}
```

Only retry errors that might succeed next time. Timeouts, connection resets, 429, 502, 503, and 504 are usually worth another try. A 400 or 404 will fail the same way again, so retrying only adds load. Respect a `Retry-After` header when the server sends one.

Jitter isn't only for retries. Scheduled jobs that all fire at the top of the minute or at midnight create the same kind of spike. Spreading scheduled work across the window, like syncing each connection at a fixed offset derived from its id, lets the same capacity do the same work with less strain.

## Keeping retries from multiplying

Retries multiply across layers. Picture a request that passes through five services before it reaches a database, and every layer tries three times. When the database starts failing, the top layer makes 3 attempts, each of which makes 3, and so on down: 3 to the fifth power is 243 calls to the database for one user request. A database that was struggling under its normal load now gets hundreds of times more, and it may never recover.

The fix is to **retry at one layer only**, usually the one closest to where the decision to give up makes sense. Lower layers fail fast and report the error upward.

Even one layer of retries adds load when errors start. Two tools limit it:

- **A retry budget**, often a token bucket. Each retry spends a token, and tokens refill slowly. While failures are rare there are plenty of tokens, so every failure gets retried. During a large outage the bucket empties and retries drop to a slow, fixed rate instead of doubling traffic.
- **A circuit breaker**, which stops calling a dependency for a while after too many failures. It works, but it adds an on or off mode to the system that's hard to test and can slow recovery. A retry budget gives most of the protection with less surprise.

In a system with hundreds of providers, keep a budget per provider. One provider having a bad day should slow retries to that provider, not to everyone.

## Idempotency

A timeout doesn't tell you whether the work happened. The server may have done the work and lost the reply. If retrying would charge a card twice or create two records, the retry is unsafe. The answer is to make the operation **idempotent**: doing it twice has the same effect as doing it once.

Reads are naturally idempotent. Writes become idempotent in two common ways.

**Idempotency keys on requests.** The caller sends a unique key, like a UUID, with each logical request and reuses it on every retry. The server records the key with the result. A repeat with the same key returns the stored result instead of doing the work again. Three details matter:

- Record the key and make the change in **one atomic transaction**. If you save the key but the change fails, or make the change but fail to save the key, a retry will do the wrong thing.
- Store the request's parameters with the key. If the same key comes back with **different parameters**, return an error, because the caller is asking for something else.
- Return an equivalent response to the original, not an "already exists" error. Otherwise the client has to write special code for its own retries.

Keys don't need to live forever. Keep them long enough to cover any reasonable retry, like 24 hours or the life of the resource.

**Idempotent consumers.** A consumer reading from a queue or a log will sometimes see the same message twice. Either track message ids you've processed, in the same transaction as the work, or make the write itself naturally idempotent, like an upsert keyed by the provider's record id plus a version or timestamp so an older copy never overwrites a newer one.

```sql
INSERT INTO records (provider, external_id, version, body)
VALUES ($1, $2, $3, $4)
ON CONFLICT (provider, external_id) DO UPDATE
  SET version = excluded.version, body = excluded.body
  WHERE records.version < excluded.version
```

### At-least-once and exactly-once

In practice, message delivery between systems is **at-least-once**: a message is delivered one or more times. At-most-once is possible, by acknowledging before you process, but it loses messages on a crash, so it rarely fits. Exactly-once delivery across a network isn't something you can buy.

What you can get is **exactly-once effect**: at-least-once delivery plus an idempotent consumer. When a product says "exactly-once," read the fine print. SQS FIFO queues drop duplicate sends that reuse a deduplication id within a five-minute window. Kafka transactions can commit a consumer's offsets and its output messages together, which gives exactly-once processing from one Kafka topic to another. Neither stops your consumer from calling a third-party API twice if it crashes at the wrong moment. Plan for duplicates at every boundary that leaves the system.

## Queues, visibility, and dead letters

With Amazon SQS, receiving a message doesn't remove it. The message stays in the queue but is hidden from other consumers for the **visibility timeout**, 30 seconds by default. If the consumer deletes it in time, it's gone. If the consumer crashes or runs out of time, the message reappears and another consumer gets it. That's how SQS avoids losing work, and it's also why duplicates happen: a slow consumer can still be working when the message reappears.

Set the visibility timeout above the longest normal processing time. For work that varies, start shorter and extend the timeout from the consumer while it works, a heartbeat, using `ChangeMessageVisibility`. The total can't exceed 12 hours from the first receive. Work longer than that belongs in a workflow engine.

Some messages will never succeed: a malformed payload, a deleted connection, or a bug that only one record triggers. Without a limit, such a **poison message** cycles forever, wasting capacity and hiding real failures. A **dead-letter queue** fixes this. A redrive policy sets `maxReceiveCount`, the number of receives allowed before SQS moves the message to the dead-letter queue. Set it high enough to ride out brief outages, often 3 to 5 or more, because a value of 1 would send a message to the dead-letter queue after a single failure.

A few rules for dead-letter queues:

- **Alarm on them.** A message in a dead-letter queue is a failure nobody has seen yet.
- **Keep messages there longer than in the source queue.** For standard queues, a message's expiry is based on when it was first sent, so a short retention in the dead-letter queue can delete it before anyone looks.
- **Redrive after the fix.** Once the cause is fixed, move the messages back to the source queue. That only works if consumers are idempotent.
- **Think before using one with a FIFO queue.** Moving a message aside lets later messages in its group go ahead, which breaks the order you chose FIFO for.

### Lambda and SQS batches

When Lambda reads from SQS, it receives messages in batches. By default, if the function throws, the whole batch counts as failed and every message in it returns to the queue, including the ones that succeeded. They'll be processed again.

Turn on **partial batch responses** with `ReportBatchItemFailures` and return only the failed message ids. Lambda deletes the rest.

```ts
import type { SQSBatchResponse, SQSEvent } from "aws-lambda"

export async function handler(event: SQSEvent): Promise<SQSBatchResponse> {
  const batchItemFailures: { itemIdentifier: string }[] = []
  for (const record of event.Records) {
    try {
      await processOnce(record)
    } catch {
      batchItemFailures.push({ itemIdentifier: record.messageId })
    }
  }
  return { batchItemFailures }
}
```

Catch errors per message, because an exception that escapes the handler still fails the whole batch. With a FIFO queue, stop at the first failure and report it plus every message after it, so nothing in the group jumps ahead.

## Ordering and its cost

Ask whether order really matters before you pay for it. Most of the time, what matters is order **per entity**: updates to one record must apply in sequence, while updates to different records can happen in any order.

- **SQS FIFO** orders messages within a **message group id**. Messages in one group are delivered strictly in order, and the next one isn't released until the current one is deleted or times out. Different groups are processed in parallel.
- **Kafka** orders events within a **partition**. Events with the same key go to the same partition, so keying by connection or record id keeps each entity's events in order.

The cost is the same in both. Order means one-at-a-time processing per key, so a slow or failing message blocks everything behind it in its group or partition. Parallelism is capped by the number of groups or partitions. A hot key, like one huge tenant, becomes a bottleneck no amount of consumers can fix.

Often you can avoid strict order entirely. If each message carries a version or the source's updated time, the consumer can ignore anything older than what it already has. That turns an ordering problem into an idempotency problem, which is cheaper to solve.

## The transactional outbox

A common bug: a service updates its database and then publishes an event. If it crashes between the two, the database changed but nobody heard. Publishing first is no better, because the transaction might roll back after the event went out. Two-phase commit across a database and a broker is usually unavailable or unwise.

The **transactional outbox** solves it. Write the event into an outbox table in the **same transaction** as the business change. A separate relay reads the outbox and publishes to the broker, either by polling the table or by tailing the database's change log.

```sql
BEGIN
UPDATE connections SET status = 'disconnected' WHERE id = $1
INSERT INTO outbox (id, topic, key, payload) VALUES ($2, 'connection.status', $1, $3)
COMMIT
```

The event is now published if and only if the change commits, and in commit order. The relay can still crash after publishing but before marking the row sent, so it may publish twice. Consumers must be idempotent, which they needed to be anyway.

## Sagas and compensation

When one business action spans several services, each with its own database, there's no single transaction to wrap it in. A **saga** is a sequence of local transactions, one per service. If a step fails for a business reason, the saga runs **compensating transactions** to undo the steps that already finished, in reverse order.

There are two ways to coordinate a saga:

- **Choreography**: each service reacts to the previous service's event and emits its own. No central coordinator, but the flow is spread across services and hard to follow.
- **Orchestration**: one coordinator tells each service what to do and reacts to the replies. The flow lives in one place, which is easier to read, test, and change.

Compensation isn't rollback. Other work can see the intermediate state, because sagas don't give the isolation of a database transaction, and some actions can't be undone, like an email that was sent. Design compensations as new actions, like issuing a refund or marking a record as reverted, and put irreversible steps last.

## Workflow engines

When a process has many steps, waits, retries, and compensations, writing it as a chain of queues and handlers gets hard to follow. A workflow engine keeps the state of each run for you.

**AWS Step Functions** describes a workflow as a state machine in JSON, with built-in Retry and Catch on each step, parallel branches, maps over items, and callbacks that pause until an outside system replies with a task token. It comes in two types:

| | Standard | Express |
|---|---|---|
| Execution | Exactly-once per step | At-least-once |
| Longest run | One year | Five minutes |
| Start rate | Thousands per second | Up to about 100,000 per second |
| Priced by | State transitions | Executions and duration |
| Good for | Long, auditable business processes | High-volume, short event processing |

**Temporal** offers **durable execution**: you write the workflow as ordinary code, and the platform records every step in an event history. If a worker crashes, another worker replays the history to rebuild the workflow's state and continues where it stopped. Because of replay, **workflow code must be deterministic**: no direct clock reads, random numbers, or network calls. Anything that touches the outside world goes in an **activity**, which gets its own timeouts, heartbeats, and retry policy with backoff. Workers run in your own infrastructure and pull work from task queues.

How to choose, briefly:

- Step Functions fits an AWS-native team with workflows that are mostly calls to AWS services, and you don't run any servers for it.
- Temporal fits complex logic best expressed as code, long-running per-entity workflows, and teams that want the same model outside AWS. You run workers, and either run the Temporal service or pay for the hosted one.
- A plain queue with a dead-letter queue is still the right answer for independent, single-step jobs. Don't add a workflow engine for work that has one step.

## Bus, queue, or log

These three move messages, but they solve different problems.

| | Queue (SQS) | Event bus (EventBridge) | Log (Kafka) |
|---|---|---|---|
| Model | Work items, each handled by one consumer | Events routed by rules to many targets | An ordered, retained stream that many readers read |
| After reading | Deleted | Delivered to each matching target | Kept until retention ends |
| Order | None, or per group with FIFO | Ordered delivery only on the newer Custom Event Bus | Per partition |
| Replay | No | Retention and replay on the newer Custom Event Bus | Yes, by moving a consumer's offset |
| Scaling readers | More consumers | More targets | Consumer groups, up to one consumer per partition |
| Best for | Spreading jobs across workers | Fan-out and routing across services and accounts | High-volume streams, many independent readers, replay |

**EventBridge** is a serverless router. Events come in from your services, AWS services, or partners, rules match them, and each match goes to a target, like a queue, a Lambda function, or a Step Functions workflow. Pipes connect one source to one target with optional enrichment. The newer Custom Event Bus adds retention, ordered delivery, and replay, so check the current features before ruling those out.

**Kafka** stores events in **topics** split into **partitions**. A producer picks the partition by key. Events stay for the topic's retention period whether or not anyone has read them. Consumers in a **consumer group** split the partitions between them, and each consumer tracks its position, the **offset**, per partition. When a consumer joins or leaves, the group **rebalances** and partitions move. Because the consumer commits its offset after processing, a crash means rereading from the last commit, so Kafka consumers are at-least-once by default. Moving a group's offsets back replays history, which is how you rebuild a store after a bug.

A fair rule of thumb: use a queue to share out work, a bus to route events between services, and a log when you need high volume, several independent readers, or the ability to read the past again.
