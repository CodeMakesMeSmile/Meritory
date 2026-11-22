# Trade-off fundamentals

Every design choice buys one quality by spending another. Faster reads can cost freshness, more nines cost money and release speed, and a second copy of anything costs the work of keeping it in step. Interviewers listen for whether you can name the trade, put a number on it, and say why your choice fits this system. This chapter gives you the words and the arithmetic that the later chapters build on.

The running example is the one used across the track: an API that unifies data from hundreds of outside providers. Customers call it to read connections and records, and a fleet of workers keeps the data fresh by calling the providers.

## Latency and throughput

**Latency** is how long one request takes, from the caller's point of view. **Throughput** is how many requests the system finishes per second. They're related, and improving one can hurt the other.

Batching is the classic example. A sync worker that writes 500 records in one statement does far more writes per second than one that writes each record on its own, but the first record in each batch waits for the other 499. Pipelining, compression, and larger pages make the same trade: a little more latency per item for more throughput overall.

Load ties the two together. A server can only finish so much work per second. Once requests arrive faster than that, the extra ones wait in a queue, and waiting is latency. In the simplest queueing model, the average wait in line is the service time multiplied by `busy / (1 - busy)`, where `busy` is the fraction of time the server is working:

| Server busy | Average wait in line |
|---|---|
| 50% | 1 times the service time |
| 80% | 4 times |
| 90% | 9 times |
| 99% | 99 times |

Real systems don't follow the formula exactly, but the shape holds. Latency stays flat for a while, then climbs steeply as a server nears full use, while throughput barely grows. That's why services are sized to run well below full use at peak, and why a fleet at 85% CPU can already feel slow.

## Percentiles and the tail

An average hides the requests people complain about. If 99 requests take 20 ms and one takes 2 seconds, the average is about 40 ms, which describes no request at all.

Percentiles describe the distribution instead:

- **p50**, the median: half the requests are faster than this. It's the typical experience.
- **p99**: 99 in 100 requests are faster. It's a plausible worst case for one request.
- **p99.9** and beyond: the far tail, which matters for heavy users and for requests that make many calls.

The Site Reliability Engineering book makes the same case: an average can stay flat all day while the slow tail changes a lot, so it treats latency as a distribution and watches high percentiles.

### Fan-out makes the tail common

The tail matters more than it looks, because requests fan out. In "The Tail at Scale," Dean and Barroso describe servers that usually answer in 10 ms but take a full second at the 99th percentile. A request to one server is slow 1 time in 100. A request that must wait for 100 such servers is slow 63% of the time, because the chance that all 100 are fast is 0.99 to the 100th power, about 37%.

The running example has the same shape. Reading one stored record touches one store. A "refresh this connection now" request that calls 12 provider endpoints in parallel is only as fast as the slowest of the 12, so it inherits every provider's tail. If each endpoint is slow 1 time in 100, about 11 refreshes in 100 are slow.

Ways to live with the tail:

- **Hedged requests.** Send a second copy of a slow request to another replica, use whichever answer arrives first, and cancel the other. Dean and Barroso suggest hedging only after the first request has been out longer than the 95th percentile, which keeps the extra load to about 5%. In one of their benchmarks, hedging after 10 ms cut the 99.9th percentile from 1,800 ms to 74 ms while sending only 2% more requests. Hedge reads and other calls that are safe to repeat, and never toward a provider whose rate limit you're close to.
- **Timeouts set from percentiles**, which the Queues and async work chapter covers.
- **Fewer calls on the critical path.** Serve the customer's read from your own stored copy and refresh from the provider in the background, so provider tails never reach the customer.

When you state a latency requirement, state the percentile with it. "p99 under 300 ms for reads of stored records" says what you'll design for.

## Availability in nines

Availability is the share of time, or of requests, in which a service does its job. It's usually quoted in nines:

