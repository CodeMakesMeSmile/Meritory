# Networking

Every arrow on a design diagram is a network call, and each one has costs that the boxes hide: a name to look up, connections to open, timers that fire, and middle boxes that hold state. Interviewers rarely ask you to recite headers. They ask why a failover took four minutes, why a service hung while its CPU sat idle, why the load balancer returned 502s after a deploy, or how a dashboard should hear about progress. This chapter gives you the parts of the network that answer those questions.

The running example is the one used across the track: an API that unifies data from hundreds of outside providers. Customers call it, a fleet of workers calls the providers, and some providers call back with webhooks. Other chapters cover the neighbors of this one. Trade-off fundamentals covers load balancing algorithms and health checks, Queues and async work covers retries and how to pick one timeout's value, and API design covers webhooks from the sender's side, rate limits, and pagination.

## Names, DNS, and TTLs

Before a worker can call `api.provider.example`, it needs an IP address. It asks a **recursive resolver**, usually one the operating system or the cloud network provides. On a miss, the resolver walks from the root servers to the servers for `.example` to the provider's **authoritative** servers, which hold the real records. Then it caches the answer.

Every record carries a **TTL**, the number of seconds it may be cached. RFC 1035 defines it that way, and a TTL of zero means the answer is good only for the lookup in progress. Caches sit at many layers: the recursive resolver, the operating system, sometimes the language runtime, and, easy to forget, every open connection. A pooled connection never looks the name up again, so it keeps talking to the old address for as long as it stays open.

In Node.js, `dns.lookup()` calls the operating system's `getaddrinfo` on the libuv threadpool, the same small pool the Concurrency and coordination chapter warns about. `dns.resolve4()` and its siblings query the network directly and can return each record's TTL.

The TTL is a trade:

- **A long TTL** means fewer lookups, lower latency, and a smaller DNS bill, but changes take that long to reach everyone.
- **A short TTL** means changes spread quickly, at the cost of more lookups.

The usual practice is to lower a record's TTL a day or so before a planned change, make the change, and raise it again once you're sure. Route 53's guidance for a record in use is to start a change with a short value like 300 seconds and raise it after confirming the new settings.

### Why DNS failover is slow

DNS failover means answering with a different address when the primary one is unhealthy. It works, but it's never fast, because several delays add up.

1. **Detection.** Health checks have to see enough failures in a row. Route 53 checks every 30 seconds by default, or every 10 for an extra charge, and changes an endpoint's status only after a number of consecutive failures, the failure threshold. With 30-second checks and a threshold of 3, about 90 seconds pass before the record changes.
2. **Caches.** Resolvers keep the old answer until its TTL runs out. Route 53 recommends a TTL of 60 seconds or less on records tied to a health check, so the worst case adds another minute.
3. **Clients that ignore the TTL.** Some runtimes and resolvers cache longer than they should. AWS's Network Load Balancer docs warn that clients that don't honor the TTL keep sending requests to an address removed from DNS, and those requests fail.
4. **Open connections.** Keep-alive connections and connection pools hold the old address until they close.

So DNS suits coarse moves, like sending traffic to another region, where a few minutes is acceptable. For failover inside a region, put one stable name in front of a load balancer and let the load balancer route around failed instances in seconds, as Trade-off fundamentals describes.

For the running example, providers move their servers too. Workers should never cache a provider's IP address themselves, and pooled connections should have a maximum lifetime, like a few minutes, so a provider's DNS change reaches every worker.

## Handshakes and round trips

A **round trip**, or RTT, is the time for a packet to reach the other side and a reply to come back. Inside one data center it's well under a millisecond. To a provider on another continent it can be 100 to 200 ms. Opening a secure connection costs several round trips before the first byte of the request can go out.

