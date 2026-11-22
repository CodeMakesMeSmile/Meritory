# Caching

A cache keeps a copy of data somewhere faster or cheaper to reach than its source. It buys lower latency, lower cost, and protection for a slow or rate-limited dependency, and it pays for them with stale data and a second system that can fail. Interviewers rarely ask whether to add a cache. They ask where it sits, how it stays fresh, and what happens when it's empty, stampeded, or wrong.

The running example is the same as in the Databases chapter: an API that unifies records from hundreds of outside providers, with customers reading connections, records, and provider metadata.

## Where caches sit

A request can meet a cache at several layers, and each one has a different owner and a different way of going stale.

| Layer | Example | Good at | Watch out for |
|---|---|---|---|
| Client | Browser cache, an SDK's memory | Skipping the network entirely | You can't purge it from the server |
| CDN | CloudFront | Public responses near users | Private, per-tenant data |
| In-process | A map inside each service host | Fastest reads, no network hop | Every host has its own copy |
| Shared cache | Redis or Memcached | One copy for the whole fleet | A network hop and another system to run |
| Database buffer | PostgreSQL shared buffers | Hot pages kept in memory automatically | Only helps if the working set fits |

**Client and CDN caches** are driven by HTTP headers. `Cache-Control: max-age=600` lets browsers keep a response for ten minutes. CloudFront also reads `s-maxage`, so a shared cache can keep a response for a different time than browsers do. Without a cache policy, CloudFront's default TTL is 24 hours. For an API whose responses are private to each tenant, CDN caching rarely helps, but it suits public docs, static assets, and public reference data like the list of supported providers and their logos.

**In-process caches** are quick to build and add no network hop. Their costs grow with the fleet: each host holds its own copy, so two requests can get different answers depending on which host serves them, every host misses separately, and a deploy starts every host cold.

**Shared caches** like Redis hold one copy for the fleet. Downstream load no longer grows with the number of hosts, and deploys don't empty the cache. In exchange there's a network hop, a cluster to operate, and code to write for when the cache is slow or down.

**The database's own buffer** is the cache people forget. PostgreSQL keeps recently used pages in `shared_buffers`, and the docs suggest starting at 25% of memory on a dedicated server, since PostgreSQL also relies on the operating system's cache. If a slow query reads data that doesn't fit in memory, a bigger instance or a better index can beat a new caching layer, with no staleness at all.

Layers combine. A common shape is a small in-process cache with a TTL of a few seconds in front of a shared cache, in front of the database.

## Reading and writing through a cache

Four patterns describe who loads the cache and when.

**Cache-aside**, also called lazy loading, is the most common. The application checks the cache, and on a miss it reads the database, stores the result with a TTL, and returns it.

```ts
async function getConnection(id: string): Promise<Connection> {
  const key = `connection:v3:${id}`
  const cached = await cache.get(key)
  if (cached) return JSON.parse(cached)
  const connection = await db.findConnection(id)
  await cache.set(key, JSON.stringify(connection), { EX: 300 })
  return connection
}
```

Only data someone asked for gets cached, and if a cache node dies, the application keeps working, only slower. A miss costs three trips: the cache, the database, and the cache again. Without a TTL or invalidation, cached values go stale. The `v3` in the key is the format version. When the shape of a cached object changes, bump it, so new code never reads values old code wrote.

**Read-through** works the same way, except the cache layer loads the data on a miss instead of the application. Application code gets simpler, but the cache sits inline on every read, so its availability becomes part of yours.

**Write-through** updates the cache on every write to the database. Recently written keys are always fresh, at the cost of a slower write and a cache full of data nobody reads, which a TTL trims. A new, empty cache node still misses until each key is written again, so write-through is usually combined with cache-aside.

**Write-behind**, or write-back, writes to the cache first and flushes to the database later, often in batches. Writes are fast and repeated writes to one key collapse into one. If the cache loses data before the flush, those writes are gone. That rules it out for records of truth, like connection state, and makes it a fit for things like view counters, where losing a few seconds is acceptable.

## TTLs and invalidation