| Availability | Downtime per year | Per 30-day month |
|---|---|---|
| 99% | about 3.65 days | about 7.2 hours |
| 99.9% | about 8.8 hours | about 43 minutes |
| 99.95% | about 4.4 hours | about 22 minutes |
| 99.99% | about 53 minutes | about 4.3 minutes |
| 99.999% | about 5 minutes | about 26 seconds |

Treat the number as a **budget** you spend. At 99.9%, one 45-minute bad deploy uses up a month's allowance. At 99.99%, there's no time for a person to be paged, log in, and roll back by hand, so detection and recovery have to be automatic.

Many teams measure by requests instead of minutes: successful requests divided by valid requests, over windows of one or five minutes. That's fairer for a busy API, where a partial outage fails some requests and not others.

### Dependencies multiply

A **hard dependency** is one you can't work without, and your availability can't beat the product of your hard dependencies. AWS's reliability guidance gives the example of a 99.99% service with two independent hard dependencies, each at 99.99%. Together they reach about 99.97%.

For the running example, this is the central fact. Providers are outside your control, and some are far less available than you'd like. If a customer's read needed a live call to the provider, your read availability could be no better than that provider's. Serving reads from your own stored copy makes the provider a **soft dependency**: when it's down, reads still work and only freshness suffers. Write down which dependencies are hard and which are soft, and move the important paths onto soft ones.

## CAP and PACELC, stated carefully

The CAP theorem is quoted often and loosely. A careful version reads like this:

> While a network partition stops some replicas from reaching others, a replicated system can't both answer every request and guarantee that every answer reflects the latest write. Until the partition heals, it gives up one of the two.

Three points keep you out of trouble.

1. **Partitions happen whether you plan for them or not.** Networks between machines fail, so a distributed system has to decide what it does during one. Calling a distributed system "CA" only means nobody has said what it does when the network splits.
2. **The choice only applies during a partition.** Brewer, who proposed CAP, wrote twelve years later that "two of three" misleads. Partitions are rare, and the rest of the time a system can be both consistent and available.
3. **The choice is made per operation, at a timeout.** Brewer describes the decision as what happens when a reply doesn't arrive in time: cancel the operation and lose availability, or go ahead and risk inconsistency. Different operations can choose differently, and a system should log what it did during the partition so it can repair things afterwards.

For the running example, during a partition between your regions:

- **Listing records a customer already synced** can answer from the local copy, even if it's a little stale.
- **Starting a backfill that must stay inside a tenant's plan limit** can wait or refuse until the regions agree, because two regions each approving their own backfill breaks a rule that's hard to repair.

### PACELC

Abadi points out that CAP says nothing about normal operation, yet replicated databases give up consistency every day for another reason: latency. Keeping replicas in step means waiting for them, and waiting is latency, especially across regions. His PACELC formulation reads: if there's a **P**artition, choose between **A**vailability and **C**onsistency, **E**lse choose between **L**atency and **C**onsistency.

| Class | During a partition | In normal operation | Examples in Abadi's 2012 paper |
|---|---|---|---|
| PA/EL | Stays available, copies may diverge | Answers fast, possibly stale | Default setups of Dynamo, Cassandra, and Riak |
| PC/EC | Refuses rather than diverge | Waits for replicas to agree | Fully ACID systems like VoltDB and Megastore, and BigTable |
| PC/EL | Blocks updates when an item's master is cut off | Reads any replica, possibly stale | The default setup of PNUTS |

Abadi argues that the else half has shaped real databases more than CAP has, because it applies to every request while partitions are rare. Many stores let you pick per request. DynamoDB, for example, reads eventually consistent by default and gives a strongly consistent read, which uses more read capacity, when you set `ConsistentRead`. The Databases chapter covers how to choose a consistency level per read.

Use PACELC in an interview by stating both halves for each part of the design. "Customer record reads are PA/EL, since a copy a second behind is fine. Sync checkpoints are PC/EC, since a stale checkpoint repeats or skips work."

