# Interview method and estimates

A system design interview gives you about 45 minutes to turn a vague prompt into a working design and then show that you can find and fix its weak spots. Most people who struggle don't lack knowledge. They run out of time, design the wrong thing, or never get past the first sketch. A fixed method solves all three, and it gives you somewhere to stand when nerves kick in.

This chapter covers that method, the arithmetic that keeps your numbers honest, and what a senior or staff answer sounds like at each step.

## The shape of 45 minutes

| Step | Minutes | What you leave behind |
|---|---|---|
| Requirements | 5 to 8 | A short list of features and the qualities that matter, with numbers |
| Estimates | 2 to 5 | Only the numbers that change a decision |
| API and data model | 5 | The calls clients make and the core entities |
| High-level design | 10 to 15 | Boxes and arrows that meet every core requirement |
| Deep dives | 10 to 15 | Fixes for the riskiest parts, tied to the requirements |
| Wrap-up | 2 to 3 | Trade-offs, failure modes, and what you'd do next |

The times bend to the question. A data pipeline question spends longer on the data flow, and a public API question spends longer on the API. What doesn't bend is the order: you can't judge a design before you know what it's for, and you can't run a deep dive on a design that doesn't exist yet.

Say the plan out loud in the first minute. Something like "I'll pin down requirements, do a little math, sketch the API, get a simple design working end to end, then go deep on the parts most likely to break." The interviewer now knows where you're going, and so do you.

## Requirements

Split them in two.

**Functional requirements** are what the system does, phrased as "a client can..." statements. Real products have hundreds of features. Pick the three or four that define this one, agree on them, and say out loud what you're leaving out. A long list doesn't impress anyone, and every extra feature costs you design time later.

**Non-functional requirements** are the qualities the system needs, and they're where the design really comes from. Make each one specific to this system, and put a number on it where you can. "Low latency" says nothing, because every system wants that. "Reads of the latest data in under 300 ms at p99" tells you where to spend effort.

A checklist helps you not forget one:

- **Scale**: how many users, requests, or records, and how bursty
- **Latency and freshness**: how fast a response must come back, and how stale the data may be
- **Availability versus consistency**: during a network partition, is it better to answer with possibly stale data or to refuse
- **Durability**: what happens if data is lost, and can it be fetched again
- **Correctness**: are duplicates or missing records acceptable, and what about order
- **Security and compliance**: tenancy, access control, personal data, and audit
- **Cost**: is there a budget that rules out the obvious answer

For a backend role that talks to many outside systems, ask about the outside systems too. How reliable are they? Do they push data or must you pull it? Do they limit how fast you can call them? Those answers drive the design more than any feature does.

Finish by naming the one or two requirements that will shape the design most. That sentence is a strong senior signal, because it shows you know where the hard part is before you start drawing.

## Estimates

Do math only when it can change a decision. Working out daily active users, requests per second, and storage, only to conclude "so, it's a lot," adds nothing. Good reasons to estimate are deciding whether data fits on one machine, how many partitions a stream needs, whether a cache is worth it, or whether an outside rate limit makes a plan impossible.

You can tell the interviewer you'll estimate as you go, when a number is needed. That's a choice, not a dodge, as long as you then do the math at the moment it matters.

### The numbers to carry

A day has 86,400 seconds. Round it to 100,000 and the rest follows.

| Per day | Average per second |
|---|---|
| 1 million | about 12 |
| 100 million | about 1,200 |
| 1 billion | about 12,000 |

Traffic is never flat, so multiply the average by a peak factor, often 2 to 10, and design for the peak.

For storage, multiply count by size by how long you keep it by how many copies you store. A billion records of 1 KB each is 1 TB a day. Kept for 90 days with three copies, that's 270 TB.

For bandwidth, divide bytes per day by 100,000. Two terabytes a day is about 20 MB per second on average, so perhaps 60 to 100 MB per second at peak.

Know a few modern limits so you don't over-build. A single large cloud server can have hundreds of gigabytes of memory and over a hundred virtual CPUs. A round trip inside one data center zone is well under a millisecond, between zones in a region a millisecond or two, and between regions tens to a hundred or more milliseconds. Many candidates shard data that would fit on one machine because they learned numbers from years ago.

### Doing it out loud

Keep the arithmetic in powers of ten, round hard, and say each step.

```text
2 TB/day ingested, average record 2 KB
records/day = 2e12 / 2e3 = 1e9
records/sec = 1e9 / 1e5 = 1e4 average, ~3e4 peak
storage, 90 days, 3 copies = 2 TB x 90 x 3 = 540 TB
```

