# Concurrency and coordination

Concurrency bugs pass every test on a laptop and then corrupt data under real load, because they depend on timing. Interviewers probe them with questions like "what if two workers pick up the same connection?" or "what if the lock holder pauses?" Good answers name the race, pick the cheapest tool that closes it, and say what that tool costs.

The running example is the same as in earlier chapters: an API that unifies data from hundreds of outside providers, with a fleet of workers syncing connections and customers reading the results. The Databases chapter covers isolation levels, lost updates, and write skew inside one database, and the Queues and async work chapter covers idempotency and retries. This chapter covers the layer above them: many processes on many hosts sharing rows, provider accounts, and jobs.

## Processes, threads, and the event loop

A **process** has its own memory. If it crashes, it takes only itself down, and it talks to other processes over the network or through the operating system. A **thread** runs inside a process and shares its memory with the other threads there. Sharing makes threads cheap to coordinate, and it's also what makes them dangerous, since two threads can change the same object at once unless something like a mutex keeps them apart.

**Node.js** runs your JavaScript on one thread per process, driven by an **event loop**. When code starts I/O, like a network call, Node hands the work to the operating system where it can and moves on to the next callback. Some work can't be handed off that way, so Node runs it on the **libuv threadpool**: file system calls, `dns.lookup()`, asynchronous crypto like `crypto.scrypt()` and `crypto.pbkdf2()`, and zlib compression. The pool has 4 threads by default, and `UV_THREADPOOL_SIZE` changes that, but only if it's set before the process starts.

One thread is why Node handles many connections cheaply, and it's also the main risk. While a callback runs, nothing else in that process runs: no other request, no timer, and no health check. The Node docs sum it up as Node being fast when the work for each client at any moment is small. Things that block the loop:

- **Heavy CPU work in JavaScript**, like parsing a JSON body of tens of megabytes, hashing, or mapping a huge provider response in one loop.
- **Synchronous APIs**, like `fs.readFileSync`, `crypto.pbkdf2Sync`, and `zlib.inflateSync`.
- **Regular expressions with nested quantifiers**, like `(a+)*`, run on untrusted input. Some inputs make them take exponential time.
- **Recursive `process.nextTick()` calls**, which run before the loop can reach I/O and starve it.

Fixes, from simplest:

1. **Bound inputs.** Reject or stream payloads over a size limit, so the worst case is known.
2. **Split the work** into chunks and yield between them, so other callbacks get a turn.
3. **Move CPU-heavy work off the loop** with `worker_threads`. The Node docs say workers help with CPU-heavy JavaScript and don't help much with I/O, since Node's built-in async I/O is already more efficient.
4. **Run more processes**, usually one per core, behind a load balancer.

```ts
async function normalizeAll(records: ProviderRecord[]): Promise<RecordRow[]> {
  const rows: RecordRow[] = []
  for (const [i, record] of records.entries()) {
    rows.push(normalize(record))
    if (i % 500 === 499) await new Promise((resolve) => setImmediate(resolve))
  }
  return rows
}
```

One thread doesn't mean no races. Every `await` hands control back to the loop, so two requests in the same process can interleave at each one. And a real deployment runs many processes on many hosts, so the races that matter happen between them anyway.

## Races in services

A **race** is a bug whose outcome depends on the timing of concurrent operations. Two shapes cover most of them.

**Check-then-act.** Code checks a condition and then acts on it, and the condition changes in between.

```ts
async function startSync(connectionId: string): Promise<string> {
  const running = await db.oneOrNone(
    "SELECT id FROM sync_jobs WHERE connection_id = $1 AND status = 'running'",
    [connectionId],
  )
  if (running) return running.id
  const job = await db.one(
    "INSERT INTO sync_jobs (connection_id, status) VALUES ($1, 'running') RETURNING id",
    [connectionId],
  )
  return job.id
}
```

A scheduled sync and a customer's refresh can both run the `SELECT`, both see nothing, and both insert. Now two syncs fetch the same pages from the provider, using double the rate limit.

**Read-modify-write, or lost update.** Code reads a value, changes it in memory, and writes it back, so a concurrent writer's change is overwritten. In a service, this often spans an API round trip. Two people on a customer's team open the same webhook settings, each changes a different field, and each saves the whole object. The second save silently erases the first.

