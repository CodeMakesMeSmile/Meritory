# Databases

Most designs come down to questions about data: where it lives, how it's found, and what happens when many writers touch it at once. Interviewers rarely want a product name on its own. They want the access patterns, the trade-off you picked, and what breaks at ten times the load.

This chapter uses one running example: a platform that pulls records from hundreds of outside providers, upserts each record by the provider's id, and serves customers who ask for "everything updated after this point" with a cursor.

## Picking a kind of store

**Relational databases**, like PostgreSQL, keep rows in tables with a fixed schema. You can join tables, enforce rules like uniqueness and foreign keys, and change many rows in one transaction. You can design a normalized schema first and ask new questions of it later, because the query planner works out how to answer them.

**Key-value stores**, like DynamoDB, find an item by its key, and can also read a range of items that share a partition key, sorted by a sort key. They scale out by spreading keys across partitions and give steady latency at very large volume. The price is flexibility. A query the key design didn't plan for turns into a slow, expensive scan, which is why DynamoDB's own guidance says not to design a table until you know the questions it must answer.

**Document stores** keep each record as a nested document, like JSON, whose shape can differ from one record to the next. They suit data that is read and written as a whole, like a provider's raw payload, and they struggle when you need joins or rules that span documents.

For the provider platform, a sensible split looks like this:

- **Relational** for tenants, connections, sync jobs, and checkpoints. This data is small, full of relationships, and needs rules like "one running sync per connection."
- **Relational first, key-value later** for normalized records. Customers filter and sort in ways you can't fully predict, so start relational while one database keeps up, and move the highest-volume, key-only reads and writes to a key-value store when it can't.
- **Object storage** for raw provider payloads, keyed by connection and fetch time, so a mapping bug can be replayed without calling the provider again.

Give the reason for each part. "A relational database because sync state needs uniqueness and transactions" is a stronger answer than "a relational database because it's familiar."

## Indexes

Without an index, finding rows means reading the whole table. An index is a separate sorted structure that points at rows. In PostgreSQL, `CREATE INDEX` builds a **B-tree** unless you ask for another type. A B-tree keeps keys in order, so it answers equality, ranges like `updated_at > $1`, and sorted reads like `ORDER BY updated_at` without a separate sort.

### Composite indexes

An index on several columns sorts by the first column, then by the second within each value of the first, like a phone book sorted by last name and then first name. That order decides which queries it helps. Equality on the leading columns, plus a range on the next column, narrows the part of the index that's read. A filter that skips the first column usually can't use the index well.

The customer sync query is a good example:

```sql
CREATE INDEX records_sync_idx ON records (connection_id, updated_at, id)

SELECT id, version, updated_at, body
FROM records
WHERE connection_id = $1
  AND (updated_at, id) > ($2, $3)
ORDER BY updated_at, id
LIMIT 100
```

The row comparison `(updated_at, id) > ($2, $3)` compares left to right, so it means "after this cursor position," with the id breaking ties between equal timestamps. Equality on `connection_id` and a range from the cursor position read one connection's slice of the index, already in order, and the query stops after 100 rows. Swap the column order to `(updated_at, connection_id)` and the database has to wade through every connection's rows in that time range to find one connection's.

Keep composite indexes short. The PostgreSQL docs suggest using them sparingly and note that more than three columns rarely help.

### Covering indexes

Normally an index finds the row, and the database then reads the table for the other columns. If every column a query needs is in the index, PostgreSQL can answer with an **index-only scan**. `INCLUDE` adds payload columns that are stored in a B-tree index but not searched:

```sql
CREATE INDEX records_changed_ids ON records (connection_id, updated_at, id) INCLUDE (version)
```

Two cautions apply. Index-only scans only pay off when most of the table's pages are marked all-visible, which holds for tables that change slowly. And wide payload columns bloat the index and slow searches. Covering the large `body` column of a busy records table is a poor trade, while covering a small `version` column for a "which ids changed?" query can be a good one.

### What indexes cost

Every index is kept in step with its table, so each insert, each delete, and many updates also write to every index. Indexes take disk and memory, and the PostgreSQL docs note they can also prevent an update optimization called heap-only tuples (HOT). On an ingestion table taking thousands of upserts a second, each extra index is paid on every write. Add indexes for queries you actually run, check with `EXPLAIN` that they're used, and drop the ones that aren't.

### Upserts and unique indexes

The records table needs exactly one row per provider record, so a **unique index on the provider's id**, scoped to the connection, does two jobs: it stops duplicates, and it lets you upsert. PostgreSQL's `INSERT ... ON CONFLICT DO UPDATE` guarantees an atomic insert or update even under heavy concurrency, and its `WHERE` clause lets a newer copy win over an older one:

