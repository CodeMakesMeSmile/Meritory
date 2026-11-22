# Model answer

This is one strong answer, not the only one. Compare where it draws its boundaries with where you drew yours, and how much of the code changes for the extension at the end.

## Questions and assumptions

- **How many processes?** One, with jobs in memory. Each provider's limits apply to this process only.
- **What does a job do?** It calls something that runs one sync. The scheduler doesn't care how, so the work sits behind an interface.
- **What counts as worth retrying?** Errors the job runner marks as retryable, like a provider timeout or a 429. A rejected credential is final.
- **What does cancel mean for a running job?** Signal the runner to stop, and treat the job as cancelled whatever it returns afterwards.
- **What happens to an on-demand job when a job for that connection is already running?** It waits behind it, since two jobs for one connection must never overlap.

The change I expect next is fairness between tenants, so the provider limits will sit behind one interface that can be wrapped.

## Entities

- **JobSpec**, a value: connection, tenant, provider, and priority.
- **Job**, an entity: an id, its spec, its state, its attempt count, and an `AbortController` for cancelling.
- **ProviderQueue**: waiting jobs for one provider, ordered by priority, then by arrival.
- **ProviderGate**: decides whether a job may start now, from the provider's token bucket and its cap on running jobs.
- **RetryPolicy**: decides whether a failed job retries, and after how long.
- **JobRunner**: does the work. In production it wraps the sync runner.
- **Clock**: the current time and a way to be woken later, so tests control time.
- **Scheduler**: the service that ties them together, with `submit`, `cancel`, and `status`.

## Interfaces

```ts
type Priority = "onDemand" | "scheduled" | "backfill"

type JobSpec = {
  connectionId: string
  tenantId: string
  provider: string
  priority: Priority
}

type JobState =
  | { status: "waiting", notBefore: number }
  | { status: "running" }
  | { status: "succeeded" }
  | { status: "failed", error: string }
  | { status: "cancelled" }

interface JobRunner {
  run(spec: JobSpec, signal: AbortSignal): Promise<void>
}

interface ProviderGate {
  tryAcquire(spec: JobSpec, now: number): boolean
  release(spec: JobSpec): void
  nextChance(provider: string, now: number): number
}

interface RetryPolicy {
  delayBefore(attempt: number, error: unknown): number | undefined
}

interface Clock {
  now(): number
  wakeAt(time: number, callback: () => void): void
}
```

`ProviderGate` takes the whole spec, not only the provider name, so a later gate can look at the tenant too.

## The job lifecycle

| From | Event | To |
|---|---|---|
| Waiting | The gate admits it | Running |
| Waiting | Cancelled | Cancelled |
| Running | The runner succeeds | Succeeded |
| Running | A retryable error with attempts left | Waiting, with a `notBefore` time |
| Running | Any other error | Failed |
| Running | Cancelled | Cancelled, and the runner's signal is aborted |

`Job.apply(event)` runs a pure transition function over this table and throws on any other move, so no code sets `status` directly.

## Walking the flow

An on-demand job arrives for connection `c1` while its provider's tokens are used up.

1. `submit` checks for a waiting job for `c1`. If there is one, it raises that job's priority to on demand and returns its id, which is the merge. Otherwise it creates a job in the waiting state and adds it to the provider's queue ahead of scheduled and backfill jobs.
2. `submit` calls `dispatch`.
3. `dispatch` asks each provider's queue for the first job that is ready, whose connection isn't running, and that the gate admits. The gate has no token, so nothing in that provider's queue starts. Other providers' queues aren't blocked by this one.
4. The scheduler asks the gate when a token will next be free and sets a wake-up with the clock.
5. When the clock fires, `dispatch` runs again, the gate admits the job, and `start` runs it.