## Stateless services and scaling

A service is **stateless** when any instance can serve any request, because nothing a later request needs lives only in one instance's memory or disk. Sessions, uploads in progress, job state, and anything that must stay correct go to shared stores, like a database, Redis, or object storage. The twelve-factor guidance says processes should be stateless and share nothing, and that sticky sessions shouldn't be relied on. Local memory is still fine as a cache that's allowed to be empty.

Statelessness is what makes the rest of this chapter cheap:

- **Scaling out** is adding instances behind a load balancer.
- **Deploys** replace instances one at a time without losing anyone's work.
- **A crashed instance** loses only its in-flight requests, which callers can retry.

There are two ways to add capacity.

- **Vertical scaling**, or scaling up, moves to a bigger machine. It needs no code changes and no coordination, which makes it a sensible first move for a stateful part like a single PostgreSQL primary. It has a ceiling, resizing usually means a restart or a failover, and one big machine is still one machine.
- **Horizontal scaling**, or scaling out, adds more machines. It has no hard ceiling and adds redundancy along the way, but it needs stateless services, or, for stateful ones, the partitioning and replication the Databases chapter covers.

The running example uses both. The API and the sync workers scale out freely, since they're stateless, while the main database scales up first and is partitioned later if it must be. Some limits don't move with either. If a provider allows 20 requests per second per account, a thousand more workers sync that account no faster.

## Load balancing

A load balancer spreads requests across healthy instances. Two choices matter: how it picks an instance, and how it decides an instance is healthy.

### Picking an instance

- **Round robin** sends each request to the next instance in turn. AWS's Application Load Balancer (ALB) uses it by default, and it suits requests of similar cost on similar instances.
- **Least connections** sends each request to the instance with the fewest requests in progress. ALB calls this **least outstanding requests**, and it suits requests whose cost varies a lot, like a quick record lookup next to a large export.
- **Random**, optionally weighted, spreads requests evenly without tracking anything. ALB's weighted random option can also turn traffic down on targets whose error rates stand out from their peers.

Two traps catch people.

- **Black holes.** An instance that fails every request instantly looks like the least busy one, so least-connections balancing sends it more traffic, not less. The Amazon Builders' Library describes this exact failure. Health checks and error-rate detection have to catch it.
- **Cold starts.** A new instance can be slow until its caches and connections warm up. ALB's slow start mode raises a new target's share gradually, but it only works with round robin.

### Health checks

ALB checks each target on a schedule, by default every 30 seconds for instance and IP targets. A target has to pass one check before it gets traffic. By default, two failures in a row take it out of service and five successes in a row bring it back. If every target fails its checks at once, ALB **fails open** and sends traffic to all of them, since a whole fleet failing together is more likely a bad check than a dead fleet.

That behavior points at the real question: how deep should a health check go? The Builders' Library separates three kinds.

- **Liveness**: the process is up and answering.
- **Local health**: things only this instance owns, like its disk and its own processes.
- **Dependency health**: whether it can reach the database, a cache, or another service.

A dependency check catches real problems, like an instance whose credentials expired. But when a shared dependency fails, every instance fails the check at the same moment, and the load balancer either removes the whole fleet or fails open. The guidance is to keep fast load balancer checks local and leave dependency health to systems that react more carefully. For the running example, a provider outage must never fail your health checks, or one provider's bad day becomes your outage.

## Single points of failure and redundancy

A **single point of failure** is any one part whose loss stops the system. Look for them in every box and arrow: one database primary with no standby, one scheduler host, one network path, one region, one secrets store, or one person who knows how to deploy.

Redundancy removes them, and AWS's reliability guidance shows why it works. Two independent components at 99.9% each give about 99.9999% together, since both must fail at once. The word doing the work is **independent**. Two instances in the same zone, running the same bad config, or trusting the same expired certificate fail together, and the pair is barely better than one. Spread copies across **Availability Zones**, which are physically separate locations within a region, and roll changes out one zone at a time so a bad change can't reach every copy at once.