- **TCP** opens with a three-way handshake: SYN, SYN and ACK, then ACK. That's one round trip before data, as RFC 9293 describes.
- **TLS 1.2** adds two more round trips for a full handshake, because the client and server exchange two flights of messages before either can send application data.
- **TLS 1.3** needs one. The client sends its key share in its first message, so the server can derive keys and finish in a single reply. RFC 8446 calls this the 1-RTT handshake. If the server can't use the client's key share, it asks again with a HelloRetryRequest, which costs another round trip.
- **QUIC**, which HTTP/3 runs on, folds the transport and TLS 1.3 handshakes together. RFC 9001 says a client can send application data after one round trip.

Add one more round trip for the request and its response, and a fresh connection looks like this:

| Setup | Round trips before the request leaves | Round trips to the first response |
|---|---|---|
| TCP and TLS 1.2 | 3 | 4 |
| TCP and TLS 1.3 | 2 | 3 |
| QUIC, new connection | 1 | 2 |
| Reused connection | 0 | 1 |

A worker 150 ms away from a provider that opens a new TLS 1.3 connection for every call waits at least 450 ms per call, and only 150 of that is the request. A DNS lookup on a cache miss adds more. Reusing connections, the next section, removes almost all of it.

### 0-RTT and its catch

TLS 1.3 and QUIC let a client that has talked to a server before send **early data**, also called 0-RTT, in its very first flight. It saves a round trip, and it comes with two warnings from RFC 8446: early data has no forward secrecy, and there's no guarantee it won't be replayed across connections. An attacker who captures the first flight can send it again.

RFC 8470 sets the rules for HTTP. Clients must not send unsafe methods, like `POST`, in early data. Servers can refuse early data altogether, wait until the handshake completes before acting, or answer **425 Too Early** so the client retries after the handshake. RFC 8446 adds that even requests usually considered idempotent can be abused when replayed thousands of times. For the running example, a `GET` that lists records could use 0-RTT. A `POST` that starts a sync never should.

## Connection reuse and pools

HTTP/1.1 connections are **persistent** by default. RFC 9112 lets many requests share one connection, one after another, until either side closes it. Reuse saves the handshake round trips, the CPU work of the TLS handshake, and something less obvious: the side that closes a TCP connection keeps it in the **TIME-WAIT** state for twice the maximum segment lifetime. RFC 9293 takes that lifetime to be 2 minutes, so a closed connection lingers for 4. A worker that opens and closes a connection per call to one busy provider can pile up thousands of sockets in TIME-WAIT and run out of local ports.

In Node.js, the `http.Agent` keeps the pool. A new `Agent` has `keepAlive` off by default and allows unlimited sockets per host. The global agent has used keep-alive, with a 5-second idle timeout, since Node 19. When you set `maxSockets` and a host already has that many sockets busy, further requests wait in the agent's queue until a socket frees up.

RFC 9112 also says a client can't assume an idle connection stays open, since the server or anything between may close it at any time. A request sent on a connection the server closed a moment earlier fails with a reset, and a client should retry it on a new connection if the request is safe to repeat.

### Pool exhaustion

A pool caps how many connections a process holds to one destination, and that cap is where many outages begin. Little's law from the Concurrency and coordination chapter explains it: connections in use equal calls per second multiplied by how long each call holds a connection. When a provider slows from 200 ms to 5 seconds, the same traffic needs 25 times as many connections. The pool fills, new calls wait in its queue, and the service looks hung while its CPU sits idle. If the pool is shared, calls to healthy providers wait in the same line.

The defenses:

- **A timeout on getting a connection**, separate from the request timeout. Waiting forever for a free connection hides the problem until callers give up.
- **Request timeouts** on every call, so slow calls give their connections back.
- **A pool per provider**, a bulkhead, so one slow provider fills only its own pool.
- **Pool sizes from Little's law and the provider's limits**, not from guesses.
- **Metrics on pool wait time and pool use**, which show exhaustion before the timeouts do.

The same arithmetic applies to the database, where the total is processes multiplied by pool size, as the Concurrency and coordination chapter covers.

### Idle timeouts must nest

Both ends of a keep-alive connection have an **idle timeout**, after which they close it. The end that sends requests should always give up on an idle connection first. If the server closes first, the client can send a request at the same instant the connection dies, and the request fails.