Races also reach outside your system. Some providers rotate **OAuth refresh tokens**: each refresh returns a new refresh token and invalidates the old one. The OAuth security best practice, RFC 9700, goes further and has the server revoke the active token when an invalidated one is used, since it can't tell a thief from a confused client. If two workers refresh the same connection's token at once, the slower one presents a token the provider already invalidated, and the connection can be cut off entirely. The customer has to reconnect, and nothing in your logs looks wrong until you line up the timestamps.

The tools for closing races, roughly from cheapest:

1. **Make it one atomic step** where the data lives: a single `UPDATE`, a unique constraint, or a conditional write.
2. **Make repeats harmless** with idempotency, so a duplicate does no damage.
3. **Detect conflicts** with optimistic concurrency, and retry or report.
4. **Exclude others** with a lock.
5. **Route all work for a key to one place**, like one queue partition or message group per connection, so there's no concurrency for that key at all.

For `startSync`, the fix is the first kind: the partial unique index from the Databases chapter makes the second insert fail, and the caller treats that as "already running."

## Locks and what they cost

A lock makes others wait until the holder is done. There are several kinds, each scoped to a different world:

- **An in-process mutex** protects memory shared by threads. In Node, a promise-based mutex or a queue does the same for async code within one process.
- **Row locks** in the database, like `SELECT ... FOR UPDATE`, block other writers and lockers of those rows until the transaction ends. They don't block plain reads.
- **PostgreSQL advisory locks** lock a number your application chooses, like a hash of a connection id. The database doesn't enforce what they mean, so every code path has to use them. A session-level advisory lock even survives a rolled-back transaction, while a transaction-level one is released when the transaction ends.
- **Distributed locks**, covered in the next section, coordinate hosts that share no database transaction.

Every lock has the same costs, and naming them is part of a good answer.

- **Throughput.** Work under one lock runs one at a time. If a lock is held for 50 ms, that key can do at most 20 operations a second, however many workers you add.
- **Latency.** Waiting for a lock is time the caller sees.
- **Deadlocks.** Two transactions that lock the same rows in opposite orders wait for each other forever. PostgreSQL detects this and aborts one of them, and you can't rely on which. Lock in a consistent order, like by id, and retry transactions that fail with a deadlock.
- **Holding too long.** The PostgreSQL docs call it a bad idea to hold transactions open for long periods. Never hold a row lock while calling a provider. A slow provider then becomes a queue of blocked transactions and a pool of exhausted connections.
- **Holder failure.** A mutex dies with its process, and a database lock is released when its session ends. A lock in a separate service needs an expiry, which brings its own problems.

Lock the smallest thing that keeps the rule, like one connection rather than a whole tenant, and do slow work outside the lock.

## Optimistic concurrency

Optimistic concurrency assumes conflicts are rare and checks for them at write time instead of locking up front. Each row carries a **version number**. A writer reads the row and its version, makes its change, and writes only if the version is still the one it read:

```sql
UPDATE webhook_endpoints
SET url = $3, events = $4, version = version + 1
WHERE id = $1 AND version = $2
```

If no row was updated, someone else changed it first. The writer either re-reads and tries again, for an automatic change, or reports a conflict to the person, for an edit someone made by hand. HTTP has the same idea built in: a client sends `If-Match` with the `ETag` it read, and the server refuses the write if the resource has changed since.

DynamoDB calls this a **conditional write**. A `ConditionExpression` on `PutItem`, `UpdateItem`, or `DeleteItem` must be true for the write to happen, and is checked against the latest version of the item. When it's false, the write fails with `ConditionalCheckFailedException`. Two details are worth knowing: a failed conditional write still consumes write capacity, and setting `ReturnValuesOnConditionCheckFailure` to `ALL_OLD` returns the current item with the error, which saves a read before the retry.

Optimistic concurrency fits when conflicts are rare, like customer settings or connection metadata, and when holding a lock across slow work would hurt. It fits badly when many writers hit the same row all the time. Then most attempts fail and retry, and the retries add load. For a hot row, queue the changes for one writer, split the row, or take a lock.

## Distributed locks, leases, and fencing

Sometimes the work to protect isn't one database write. Only one worker should refresh a connection's OAuth token at a time, or run its backfill. That calls for a lock that hosts share.