```sql
CREATE UNIQUE INDEX records_source_key ON records (connection_id, external_id)

INSERT INTO records (connection_id, external_id, version, body, updated_at)
VALUES ($1, $2, $3, $4, now())
ON CONFLICT (connection_id, external_id) DO UPDATE
  SET version = excluded.version, body = excluded.body, updated_at = now()
  WHERE records.version < excluded.version
```

Notice that `updated_at` here is the time your platform changed the row, not the provider's own timestamp. Customers page by your `updated_at`, so a provider record that arrives late still shows up after their cursor. Transactions can commit in a different order from their start times, so the customer contract still needs a small overlap, as the API design chapter describes.

## Transactions and isolation

A transaction groups changes so that all of them happen or none do. **Isolation** decides what concurrent transactions see of each other. Full isolation, where every transaction acts as if it ran alone, costs waiting or retries, so databases offer weaker levels that each allow certain **anomalies**:

- **Dirty read**: seeing another transaction's change before it commits.
- **Nonrepeatable read**: reading a row twice in one transaction and getting different values, because another transaction committed in between.
- **Phantom read**: running the same query twice and getting a different set of rows.
- **Serialization anomaly**: transactions that all commit, with a result no one-at-a-time order could produce.

The SQL standard defines four levels by which of these they allow:

| Level | Dirty read | Nonrepeatable read | Phantom read | Serialization anomaly |
|---|---|---|---|---|
| Read uncommitted | Allowed | Possible | Possible | Possible |
| Read committed | No | Possible | Possible | Possible |
| Repeatable read | No | No | Possible | Possible |
| Serializable | No | No | No | No |

PostgreSQL differs in useful ways:

- **Read Committed is the default.** Each statement sees a snapshot taken when that statement starts, so two `SELECT`s in one transaction can disagree.
- **Read Uncommitted behaves exactly like Read Committed**, so dirty reads never happen.
- **Repeatable Read** uses one snapshot for the whole transaction and doesn't allow phantoms. If it tries to change a row that another transaction changed and committed, it fails with a serialization error, and the whole transaction must be retried.
- **Serializable** uses serializable snapshot isolation. It watches for read and write patterns that could produce an anomaly and fails one transaction with SQLSTATE `40001`. Code that uses it must be ready to retry the whole transaction.

### Lost updates

The most common concurrency bug in application code is a read, a change in memory, and a write back:

```ts
const job = await db.one("SELECT attempts FROM sync_jobs WHERE id = $1", [id])
await db.none("UPDATE sync_jobs SET attempts = $2 WHERE id = $1", [id, job.attempts + 1])
```

Under Read Committed, two workers can both read 3 and both write 4, and one attempt is lost. Three fixes, from simplest:

1. **Do it in one statement**: `UPDATE sync_jobs SET attempts = attempts + 1 WHERE id = $1`.
2. **Lock the row first** with `SELECT ... FOR UPDATE`, so the second worker waits for the first.
3. **Check a version** in the update, `WHERE id = $1 AND version = $2`, and retry if no row matched. This is optimistic concurrency.

### Write skew

Write skew is subtler. Two workers each ask "is a sync already running for this connection?", both see none, and both insert one. Neither changed a row the other changed, so Repeatable Read lets both commit. Serializable would fail one of them. A simpler fix is to make the rule a constraint the database enforces, like a partial unique index:

```sql
CREATE UNIQUE INDEX one_running_sync ON sync_jobs (connection_id) WHERE status = 'running'
```

Now the second insert fails, and the worker treats that as "a sync is already running." When a rule can be written as a constraint, prefer that to a higher isolation level.

## Replication and read replicas

With **leader-based replication**, one primary takes every write and streams changes to replicas, which serve reads. Most replicas apply changes **asynchronously**, so a replica can be behind the primary. That gap is **replica lag**.

- **Amazon RDS read replicas** are updated asynchronously. RDS can also keep a synchronous standby for high availability, but that standby can't serve reads.
- **Aurora replicas** read the same shared storage volume as the writer, so lag is usually well under 100 milliseconds, though it grows during heavy writes. A cluster can have up to 15, and one is promoted if the writer fails.

Replicas scale reads, not writes. Every write still goes to the primary, and every replica must apply all of them. A write-heavy ingestion load needs batching, partitioning, or a store that spreads writes.

Lag causes two classic bugs:

- **Missing your own write.** A customer changes a setting, the page reloads from a replica, and the old value comes back. Fix it by sending that user's reads to the primary for a short time after a write, or by waiting until the replica has applied the write's position in the change log.
- **Time going backwards.** Two reads hit two replicas, and the second is further behind. Pinning a session to one replica gives **monotonic reads**.

A good rule is to decide per read path. Sync workers read their own checkpoints and job state from the primary, because acting on a stale checkpoint repeats or skips work. A customer-facing list can read from a replica if the docs say data may be a few seconds behind.

## Partitioning and sharding

When one machine can't hold the data or take the writes, split the data into **partitions**, each owned by one node. Sharding usually means spreading partitions across separate database servers. PostgreSQL's declarative partitioning splits one table into pieces on one server, and the same questions about keys apply to both.