This bites behind load balancers. AWS's Application Load Balancer (ALB) closes idle connections after 60 seconds by default, and its docs recommend setting the application's idle timeout higher than the load balancer's. Otherwise the load balancer may send a request on a connection the application already closed, and the client gets a **502 Bad Gateway**. Node's `server.keepAliveTimeout` defaults to 5 seconds, far below 60, so a Node service behind an ALB with default settings will return occasional 502s until `keepAliveTimeout` is raised above the load balancer's idle timeout.

## HTTP/1.1, HTTP/2, and HTTP/3

**HTTP/1.1** sends one request at a time on a connection. Pipelining lets a client send several, but the server must answer them in order, so one slow response blocks the rest. That's **head-of-line blocking** at the HTTP layer, and it's why HTTP/1.1 clients open several connections to one server for parallel requests.

**HTTP/2** splits each request and response into frames on its own **stream**, and interleaves many streams on one TCP connection. One connection carries many requests at once, and headers are compressed. RFC 9113 is careful to say what it doesn't fix: TCP head-of-line blocking. TCP delivers bytes strictly in order, so when one packet is lost, every stream on the connection waits for the retransmission, even streams whose data arrived.

**HTTP/3** runs over **QUIC**, which runs over UDP. QUIC has streams of its own, and RFC 9114 explains the gain: a stream that loses a packet doesn't stop the others. QUIC also sets up faster, as the handshake section showed, and uses connection IDs so a connection survives the client's address changing, like a phone moving from Wi-Fi to cellular. A client usually learns a server speaks HTTP/3 from an `Alt-Svc` header on an earlier response, and falls back to TCP if UDP is blocked.

| | HTTP/1.1 | HTTP/2 | HTTP/3 |
|---|---|---|---|
| Transport | TCP | TCP | QUIC over UDP |
| Requests in flight per connection | One | Many | Many |
| Head-of-line blocking | At HTTP and TCP | At TCP | Neither, per stream |
| New secure connection | 2 or 3 round trips | 2 or 3 round trips | 1 round trip |
| Survives an address change | No | No | Yes |

Where it matters for the running example:

- **Customer-facing API.** Offering HTTP/2 and HTTP/3 at the edge helps customers on long or lossy paths and costs you little, since the load balancer or CDN handles it.
- **Worker to provider.** You speak whatever each provider supports, often HTTP/1.1. A warm keep-alive pool gets most of the benefit.
- **Service to service inside a region.** Loss is rare and round trips are short, so HTTP/1.1 with pools works well. HTTP/2's main gain there is fewer connections.

## Layer 4 and layer 7 load balancers

The layers come from the OSI model. A **layer 4** load balancer works with connections: TCP or UDP flows identified by addresses and ports. A **layer 7** load balancer works with requests: it ends the client's HTTP connection, reads each request, and opens its own connections to the targets.

AWS's two main load balancers show the difference.

- **Network Load Balancer (NLB)**, layer 4. It picks a target for each TCP connection with a hash of the protocol, the addresses, the ports, and the sequence number, and keeps that connection on that target for its whole life. It never reads HTTP. It gives each zone a static IP address, handles millions of requests per second, carries any TCP or UDP protocol, and also supports QUIC.
- **Application Load Balancer (ALB)**, layer 7. It routes each request by rules on the path, host, headers, method, query string, or source IP, picks a target per request with round robin or least outstanding requests, and can redirect, return fixed responses, or authenticate users.

The difference that catches people is **balancing per connection instead of per request**. Behind a layer 4 balancer, a client that opens one long-lived connection, like an HTTP/2 connection carrying hundreds of requests, a WebSocket, or a warm keep-alive pool, sends all of it to one target. New instances added during a scale-out get only new connections, so the old instances stay hot. Fixes are a layer 7 balancer that spreads requests, or a cap on connection lifetime so clients reconnect and spread out. ALB itself closes a client connection gracefully after its HTTP client keepalive duration, one hour by default, and its docs suggest lowering it so clients move away from an impaired zone sooner.