A **TTL** bounds how stale a value can get. Choose it from two questions: how stale can callers tolerate, and how often does the source change? Provider metadata that changes monthly can live for hours. A connection's health status might get 30 seconds. Base the numbers on hit rates and real staleness complaints, and revisit them, because arbitrary TTLs that nobody checks have caused real outages.

Add **jitter** to TTLs. Keys written together, like everything loaded after a deploy, otherwise expire together and come back as a burst of misses.

When data changes, **invalidate** the cached copy:

1. Commit the change to the database.
2. **Delete** the cache key. Don't write the new value into it.
3. Let the next read load the fresh value.

Deleting is safer than setting. Two writers that each set the cache can finish in the wrong order and leave the older value behind, while a delete just forces the next read to the source. A small race remains: a reader that loaded the old value just before the write can store it just after the delete. That's one reason to **keep a TTL even when you invalidate**. Another is that an invalidation can fail, like a crash between the commit and the delete. When invalidation has to be reliable, publish change events through a transactional outbox and have a consumer delete the keys.

**Versioned keys** avoid invalidation entirely. Put a version in the key or URL, like `app.3f9a1c.js` or `connection:42:v17`, and a change becomes a new key while old ones expire. For static assets this lets you set a very long `max-age`, since a new release uses new file names.

### Serving stale on purpose

Sometimes stale is better than nothing. With a **soft and hard TTL**, a client tries to refresh after the soft TTL, and if the source fails, keeps serving the old value until the hard TTL. That keeps your service up while a dependency recovers. CDNs offer the same idea as headers. CloudFront honors `stale-while-revalidate`, serving the old copy while it fetches a new one in the background, and `stale-if-error`, serving the old copy when the origin is down or returns a 5xx error.

## Eviction

Memory runs out, so a full cache has to pick what to drop.

- **LRU**, least recently used, drops what hasn't been read for the longest time. It works well when recent use predicts reuse, which is common. A one-off scan of many keys, like a nightly export through the cache, can push the whole hot set out.
- **LFU**, least frequently used, drops what's read least often. Steady favorites survive a scan. It needs a way to forget, so yesterday's favorite doesn't stay forever.

Redis sets its limit with `maxmemory` and its choice with `maxmemory-policy`:

- `allkeys-lru`, which the Redis docs suggest as a good default when a subset of keys gets most reads.
- `allkeys-lfu` for steady favorites. Redis keeps a small probabilistic counter per key and decays it over time, every minute by default.
- `volatile-lru`, `volatile-lfu`, and `volatile-ttl`, which only evict keys that have an expiry.
- `noeviction`, which refuses new writes with an error once memory is full. Reads still work.

Redis approximates LRU by sampling a few keys and evicting the oldest among them, which is close to true LRU for real access patterns and uses far less memory. If one Redis holds both cache data and data you must keep, the docs suggest running two instances instead of mixing them under one policy.

Watch the **hit rate** and the **eviction count**. Many evictions and a low hit rate mean the cache is too small or the policy doesn't match how keys are read.

## Stampedes

When a popular key expires, every request that misses before it's reloaded goes to the source at once. This is a **cache stampede**, also called dog-piling. The research on it gives a simple example: a key read 10 times a second that takes 3 seconds to rebuild gets rebuilt by 30 requests. Those rebuilds compete for the same database, which makes each one slower, which lets even more requests join.

Several tools prevent it, and they combine well.

**Request coalescing** keeps one load in flight per key. Within a process, later callers wait for the first caller's result:

```ts
const inFlight = new Map<string, Promise<string>>()

function loadOnce(key: string, load: () => Promise<string>): Promise<string> {
  const pending = inFlight.get(key)
  if (pending) return pending
  const promise = load().finally(() => inFlight.delete(key))
  inFlight.set(key, promise)
  return promise
}
```

Proxies like Nginx and Varnish can do this for you, and CloudFront's Origin Shield consolidates requests for the same object so as few as one reaches your origin.