Spare capacity has to exist before it's needed. The Builders' Library calls this **static stability**: the system keeps working through a failure without changing anything. Its example runs in three zones and over-provisions by 50%, so each zone runs at about 66% of the load it was tested for. Losing one zone leaves exactly enough. Launching replacements during an outage would make recovery depend on a control plane that may be struggling at the same moment.

For stateful parts, redundancy means a standby or replicas that can take over, which the Databases chapter covers. For jobs that must run in only one place, like the scheduler that enqueues due syncs, you need a design where two copies running is harmless, or a leader chosen by lease. The Concurrency and coordination chapter covers both.

## Back-pressure and load shedding

Every service has a capacity, and demand sometimes passes it. A big customer starts a backfill, a provider comes back after an outage and every waiting sync fires at once, or retries pile up. What happens next depends on the design.

Without protection, overload feeds itself. Queues grow, so latency grows. Once latency passes the callers' timeouts, the server spends its time on requests whose callers already gave up, and those callers retry, adding more load. The server stays busy while **goodput**, the work finished in time to be useful, falls toward zero. The Builders' Library article on load shedding says wasting work is the last thing an overloaded system should do.

**Back-pressure** is the gentle answer: a stage that's full tells the stage before it to slow down. In code, that's a bounded queue whose producer waits or gets an error when it's full, a worker that stops taking messages it can't finish, or an API that answers 429 with a `Retry-After` header. An unbounded queue hides overload until memory or latency runs out.

**Load shedding** is the firm answer: near its limit, a server rejects the excess early and cheaply, so the work it accepts stays fast. Practical rules from the Builders' Library and the SRE book:

- **Reject before doing work.** A rejection at the door costs almost nothing. A rejection after reading the database wastes everything spent so far.
- **Bound time in the queue,** not only its length. Drop requests that have waited longer than their caller will wait, since nobody will read the answer.
- **Pass deadlines along,** so each layer knows how much time is left and skips work that can't finish in time.
- **Shed by priority.** The SRE book tags each request with a criticality and sheds the lowest first. In the running example, a customer's on-demand refresh outranks a backfill, so backfills pause first.
- **Degrade before failing.** Serve stored data instead of making a live provider call, or a smaller result instead of an error.
- **Test past the breaking point,** so you know what overload looks like before customers do. The goal is goodput that levels off near capacity and stays flat as load keeps rising.

Retry budgets and per-provider rate limits, from the Queues and async work and API design chapters, apply the same idea to the calls you make.

## Cost as a design constraint

Cost is a requirement like latency or availability, and it's the one candidates most often forget to mention. Every technique in this chapter has a price.

- **Nines.** AWS's reliability guidance notes that higher availability targets need more testing, more automated recovery, slower and more careful releases, and a narrower choice of dependencies. Set the target each path actually needs. A customer read API and a nightly report rarely need the same number.
- **Static stability** means paying for capacity that sits idle most of the time, like the 50% headroom above.
- **Redundancy across zones and regions** multiplies instances and adds traffic between them.
- **Strong consistency** costs latency, and some stores charge for it directly, as DynamoDB's strongly consistent reads do.
- **Hedged requests** spend a few percent more load to shorten the tail.

The running example has costs of its own. Provider calls may be metered or capped, so refreshing everything every minute can be impossible as well as expensive. Keeping raw payloads in object storage costs a little storage and saves calling providers again after a mapping bug. Capacity sized for the daytime peak can scale in overnight, and backfills can run on cheaper capacity that's allowed to be interrupted, since they resume from checkpoints.

A good habit is to price the design you drew, roughly: how many instances, how much storage per month, and how many calls per provider per day. Then say what you'd cut first if the budget were halved, and what that would cost in latency, freshness, or availability. That answer shows you understand the trade-offs, which is what the interviewer is listening for.