Choose layer 7 for HTTP APIs that need routing by path or host, balancing per request, or web firewall rules. Choose layer 4 for protocols that aren't HTTP, for very many connections, when TLS must pass through untouched to the targets, or when someone needs fixed IP addresses. That last case comes up in the running example: some customers only accept webhooks from IP addresses on their firewall's allow list. The two combine, since an NLB can send its traffic to an ALB as its target.

## Timeouts at every hop

The Queues and async work chapter covers picking one timeout's value, starting from a high percentile of the dependency's latency. A real request crosses many hops, and each has its own timers: the customer's SDK, the load balancer, the API server, its database queries, its calls to providers, and the wait for a pooled connection. They only work together if they **nest**.

**Request timeouts get shorter as you go deeper.** Each hop should give up before the hop that's waiting on it. If an API gateway waits 10 seconds but the service behind it waits 30 for a provider, then after 10 seconds the caller has given up and the service keeps working for up to 20 more seconds on an answer nobody will read. The Amazon Builders' Library makes the same point about retries deep in a stack: the client will give up anyway, because it has its own timeouts. Under load, that wasted work is what pushes a struggling service over the edge.

**Idle timeouts go the other way.** As the keep-alive section showed, the server's idle timeout must be longer than the client's.

Fixed timeouts at each hop drift out of step as code changes. The Site Reliability Engineering book's answer is **deadline propagation**: set one deadline at the top of the stack and pass the time remaining down with each call. Its example: if a server has a 30-second deadline and spends 7 seconds before calling a backend, that call gets 23 seconds, trimmed by a few hundred milliseconds for network transit. Each stage checks the time left before starting work, and when a caller gives up, the cancellation flows down too, so nobody keeps working for it.

```ts
async function callProvider(url: string, deadline: number): Promise<Response> {
  const remaining = deadline - Date.now() - 200
  if (remaining <= 0) throw new DeadlineExceeded()
  return fetch(url, { signal: AbortSignal.timeout(Math.min(remaining, 8_000)) })
}
```

The call takes whichever is shorter, its own limit or the time left. For the running example, a customer's request to refresh a connection shouldn't hold a connection open while syncs run. The API design chapter's answer is to return `202 Accepted` with a sync to poll, so the long work runs under its own deadlines in the workers.

## Pushing updates to clients

Sometimes a client wants to hear about changes as they happen: a dashboard showing a sync's progress, or a page that should update when a connection breaks. HTTP is request and response, so there are four ways to push.

**Short polling** asks every few seconds. It's simple and wastes most requests on "nothing new."

**Long polling** sends a request that the server holds open until something happens or a timeout passes, and the client sends a new request after each response. RFC 6202 describes its costs: full headers on every message, a worst-case delay of more than three network transits, and an open request held for each waiting client. It recommends caution with long timeouts, since many proxies and network devices close requests sooner, and says 30 seconds is generally safer than the 120 that some experiments reached. Its strength is that it's plain HTTP, so it works through nearly every proxy.

**Server-sent events (SSE)** keep one HTTP response open and stream `text/event-stream` messages down it, one way, server to client. The HTML standard builds in reconnection: the browser reconnects on its own and sends the `id` of the last event it saw in a `Last-Event-ID` header, so the server can resume where it left off. A `retry` field sets the reconnection delay, and a `204` response tells the client to stop. Because some proxies drop quiet connections, the standard suggests a comment line every 15 seconds or so. Events are UTF-8 text only.

**WebSockets** start as an HTTP request asking to upgrade, which the server accepts with `101 Switching Protocols`. RFC 6455 then gives a full two-way channel over the one TCP connection, with messages sent as frames and ping and pong frames for keeping the connection alive. You build everything else yourself: reconnecting, resuming after a gap, and refreshing credentials on a connection that may live for hours.