**A lock across the fleet** coalesces between hosts. The first host to miss runs `SET lock:connection:42 $token NX PX 5000`, which succeeds only if the lock doesn't exist yet, and rebuilds the value. The others serve a stale copy or wait briefly and read again. Use a random token, and release the lock only if it still holds your token, so a slow host can't delete a lock another host took after its own expired. Locks cost an extra write, need a lock TTL longer than a rebuild, and if the holder crashes, nobody refreshes until the lock expires. For stampede protection, an occasional second rebuild is harmless, so a simple lock is enough. Locks that protect correctness need much more care.

**Early refresh with jitter** refreshes a key before it expires, and randomly, so requests don't all decide at the same moment. In the XFetch approach, each read rolls a die that grows more likely to trigger a refresh as expiry nears and as the rebuild gets slower:

```ts
function shouldRefreshEarly(entry: { expiresAt: number, rebuildMs: number }, beta = 1): boolean {
  return Date.now() - entry.rebuildMs * beta * Math.log(Math.random()) >= entry.expiresAt
}
```

`Math.log(Math.random())` is negative, so the check pretends it's a random amount later than now, scaled by how long a rebuild takes. A `beta` of 1 works well, and a higher value refreshes earlier. One request refreshes while the rest keep reading the cached value.

**Background refresh** suits a small set of keys you know are hot, like the provider catalog. A job reloads them on a schedule, so they never expire under load.

## Hot keys

A single key can be too popular for the node that holds it. In a sharded cache each key lives on one shard, so a key read hundreds of thousands of times a second can max out that shard while the others idle. The tools mirror write sharding in the Databases chapter:

- **A short in-process cache in front.** Even a TTL of one to five seconds on each host turns a flood of network reads into one read per host per interval.
- **Copies of the key.** Store N copies, like `providers:catalog#1` through `#8`, which land on different shards. Readers pick one at random, and writers update or delete all N.
- **Replicas of the shard**, so reads spread across more nodes.

Finding hot keys is half the work. Track per-key traffic in a sample of requests, and alarm when one shard's load stands far above the rest.

## Negative caching

A request for something that doesn't exist misses the cache every time, because there's nothing to store. A flood of lookups for missing records, or calls to a provider that keeps failing, all go straight to the source. **Negative caching** stores the absence or the error itself, with its own, shorter TTL.

- Cache "not found" for a record id for a short time, like 30 seconds.
- Cache a provider's failure briefly too, so a thousand requests don't each wait on a provider that's down.
- When something is created, delete any negative entry for it, or a new record looks missing until the TTL ends.

The risk of not doing this is real. Services that cached nothing during errors have kept hammering failing or deleted resources, turning a small fault into an outage. CloudFront has the same idea built in: it caches error responses like a 404 for a configurable time before asking the origin again.

## What stale data costs

Every cached value can be wrong for up to its TTL, so ask what wrong costs.

| Data | If it's stale | Approach |
|---|---|---|
| Permissions and API key revocations | Someone keeps access they lost | Read from the source, or a very short TTL plus invalidation |
| Idempotency keys and sync checkpoints | Work runs twice or gets skipped | Don't cache. Read the source of truth |
| A connection's health status | A customer sees "healthy" for a broken link | Short TTL plus invalidation on change |
| Provider catalog and logos | A new provider shows up a little late | Long TTL or versioned keys |

## When not to cache

A cache is worth adding when the same data is read many times, the source is slow, costly, or rate-limited, and callers can tolerate some staleness. Skip it, or look elsewhere first, when:

- **Every request is different**, so the hit rate would be close to zero.
- **The source is already fast** and has headroom. Fix a missing index before adding a layer.
- **The data must be exact right now**, like the cases in the table above.
- **Writes far outnumber reads**, so the cache spends its time being invalidated.

There's one more risk to plan for whenever you do cache. Over time, a database behind a good cache gets sized for the traffic that misses. If the cache then empties after a failure, a flush, or a cold start, the full load lands on a dependency that can no longer take it, and both go down. Keep the source able to survive without the cache, or cap and shed the load that falls back to it, and test with the cache turned off.