Any lock held across a network has to be a **lease**: it expires on its own, so a crashed holder can't block everyone forever. The simple Redis version is `SET lock:connection:42 $token NX PX 30000`, which succeeds only if the key doesn't exist and expires after 30 seconds. The holder releases it only if the value still matches its token, as the Caching chapter describes.

A lease opens a gap that no amount of care closes. Kleppmann's example goes like this:

1. Client 1 takes the lease and starts its work.
2. Client 1 pauses, for a long garbage collection, a slow network, or a paused VM.
3. The lease expires while client 1 is paused, and it can't know.
4. Client 2 takes the lease and writes.
5. Client 1 wakes up, still believing it holds the lease, and writes too.

Checking the lease just before writing doesn't help, because the pause can come after the check. Redis replication adds another gap. The Redis docs point out that if the primary crashes before the lock key reaches a replica, and the replica is promoted, a second client can take the same lock.

The fix is a **fencing token**: a number that goes up every time the lock is granted. The holder sends it with every write, and the resource being protected remembers the highest token it has seen and rejects anything lower. In Kleppmann's example, client 1 holds token 33 and client 2 holds 34, so client 1's late write is refused. The key point is that **the resource does the checking**. A lock service alone can't stop a holder that doesn't know it lost the lock.

For the running example, the database that holds the data can be both the lease and the fence:

```sql
UPDATE connections
SET lease_owner = $2, lease_token = lease_token + 1, lease_expires_at = now() + interval '30 seconds'
WHERE id = $1 AND (lease_expires_at IS NULL OR lease_expires_at < now())
RETURNING lease_token

UPDATE connections
SET sync_cursor = $3
WHERE id = $1 AND lease_token = $2
```

The first statement takes the lease and returns a new token. Every write made under the lease includes the token, so once another worker takes over, the old holder's writes match no rows and it knows to stop. Using the database's `now()` also means one clock decides expiry, instead of each worker's own.

Kleppmann's rule of thumb is to ask what the lock is for:

- **Efficiency**, like stopping two hosts from rebuilding the same cache entry. A rare double run only wastes a little work, so a single Redis lock is enough.
- **Correctness**, like stopping two writers from corrupting a sync cursor. Use fencing tokens checked by the resource, with the lease kept in a system built for consistency, like a database with transactions or a consensus system such as ZooKeeper. The Redis docs agree: if correctness matters, implement fencing tokens.

Side effects outside your system can't check a fencing token, so the provider token refresh needs extra care: keep the lease short, refresh well before expiry, and make a failed refresh fall back to re-reading the latest token from the database.

## Leader election

Some work needs exactly one actor: the scheduler that finds due connections and enqueues their syncs, a cleanup job, or a single writer per shard. **Leader election** picks that actor.

The common way is a lease, like the one above. A record in a database names the current leader and an expiry. The leader **heartbeats** to renew it, and if it stops, another candidate takes over after the lease expires. The Amazon Builders' Library says Amazon mostly uses leases, and that DynamoDB and ZooKeeper both offer lease-based locking clients that are well tested, which beats writing your own.

The same gap applies: there can briefly be zero leaders or two. The Builders' Library suggests:

- **Check the remaining lease often**, especially just before work with side effects, and leave a margin for delays.
- **Make the work idempotent and durable before announcing it done**, so a new leader can safely redo whatever the old one left halfway.
- **Fence writes** where the resource can check a token.
- **Don't heartbeat from somewhere that stays alive when the work dies.** A background thread, or in Node a timer, that keeps renewing the lease while the real work is stuck holds leadership that nobody is using.

The same article says to consider other options first. Leader election adds a single point of failure and a scaling limit. Idempotent APIs, optimistic locking, workflow services, and sharding so each item has its own owner often make a single leader unnecessary.

The scheduler in the running example can do without one. Every scheduler instance claims due connections with `FOR UPDATE SKIP LOCKED`, which skips rows another transaction has locked:

```sql
UPDATE connections
SET next_sync_at = now() + sync_interval
WHERE id IN (
  SELECT id FROM connections
  WHERE next_sync_at <= now()
  ORDER BY next_sync_at
  LIMIT 100
  FOR UPDATE SKIP LOCKED
)
RETURNING id
```

Each instance gets a different batch, any instance can die without a handover, and adding instances adds throughput. The PostgreSQL docs note that skipping locked rows gives an inconsistent view of the data, so this suits queue-like tables and not general queries.

