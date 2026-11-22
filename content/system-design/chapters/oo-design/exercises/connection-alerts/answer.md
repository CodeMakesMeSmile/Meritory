# Model answer

This is one strong answer, not the only one. Notice where each rule lives, and how little changes when the digest arrives at the end.

## Questions and assumptions

- **Who reports outcomes?** The sync runtime, once per sync, with the connection, tenant, provider, and either success or an issue code.
- **Can two outcomes for one connection arrive at once?** Yes, from different workers. The open issue must still be unique.
- **When does a code alert?** Each code has a threshold: 1 for `auth_revoked`, 3 in a row for `provider_timeout`. The thresholds are configuration.
- **Must alerts survive a crash?** Yes. A customer who never hears that a connection broke is the failure that matters most.
- **What does a provider incident do?** While one is open, issues are still recorded, but alerts for that provider's connections are held. Sending the incident notice itself is out of scope.

The change I expect next is a new channel or a new way of delivering, so channels will sit behind one interface.

## Entities

- **SyncOutcome**, a value: connection, tenant, provider, time, and either `ok` or an issue code.
- **Issue**, an entity with a lifecycle: connection, code, first seen, last seen, count, and whether an alert was sent. It's open, then resolved.
- **AlertRule**, a value per issue code: its threshold.
- **AlertPreference**, a value per tenant: which codes, and which channels.
- **IssueStore**: saves issues and enforces one open issue per connection and code.
- **IncidentRegistry**: says whether a provider has an open incident.
- **AlertOutbox**: stores alerts to send in the same transaction as the issue change.
- **Channel**: sends one alert one way, like email, a webhook, or chat.
- **IssueTracker**: the service that takes outcomes and applies the rules.
- **AlertDispatcher**: reads the outbox and hands each alert to the tenant's channels.

## Interfaces

```ts
type SyncOutcome = {
  connectionId: string
  tenantId: string
  provider: string
  at: Date
  issueCode?: string
}

type Issue = {
  id: string
  connectionId: string
  code: string
  firstSeen: Date
  lastSeen: Date
  count: number
  alerted: boolean
}

type Alert = {
  key: string
  tenantId: string
  kind: "opened" | "resolved"
  issue: Issue
}

interface IssueStore {
  recordFailure(outcome: SyncOutcome, code: string, tx: Tx): Promise<Issue>
  markAlerted(issueId: string, tx: Tx): Promise<void>
  resolveOpen(connectionId: string, at: Date, tx: Tx): Promise<Issue[]>
}

interface IncidentRegistry {
  isOpen(provider: string): Promise<boolean>
}

interface AlertOutbox {
  add(alert: Alert, tx: Tx): Promise<void>
}

interface Channel {
  readonly kind: string
  send(alert: Alert, target: ChannelTarget): Promise<void>
}
```

`recordFailure` is one atomic upsert on a unique index over open issues by connection and code: insert with a count of 1, or add one to the count and set the last-seen time. Two workers reporting at once can't create two open issues.

## The issue lifecycle

| From | Event | To |
|---|---|---|
| None | A failure with this code | Open, count 1 |
| Open | Another failure with this code | Open, count plus 1 |
| Open | A successful sync | Resolved |

A resolved issue is never reopened. The next failure opens a new one, so the history stays honest.

## Walking the flow

The third `provider_timeout` in a row for connection `c1`, then a success.

```ts
class IssueTracker {
  constructor(private readonly deps: TrackerDeps) {}

  async record(outcome: SyncOutcome): Promise<void> {
    const { db, issues, rules, incidents, outbox } = this.deps
    await db.transaction(async (tx) => {
      if (!outcome.issueCode) {
        for (const issue of await issues.resolveOpen(outcome.connectionId, outcome.at, tx)) {
          if (issue.alerted) await outbox.add(alertFor(outcome, issue, "resolved"), tx)
        }
        return
      }
      const issue = await issues.recordFailure(outcome, outcome.issueCode, tx)
      if (issue.alerted || issue.count < rules.thresholdFor(issue.code)) return
      if (await incidents.isOpen(outcome.provider)) return
      await issues.markAlerted(issue.id, tx)
      await outbox.add(alertFor(outcome, issue, "opened"), tx)
    })
  }
}
```

1. The first two timeouts open the issue and raise its count to 2. The threshold for `provider_timeout` is 3, so nothing is sent.
2. The third timeout raises the count to 3. The threshold is met and the provider has no open incident, so the issue is marked alerted and an `opened` alert goes into the outbox, all in one transaction.
3. The success resolves the open issue. It was alerted, so a `resolved` alert goes into the outbox in the same transaction.
4. The dispatcher reads each alert, looks up the tenant's preference, and calls `send` on each chosen channel. Each alert's `key`, the issue id plus the kind, lets channels drop repeats if the dispatcher retries.

If the provider had an open incident at step 2, the issue would stay unalerted. When the incident closes, a small job can alert any issues that are still open and past their threshold, so nothing is lost by holding back.

## Channels

```ts
class ChannelRegistry {
  private readonly channels = new Map<string, Channel>()

  register(channel: Channel): void {
    this.channels.set(channel.kind, channel)
  }

  get(kind: string): Channel {
    const channel = this.channels.get(kind)
    if (!channel) throw new UnknownChannel(kind)
    return channel
  }
}
```

Adding a channel is one new class that implements `Channel`, plus one `register` call in the composition root. The tracker and the dispatcher don't change. Each channel is a strategy for delivering, and tests use a fake channel that records what it was asked to send.

## Extension: a daily digest

A tenant with the digest option should get one summary a day instead of each alert. The tracker's rules don't change at all, since the issue still opens and resolves the same way. Only delivery changes.

- Add `delivery: "immediate" | "dailyDigest"` to `AlertPreference`.
- Add a `DigestCollector` that also takes alerts from the dispatcher, but appends them to a per-tenant digest table instead of sending.
- Add a daily job that reads each tenant's digest, builds one summary alert, and sends it through the tenant's channels, then clears what it sent.

The dispatcher picks the collector or the channels from the tenant's preference. That's one new class, one scheduled job, and one branch, and the `Channel` interface stays the same.

## Testing

Each rule has a direct test: a fake `IssueStore` in memory, a fake `IncidentRegistry` that returns what the test says, and a fake outbox that records alerts. Thresholds, incidents, and resolution can each be checked with a few outcomes and no database. A separate test of the real `IssueStore` checks that two concurrent failures produce one open issue with a count of 2.

## Trade-offs

- **The outbox** costs a table and a relay, but no alert is lost if the process crashes after the transaction commits. An in-process observer would be simpler and would lose alerts on a crash.
- **Thresholds per code** keep customers from being paged for one timeout, at the cost of a delay before a real problem is reported.
- **Holding alerts during incidents** prevents a flood of alerts for one cause, but needs the catch-up job when the incident closes.
- **Patterns used:** strategy for channels and delivery modes, a registry for channels, and a small state machine for issues. A factory for channels would be overkill while each one is built with a plain `new`.