```ts
class Scheduler {
  private readonly jobs = new Map<string, Job>()
  private readonly waiting = new Map<string, Job>()
  private readonly running = new Set<string>()
  private readonly queues = new Map<string, ProviderQueue>()

  constructor(private readonly deps: SchedulerDeps) {}

  private dispatch(): void {
    const now = this.deps.clock.now()
    for (const [provider, queue] of this.queues) {
      let job = queue.first(now, (j) => !this.running.has(j.spec.connectionId) && this.deps.gate.tryAcquire(j.spec, now))
      while (job) {
        queue.remove(job)
        void this.start(job)
        job = queue.first(now, (j) => !this.running.has(j.spec.connectionId) && this.deps.gate.tryAcquire(j.spec, now))
      }
      const wake = Math.min(queue.earliestReady(now), this.deps.gate.nextChance(provider, now))
      if (wake < Number.POSITIVE_INFINITY) this.deps.clock.wakeAt(wake, () => this.dispatch())
    }
  }

  private async start(job: Job): Promise<void> {
    this.waiting.delete(job.spec.connectionId)
    this.running.add(job.spec.connectionId)
    job.apply({ type: "started" })
    let outcome: JobEvent
    try {
      await this.deps.runner.run(job.spec, job.abort.signal)
      outcome = { type: "succeeded" }
    } catch (error) {
      const delay = this.deps.retry.delayBefore(job.attempt + 1, error)
      outcome = delay === undefined
        ? { type: "gaveUp", error: String(error) }
        : { type: "retryLater", notBefore: this.deps.clock.now() + delay }
    }
    this.deps.gate.release(job.spec)
    this.running.delete(job.spec.connectionId)
    if (job.state.status === "running") job.apply(outcome)
    if (job.state.status === "waiting") this.requeue(job)
    this.dispatch()
  }
}
```

A job cancelled while running is already in the cancelled state when the runner returns, so its outcome is ignored. The `requeue` helper puts a retrying job back in its provider's queue, unless a new job for the same connection is already waiting, in which case the two merge.

## Retries

```ts
class CappedJitterBackoff implements RetryPolicy {
  constructor(
    private readonly maxAttempts: number,
    private readonly baseMs: number,
    private readonly capMs: number,
    private readonly random: () => number,
  ) {}

  delayBefore(attempt: number, error: unknown): number | undefined {
    if (attempt > this.maxAttempts) return undefined
    if (error instanceof ConnectorError && !error.retryable) return undefined
    const ceiling = Math.min(this.capMs, this.baseMs * 2 ** attempt)
    const asked = error instanceof RateLimited ? (error.retryAfterMs ?? 0) : 0
    return Math.max(asked, this.random() * ceiling)
  }
}
```

The random source is injected, so a test can pass `() => 0.5` and know the delay exactly.

## Testing

A test builds the scheduler with a fake clock whose `wakeAt` stores callbacks, a gate with a fixed number of tokens, and a runner that resolves or throws on command. It can then submit three jobs, check that only the allowed number start, advance the clock, and check that the next one starts, all without waiting.

## Extension: no tenant above half of a provider

The change lands in one new class. `TenantShareGate` wraps the existing gate, counts running jobs per provider and tenant, and refuses a job when its tenant already holds half the provider's slots. It checks its own count before asking the inner gate, so a refused job never uses up a token.

```ts
class TenantShareGate implements ProviderGate {
  private readonly counts = new Map<string, number>()

  constructor(
    private readonly inner: ProviderGate,
    private readonly maxRunning: (provider: string) => number,
  ) {}

  tryAcquire(spec: JobSpec, now: number): boolean {
    const key = `${spec.provider}:${spec.tenantId}`
    const held = this.counts.get(key) ?? 0
    if (held >= Math.floor(this.maxRunning(spec.provider) / 2)) return false
    if (!this.inner.tryAcquire(spec, now)) return false
    this.counts.set(key, held + 1)
    return true
  }

  release(spec: JobSpec): void {
    const key = `${spec.provider}:${spec.tenantId}`
    this.counts.set(key, (this.counts.get(key) ?? 1) - 1)
    this.inner.release(spec)
  }

  nextChance(provider: string, now: number): number {
    return this.inner.nextChance(provider, now)
  }
}
```

Because `dispatch` asks the queue for the first job the gate admits, another tenant's job further back can start while the big tenant waits. The scheduler, the queue, and the runner don't change. The composition root wraps the gate, and that's the whole change.

## What would change with persistence

The class boundaries stay, and the implementations behind them change. The maps become a `JobStore` backed by a table with the state and a version number. Workers claim waiting jobs with `FOR UPDATE SKIP LOCKED` or a conditional update, as the Concurrency and coordination chapter describes. The gate's buckets move to Redis so every process shares them, and wake-ups become a `not_before` column that workers poll.

## Trade-offs

- **Queues per provider** keep a provider that's out of tokens from blocking others, at the cost of a loop over providers in `dispatch`. With thousands of providers, keep a set of providers with ready jobs instead.
- **Merging on-demand jobs** saves duplicate work, but a merged job's status is shared by both callers, which the API has to explain.
- **Patterns used:** strategy for retries, a wrapper for the tenant limit, and a state machine for jobs. A factory would be overkill here, since there's one way to build each part.