## Worker pools sized to limits

Workers are cheap to add. The dependencies they call are not, so size each pool from what its dependency can take, not from how many workers you can afford.

**Little's law** links the numbers: the number of requests in flight equals throughput multiplied by latency. A provider that allows 10 concurrent requests and answers in 400 ms supports at most 25 requests a second. A pool of 50 workers for that provider doesn't go faster. The other 40 wait, or they get 429s that waste retries.

Little's law also shows why pools need **bulkheads**, separate limits per dependency. If that provider slows from 400 ms to 4 seconds, holding 25 requests a second would need 100 in flight. With one shared pool, the slow provider soaks up every worker and syncs for healthy providers stall. With a limit per provider, only that provider's syncs slow down.

The same arithmetic applies to your own database. Each process keeps a connection pool, so the total is the number of processes multiplied by the pool size. Autoscaling the fleet multiplies connections too, and it has to stay under the database's connection limit, with room for migrations and admin sessions.

In Node, concurrency isn't threads. It's the number of promises in flight, so a limit is a small semaphore:

```ts
function createLimiter(max: number) {
  let active = 0
  const waiting: (() => void)[] = []
  return async function run<T>(task: () => Promise<T>): Promise<T> {
    if (active < max) active += 1
    else await new Promise<void>((resolve) => waiting.push(resolve))
    try {
      return await task()
    } finally {
      const next = waiting.shift()
      if (next) next()
      else active -= 1
    }
  }
}
```

When a task finishes, its slot passes straight to the next waiter instead of being freed and taken again, so a newly arriving task can't slip in between and push the count over `max`. That's a check-then-act race in one thread, closed by never leaving a gap. Remember that this limit is per process. Ten processes with a limit of 10 send up to 100 requests at once, so a limit for the whole fleet needs shared state.

## Rate limiting with a shared token bucket

The API design chapter covers what a token bucket allows: its size sets the burst, and its refill rate sets the long-run average. The hard part in a fleet is making one bucket correct when hundreds of workers share it, like one bucket per provider account.

A bucket needs two stored values: the tokens left and when they were last updated. Taking a token means working out the refill since the last update, capping it at the bucket's size, and taking one token if there's at least one. Done by each worker as read, compute, and write, that's a check-then-act race: two workers both read one token left and both take it. The whole step has to be atomic where the bucket lives.

Redis runs a Lua script atomically, blocking every other command while it runs, so the bucket can live in one short script:

```lua
-- KEYS[1] is the bucket, ARGV[1] the refill per second, ARGV[2] the size
local rate = tonumber(ARGV[1])
local size = tonumber(ARGV[2])
local time = redis.call("TIME")
local now = tonumber(time[1]) * 1000 + math.floor(tonumber(time[2]) / 1000)
local state = redis.call("HMGET", KEYS[1], "tokens", "updated")
local tokens = tonumber(state[1]) or size
local updated = tonumber(state[2]) or now
tokens = math.min(size, tokens + math.max(0, now - updated) / 1000 * rate)
local allowed = 0
if tokens >= 1 then
  tokens = tokens - 1
  allowed = 1
end
redis.call("HSET", KEYS[1], "tokens", tokens, "updated", now)
redis.call("PEXPIRE", KEYS[1], math.ceil(size / rate * 1000) * 2)
return allowed
```

Three details matter:

- **Redis's clock, not the workers'.** The script reads the time with `TIME`, so workers with clocks a little apart can't add tokens that don't exist.
- **Short scripts.** Every other command waits while a script runs, so keep it to a few operations.
- **Expiry.** Idle buckets clean themselves up, and a bucket that's gone simply starts full again.

A central bucket costs a network hop per request and turns busy buckets into hot keys. The Builders' Library describes alternatives for quotas across a fleet. Each server can enforce its share of the quota locally, which is cheap but wrong when traffic isn't spread evenly. Keys can be hashed to dedicated rate-tracking servers, which is accurate but can create hot spots. Or servers can share the rates they've seen every so often, trading accuracy for scale. For provider limits, where going over means 429s or a suspended account, the shared bucket is usually worth its hop.

A bucket controls how often work starts, and a pool controls how much runs at once. Providers often state both, like 20 requests a second and 10 in flight, so use both. When a 429 arrives anyway, back off and respect `Retry-After`, as the API design chapter describes.