| | Long polling | Server-sent events | WebSockets |
|---|---|---|---|
| Direction | Server to client | Server to client | Both ways |
| Built on | Ordinary requests | One long response | An upgraded connection |
| Reconnect and resume | The client's next request | Built in, with `Last-Event-ID` | Yours to build |
| Through proxies | Almost always works | Usually, with heartbeats | Needs proxies that allow upgrades |
| Data | Any | UTF-8 text | Text or binary |

For the running example, server-to-server customers are best served by webhooks, as the API design chapter covers. A browser dashboard watching a sync is a good fit for SSE: updates flow one way, and resuming after a dropped connection is built in. WebSockets earn their cost when the client also sends a steady stream of messages, like a shared editor, which this product doesn't have.

Long-lived connections bring costs of their own at scale:

- **Each one holds memory and a socket** on the server, even when idle.
- **They defeat balancing per request**, as the load balancer section showed.
- **Deploys drop them all at once.** Clients must reconnect with jitter, or every client returns in the same second.
- **The event happens somewhere else.** A sync finishes on a worker, but the browser is connected to one of many API servers. A pub/sub channel, like Redis or a message bus, carries the event to whichever server holds that connection.

## Receiving webhooks

The API design chapter covers webhooks from the sender's side: how to sign them, retry them, and tell customers to verify them. The running example also sits on the other end. Many providers send webhooks when data changes, each with its own signing scheme, retry habits, and quirks, and you receive them for every connected account.

**Keep the receiver separate.** Give it its own small service and route, like `POST /hooks/{provider}`, so a flood of provider webhooks can't slow customer reads, and the reverse. Cap the body size and reject anything for an unknown provider before reading further.

**Verify before trusting anything.** Each connector knows its provider's scheme, usually an HMAC over the raw body with a shared secret, sometimes a public-key signature. Verify against the exact raw bytes, compare in constant time, and check the timestamp, as the API design chapter describes. Then find the connection from your own records, using the provider's account id after the signature checks out. Never let a field in the body choose the tenant.

**Reply fast and process later.** Senders wait only so long. The Standard Webhooks spec suggests senders time out somewhere between 15 and 30 seconds, and treats anything other than a 2xx as a failure to retry. A slow receiver gets retries on top of its load, and a provider may disable an endpoint that keeps failing. So the receiver does only what must happen before the 2xx: verify, write the delivery somewhere durable, and answer.

```ts
export async function receiveWebhook(provider: string, rawBody: Buffer, headers: Headers): Promise<number> {
  const connector = connectors.find(provider)
  if (!connector || rawBody.length > maxWebhookBytes) return 404
  if (!connector.verifyWebhook(rawBody, headers)) return 401
  await inbox.send({ provider, receivedAt: Date.now(), headers: [...headers], body: rawBody.toString("base64") })
  return 202
}
```

**Expect duplicates, and remove them in the consumer.** Senders retry when they don't see a 2xx in time, so the same event arrives twice. Standard Webhooks keeps the `webhook-id` the same across retries and suggests using it as an idempotency key, and most providers send some event id. The consumer reading the inbox records each event id in the same transaction as its work and skips repeats. Deduplicating in the receiver before enqueueing would lose events: if the receiver marks an id as seen and then fails to enqueue, the retry is skipped as a duplicate.

**Don't trust the order.** Retries and parallel delivery reorder events. The safest use of a provider webhook in the running example is as a **hint**: it says a connection has changes, and the consumer triggers an on-demand sync, which fetches the current state from the provider's API with your stored credentials. Order and stale payloads then stop mattering. A provider that doesn't sign its webhooks can still be used this way, since nothing in the body is trusted. And as the Case studies chapter explains, scheduled polling stays on as the safety net, because webhooks get lost.

A few more habits round it out. Rotate each provider's signing secret with an overlap where the provider supports it. Rate limit the receiver per provider, so a provider stuck in a retry loop can't take it over. Alarm when a provider's webhooks stop arriving, since silence often means a broken subscription, not a quiet day.