Then say what the number means: "Thirty thousand writes a second at peak, arriving in bursts, is more than I want one relational primary to absorb directly, so I'll put a log in front to smooth the bursts and partition the writes." The decision is the point, not the arithmetic.

Sanity-check before moving on. If a number surprises you, look again. A slip by a factor of 1,000 between KB and MB is the most common mistake, and catching it yourself reads well.

## API and data model

Next, write down the contract between the system and its clients. This keeps the design honest, because every box you draw later has to serve one of these calls.

List the **core entities** first, the nouns the system stores and returns. Keep the list short. You'll add fields as you find out what each request needs.

Then list the **calls**. Default to REST with plural resource names unless there's a reason not to. Reach for an event stream, a webhook, or a bulk export when clients need data pushed to them or need a lot of it at once.

```text
POST /v1/connections            { provider, credentials }  -> Connection
GET  /v1/connections/{id}       -> Connection with status
GET  /v1/records?connection=..&updated_after=..&cursor=..  -> page of Record
POST /v1/webhook-endpoints      { url, events }  -> Endpoint
```

A few habits help:

- Take the caller's identity from the auth token, never from a field in the body.
- Mark which writes must be safe to retry, and plan an idempotency key for them.
- Name the read pattern for each entity, like "by connection, newest first," because that decides your keys and indexes later.

## High-level design

Now draw the simplest design that meets every core requirement. Walk through the API one call at a time and add the components each call needs: a gateway, services, queues, stores, and caches. Describe the data as it moves: "The sync worker pulls a page from the provider, writes the raw page to object storage, normalizes it, and upserts the records keyed by provider and record id."

Write the important fields next to each store as you go, not in a separate schema at the start. Skip the obvious ones. Nobody needs to see that a user has a name.

The biggest risk here is adding complexity too early. When you spot a place for a cache or a queue that isn't needed for correctness, say so in one sentence, write a note on the board, and keep going. A complete simple design beats an elaborate half of one, because the interviewer can't assess a deep dive on a system that never worked end to end.

## Deep dives

With a working design on the board, spend the remaining time making it hold up. Good deep dives come from three places:

1. **The non-functional requirements.** If you promised 30,000 writes a second, show how the write path scales. If you promised no lost records, show where each record is durable and what happens when each step fails.
2. **The weak spots you noted while drawing.** A single database, a hot key, a call to a slow outside system, or a step that isn't safe to retry.
3. **The interviewer's questions.** These often point straight at what they want to assess, so treat a question as a gift and follow it.

How much you lead depends on level. A mid-level candidate can wait for the interviewer to point at problems. A senior or staff candidate is expected to pick the riskiest parts without being asked, explain why they're risky, and fix them. Still leave room for questions. Talking over the interviewer costs you on communication and can hide the one thing they wanted to hear.

A useful pattern for each deep dive is problem, options, choice, and cost. "Provider APIs fail often. I could retry inline, retry from a queue with backoff, or run each sync as a durable workflow. I'll use a queue with a dead-letter queue, because syncs are independent and short. The cost is that a sync can run twice, so the upsert must be idempotent."

### Where to look in event-driven systems

For the kind of system this track focuses on, the riskiest parts are usually these:

- **Unreliable outside calls**: timeouts, retries with backoff, and what happens during a long outage
- **Duplicates and order**: at-least-once delivery means every consumer must handle the same message twice
- **Hot spots**: one tenant or one provider taking all the capacity
- **Backlogs**: what happens when consumers fall behind, and how you'd know
- **Replays and backfills**: rebuilding data after a bug without double counting

## Wrap-up

Save the last few minutes to step back. Name the two or three biggest trade-offs you made, how the design fails, and what you'd do with more time. For each trade-off, say what you gave up and what would change your mind. "I chose a log over a plain queue because customers need replay. If replay weren't needed, a queue would be cheaper to run."

Failure modes are worth naming even when you've handled them: what happens when a provider is down for a day, a region goes away, a bad deploy corrupts data, or a customer's endpoint stops answering. Saying how you'd notice each one, through metrics, alarms, or a health status, shows you've run systems, not just drawn them.

## What makes it senior

The structure is the same at every level. The difference is judgement.

| Mid-level answer | Senior or staff answer |
|---|---|
| Lists every requirement | Picks the few that matter and says which one is hardest |
| Computes every number | Computes the numbers that decide something |
| Adds a cache because systems have caches | Adds a component only when a requirement needs it |
| Waits to be asked about failure | Raises failure modes first and designs for them |
| Names one option | Compares options and explains the choice for these requirements |

None of this needs to be perfect. Interviewers expect you to change your mind as you learn more. Saying "I'd revisit this choice now that we know the order matters" is a strength, not a stumble.