There are three common schemes:

- **Range**, like by month or by id range. Range scans are cheap, but sequential keys send every new write to the last partition.
- **Hash** of the key. Writes spread evenly, but a range query across keys has to visit every partition.
- **List** of explicit values, like by region. It suits data that must live in a known place.

A good partition key has:

1. **Many distinct values**, so there are enough to spread.
2. **Even traffic** across those values.
3. **A place in the main queries**, so most requests go to one partition instead of asking all of them and merging the answers.

For records from many providers, `connection_id` fits well. There are many connections, and both the sync worker and the customer list query filter by it. The provider's name is a poor key, with only a few hundred values and the biggest providers far heavier than the rest. The date is a poor key for writes, since every write today lands in one partition. The tenant id works until one tenant is a hundred times bigger than the others.

Changing the number of partitions is the expensive part. With `hash(key) mod N`, going from N to N + 1 moves almost every key. Consistent hashing, or many small logical partitions mapped onto fewer servers, moves only a small fraction. Rules that span partitions get hard too. A unique constraint usually has to include the partition key, and a transaction across partitions needs coordination most systems avoid.

## Hot keys and hot partitions

Even a good key has skew: one huge tenant, one viral record, or one counter every request touches. A **hot key** sends more traffic to one partition than it can take.

DynamoDB makes the limit concrete. Each partition can serve at most 3,000 read units and 1,000 write units per second. Burst capacity saves up to five minutes of unused throughput for short spikes. **Adaptive capacity** raises throughput for busy partitions automatically, and can even move one very busy item onto a partition of its own. One item still can't go past the partition maximum, so past that point the design has to change.

Ways to spread a hot key:

- **Write sharding.** Add a suffix from 1 to N to the key, so writes spread over N partitions. A random suffix spreads best, but readers must query all N keys and merge. A suffix computed from another attribute, like a hash of the record id, spreads nearly as well and lets you find one item directly.
- **Split counters.** Keep N counter rows and add them up on read, instead of updating one row on every event.
- **Append, then aggregate.** Write each event as a new row and roll them up later, instead of updating one row in place.
- **Cache hot reads**, which the next chapter covers.
- **Isolate the giant.** Give a tenant that dwarfs the rest its own partition, queue, or cluster.

Hot rows hurt relational databases too. A single row that every request updates turns concurrent transactions into a queue of lock waits, which looks like a slow database when the real problem is the data model.

## Time-series and append-heavy data

Events, sync runs, webhook deliveries, audit logs, and fetch history share a shape. They're written once, read mostly while recent, and deleted after a retention period. Three patterns suit them:

**Partition by time.** In PostgreSQL, range partitioning by day or month routes each row to its period's partition. The planner skips partitions outside a query's time range, called partition pruning. Removing old data becomes `DROP TABLE` or `DETACH PARTITION` on a whole partition, which is far faster than a bulk `DELETE` and avoids the `VACUUM` work a bulk delete leaves behind.

**Use small indexes for time order.** A BRIN index stores only a summary, like the lowest and highest value, for each range of table blocks. It's tiny, and it works well when a column follows the table's physical order, like a timestamp on rows that are only ever appended.

**Don't make time the whole key in a distributed store.** If the partition key is today's date, every write hits one partition. DynamoDB's guidance for high-volume time series is one table per period. The current table gets the capacity, older tables are scaled down, and old tables can be moved to the cheaper Standard-IA table class, archived, or deleted.

Beyond these, keep summaries, like hourly counts per connection, for dashboards, and move old raw data to object storage instead of keeping it in the hot database.

## Consistency choices

"Consistent" means different things in different places. For reads across copies of data, the useful levels are:

- **Strong**: a read sees every write that finished before it.
- **Read-your-writes**: a client always sees its own writes, though others' writes may lag.
- **Monotonic reads**: a client never sees data go backwards.
- **Eventual**: copies agree once writes stop, and until then a read may be stale.

DynamoDB shows the trade in numbers. Reads are eventually consistent by default and cost half as much as strongly consistent reads, which you ask for with `ConsistentRead`. Global secondary indexes and streams are always eventually consistent. Global tables replicate across Regions, by default eventually and typically within a second, or with a strong consistency mode that replicates to another Region before a write returns.

Pick per read path, not per system:

| Read | Level | Why |
|---|---|---|
| Check a tenant's plan limit before starting a backfill | Strong | Acting on stale data breaks a rule |
| Show a customer the setting they just saved | Read-your-writes | They notice their own change missing |
| Sync worker loads its checkpoint | Strong | A stale checkpoint repeats or skips work |
| Dashboard counts and search results | Eventual | A few seconds behind is fine, and cheaper |

Stronger reads cost more, add latency, or depend on one primary being reachable. Weaker reads are cheaper and keep working when a node is far away or down. Say which one each part of your design needs, and why.
