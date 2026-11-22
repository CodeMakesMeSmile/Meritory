# Object-oriented design

Some loops include a low-level design round instead of, or as well as, a system design round. The question is smaller, like "design the classes for a job scheduler," and the answer is types, interfaces, and how objects work together, often with some of the code written out. The interviewer is looking for clear responsibilities, seams that make the code easy to test, and a design that takes the next requirement without a rewrite.

The worked example in this chapter is the connector interface from the Case studies chapter, the code behind "authenticate, list pages since a checkpoint, and map a raw page," written in TypeScript. The Case studies chapter covers why connectors and a shared runtime are split. This chapter covers how to write the classes so the split holds up.

## How the round runs

A 45-minute low-level design round usually has five parts. Times are a guide.

1. **Clarify, about 5 minutes.** Ask what the system must do, which operations callers need, and what's out of scope. Ask about the constraints that change the classes: is it one process or many, does state survive a restart, can two callers touch the same object at once, and does the interviewer want running code or a sketch.
2. **Find the entities, about 5 to 10 minutes.** List the nouns and decide which become classes, which are plain values, and which are only fields.
3. **Write the interfaces, about 10 minutes.** Write method signatures before any bodies. Signatures are where most design decisions show, and they're quick to change.
4. **Walk a flow, about 10 to 15 minutes.** Take one real use case and trace it through the objects, writing the code that matters. Include one failure, like a provider timing out, not only the happy path.
5. **Extend, about 5 to 10 minutes.** The interviewer adds a requirement: a new provider type, a pause button, a per-tenant limit. A good design absorbs it by adding a class or a case in one place.

The last step is the one the interviewer planned for from the start. Saying early which change you expect, like "new providers will arrive every week, so adding one should touch nothing shared," shows you're designing for it.

## Entities and responsibilities

Start from the requirements. Nouns are candidate classes, and verbs are candidate methods. Then prune:

- **Drop nouns that are only attributes.** A provider's name is a field, not a class.
- **Merge synonyms.** "Account," "link," and "connection" are often one thing.
- **Give each verb to the object that holds the data it needs.** Deciding whether a connection should be disconnected needs its status and its failure count, so that rule belongs on the connection, not in a runner that reads those fields and decides for it. This is often called **tell, don't ask**.

Then sort what's left into three kinds:

- **Values** have no identity and are compared by their fields. A checkpoint, a page request, and a raw page are values. Make them immutable.
- **Entities** have an identity and a lifecycle. A connection is the same connection after its status changes.
- **Services** coordinate other objects and hold little state of their own. A sync runner is a service.

Each class should have **one reason to change**. A quick test is to describe the class in one sentence without "and." A `SyncManager` that authenticates, fetches pages, maps records, writes them, and sends alerts changes whenever any of those changes, and its tests need all of them at once. Classes named `Manager`, `Helper`, or `Util` are often a sign that responsibilities haven't been found yet.

For the connector example, the entities fall out like this: **Connection** (an entity with a lifecycle), **Credential** (a secret the connection points to), **Checkpoint** and **RawPage** (values), **Connector** (the interface for what varies per provider), **SyncRunner** (the service that runs a sync), and the runtime's helpers, **RateLimiter**, **CredentialStore**, **RawPageStore**, and **RecordStore**.

## The connector interface

Here is the contract every provider's connector meets:

```ts
type ResourceType = "employees" | "payments" | "invoices"

type PageRequest = {
  resource: ResourceType
  updatedAfter: Date
  cursor?: string
}

type RawPage = {
  body: unknown
  nextCursor?: string
  newestUpdatedAt?: Date
}

interface Connector {
  readonly provider: string
  authenticate(credential: Credential): Promise<Session>
  fetchPage(session: Session, request: PageRequest): Promise<RawPage>
  mapPage(resource: ResourceType, page: RawPage): MappedRecord[]
}
```

Each choice has a reason:

- **One page per call.** The runtime decides when to fetch the next page, so it can take a rate limit token before every call and stop cleanly between pages. A connector that looped over pages itself would have to know about rate limits and storage.
- **`mapPage` is pure.** It takes a page and returns records, with no I/O. It can be tested against recorded provider responses, and it can be run again over stored raw pages after a mapping bug is fixed.
- **`authenticate` returns a session.** Token refresh lives behind one method, and nothing else handles raw credentials.
- **What's missing is deliberate.** Retries, rate limits, storage, metrics, and health all belong to the shared runtime, so every connector gets them without writing them.

The runtime's side composes the connector with the helpers it needs:

```ts
type SyncDeps = {
  connectors: ConnectorRegistry
  credentials: CredentialStore
  limiter: RateLimiter
  rawPages: RawPageStore
  records: RecordStore
}

class SyncRunner {
  constructor(private readonly deps: SyncDeps) {}

  async run(connection: Connection, resource: ResourceType): Promise<Date> {
    const { connectors, credentials, limiter, rawPages, records } = this.deps
    const connector = connectors.get(connection.provider)
    const session = await connector.authenticate(await credentials.get(connection.id))
    let request: PageRequest = { resource, updatedAfter: connection.checkpoint }
    let newest = connection.checkpoint
    while (true) {
      await limiter.take(connection.provider)
      const page = await connector.fetchPage(session, request)
      await rawPages.put(connection.id, page)
      await records.upsert(connection.id, connector.mapPage(resource, page))
      if (page.newestUpdatedAt && page.newestUpdatedAt > newest) newest = page.newestUpdatedAt
      if (!page.nextCursor) return newest
      request = { ...request, cursor: page.nextCursor }
    }
  }
}
```

The runner returns the new checkpoint, and its caller saves it only after the run succeeds, as the API design chapter explains. The overlap window from that chapter is left out to keep the example short.

## Composition over inheritance

The tempting first design is a class tree: a `BaseConnector`, then `OAuthConnector` and `ApiKeyConnector` under it, then `OAuthCursorConnector`, and so on. It breaks down quickly.

- **The combinations multiply.** Three auth styles, four paging styles, and two transports make 24 leaf classes, and each new style multiplies them again. As separate parts, they're 3 plus 4 plus 2, which is 9 small classes.
- **The base class becomes fragile.** With 300 connectors inheriting from one base, any change to it can break any of them, and its protected members become a public contract nobody meant to sign.
- **Subclasses depend on the parent's internals**, like which method calls which, so the parent can't be refactored safely.

**Composition** builds a connector from parts instead:

```ts
interface AuthStrategy {
  signIn(credential: Credential): Promise<Session>
}

interface PagingStrategy {
  toQuery(request: PageRequest): Record<string, string>
  readPage(body: unknown): { nextCursor?: string, newestUpdatedAt?: Date }
}

type Mapping = (body: unknown) => MappedRecord[]

class ConfiguredConnector implements Connector {
  constructor(
    readonly provider: string,
    private readonly auth: AuthStrategy,
    private readonly paging: PagingStrategy,
    private readonly mappings: Record<ResourceType, Mapping>,
    private readonly http: HttpClient,
  ) {}

  authenticate(credential: Credential): Promise<Session> {
    return this.auth.signIn(credential)
  }

  async fetchPage(session: Session, request: PageRequest): Promise<RawPage> {
    const body = await this.http.get(request.resource, this.paging.toQuery(request), session)
    return { body, ...this.paging.readPage(body) }
  }

  mapPage(resource: ResourceType, page: RawPage): MappedRecord[] {
    return this.mappings[resource](page.body)
  }
}
```

Most providers then need no class of their own, only a configuration that picks an auth style, a paging style, and mappings. Each part is tested once, on its own.

Inheritance still has its place. It fits a true "is a" relationship that shares real behavior, kept to one level, and it fits when the platform expects it. Error types are the common case in TypeScript, as a later section shows.

TypeScript makes composition easier than in many languages, because its type system is **structural**. The handbook explains that types are compatible when their members match, whether or not a class declares that it implements an interface. An `implements` clause is only a check that the class fits. It doesn't change the class's type. So any object with the right methods, including a plain object in a test, can stand in for an interface.

## Interfaces and dependency injection

`SyncRunner` never names Redis, S3, or a database client. It depends on small interfaces, like `RateLimiter` and `RawPageStore`, shaped by what the runner needs, and receives real implementations through its constructor. That's **dependency injection**. Martin Fowler's 2004 article gave the pattern its name and recommends constructor injection unless it runs into specific problems.

The payoff is testing. A test can build a runner from fakes:

```ts
const runner = new SyncRunner({
  connectors: registryWith(recordedConnector("example-payroll", pages)),
  credentials: { get: async () => testCredential },
  limiter: { take: async () => {} },
  rawPages: new MemoryRawPageStore(),
  records,
})
```

No network, no Redis, and no waiting, and every page and every failure is under the test's control. Because TypeScript is structural, the fakes for `credentials` and `limiter` are plain objects.

Watch for **hidden dependencies** that skip the constructor:

- **The clock.** Code that calls `Date.now()` to decide whether a token is about to expire can only be tested by waiting. Inject a `Clock` and tests can set the time.
- **Randomness**, like jitter in backoff. Inject it, or the test can't predict the delay.
- **Module-level singletons** and environment variables read deep in the code.

The real implementations are wired once, in one place, often called the **composition root**: the `main` file that builds the Redis limiter, the S3 store, and the runner. No framework is needed for that.

Not everything needs an interface. Values and pure functions, like a mapping, can be used directly. Add an interface at each **seam**, a place where you'd swap an implementation or where a test needs control.

## Patterns that come up

Interviewers like hearing a pattern named when the name explains the design, and they notice when a pattern is added for its own sake. Four come up most in this kind of round.

| Pattern | What it does | In the connector example | Overkill when |
|---|---|---|---|
| Strategy | Swaps an algorithm behind an interface | Auth styles and paging styles | There's only one algorithm, or a plain function parameter would do |
| Adapter | Wraps something with the wrong interface so it fits yours | A provider's SDK wrapped to look like a `Connector` | You own both sides and can change one of them |
| Factory | Puts the logic for building an object in one place | Building a `ConfiguredConnector` from a provider's config | Construction is one `new` with obvious arguments |
| Observer | Lets listeners react to events without the sender knowing them | Health, metrics, and billing react when a sync finishes | There's one listener, order matters, or the event must survive a crash |

A few notes on each.

**Strategy** in TypeScript is often just a function type. `Mapping` above is a strategy with no class at all.

**Adapter** is how odd providers fit. Suppose one provider only offers a vendor SDK with methods like `login` and `exportChanges`. Write a `LegacyLedgerConnector` that implements `Connector` and calls the SDK inside, so the runtime never sees the SDK's shape.

**Factory** keeps the choice of parts out of the runtime:

```ts
function createAuth(config: AuthConfig, http: HttpClient): AuthStrategy {
  switch (config.kind) {
    case "oauth":
      return new OAuthRefresh(config.tokenUrl, http)
    case "apiKey":
      return new ApiKeyAuth(config.header)
    case "basic":
      return new BasicAuth()
    default: {
      const unknownKind: never = config
      return unknownKind
    }
  }
}
```

The `never` line is explained in the next section. Adding a fourth auth style to `AuthConfig` makes this function fail to compile until it handles the new style.

**Observer** decouples the runner from everyone who cares about a sync's outcome. The runner publishes a `syncSucceeded` or `syncFailed` event, and listeners update health, record metrics, or queue customer webhooks. The catch is that an in-process observer isn't durable. If the process crashes after saving the sync but before a listener runs, that listener never hears about it. When missing an event would matter, like a customer webhook, write the event to an outbox in the same transaction, as the Queues and async work chapter describes, and let the listener read from there.

## State machines for lifecycles

Anything with a lifecycle, like a connection, a sync job, or an export, is a state machine whether you write one or not. Writing it down makes the rules visible and keeps illegal moves out. The Case studies chapter covers what each connection state means to a customer. Here's how to model it in code.

| From | Event | To |
|---|---|---|
| Pending | The end user finishes signing in | Active |
| Active | A sync succeeds | Active |
| Active | A sync fails with a temporary error | Failing |
| Active or failing | The provider rejects the credentials | Disconnected |
| Failing | A sync succeeds | Active |
| Failing | Another sync fails | Failing, with one more failure |
| Disconnected | The end user signs in again | Active |

Anything not in the table is refused. A discriminated union in TypeScript lets each state carry only the data that makes sense in it:

```ts
type ConnectionState =
  | { status: "pending" }
  | { status: "active", lastSyncAt?: Date }
  | { status: "failing", since: Date, failures: number }
  | { status: "disconnected", reason: DisconnectReason }

type ConnectionEvent =
  | { type: "authorized" }
  | { type: "syncSucceeded", at: Date }
  | { type: "syncFailed", at: Date }
  | { type: "authRejected", reason: DisconnectReason }

function transition(state: ConnectionState, event: ConnectionEvent): ConnectionState {
  switch (state.status) {
    case "pending":
      if (event.type === "authorized") return { status: "active" }
      break
    case "active":
      if (event.type === "syncSucceeded") return { status: "active", lastSyncAt: event.at }
      if (event.type === "syncFailed") return { status: "failing", since: event.at, failures: 1 }
      if (event.type === "authRejected") return { status: "disconnected", reason: event.reason }
      break
    case "failing":
      if (event.type === "syncSucceeded") return { status: "active", lastSyncAt: event.at }
      if (event.type === "syncFailed") return { ...state, failures: state.failures + 1 }
      if (event.type === "authRejected") return { status: "disconnected", reason: event.reason }
      break
    case "disconnected":
      if (event.type === "authorized") return { status: "active" }
      break
    default: {
      const unhandled: never = state
      return unhandled
    }
  }
  throw new InvalidTransition(state.status, event.type)
}
```

What this buys:

- **One place for every rule.** Nothing else in the codebase sets `status` directly.
- **Illegal moves fail loudly.** A sync result arriving for a disconnected connection throws instead of quietly reviving it.
- **Data matches state.** `failures` exists only while failing, so no code can read a stale count from an active connection.
- **Easy tests.** The function is pure, so each row of the table is a one-line test.
- **The compiler checks completeness.** The TypeScript handbook calls this exhaustiveness checking: in the `default` branch, every state has been handled, so `state` has the type `never`. Add a `paused` state to the union and this line stops compiling until `transition` handles it.

Two more things to say in an interview. First, saving a transition is a check-then-act race if two workers apply events to the same connection at once. Store a version with the state and write with a condition on it, as the Concurrency and coordination chapter describes. Second, side effects like the `connection.status_changed` webhook come after the new state is saved, by comparing the old status with the new one and publishing through an outbox.

## Errors the caller can act on

Providers fail in dozens of ways: HTTP status codes, error bodies, SOAP faults, and sometimes a 200 with an error message inside. If each connector throws whatever it got, the runtime needs per-provider knowledge to decide what to do. Instead, each connector translates its provider's failures into a few shared types at the edge:

```ts
abstract class ConnectorError extends Error {
  abstract readonly retryable: boolean
}

class AuthRejected extends ConnectorError {
  readonly retryable = false
}

class RateLimited extends ConnectorError {
  readonly retryable = true

  constructor(readonly retryAfterMs?: number) {
    super("provider rate limit reached")
  }
}

class ProviderUnavailable extends ConnectorError {
  readonly retryable = true
}

class UnexpectedShape extends ConnectorError {
  readonly retryable = false
}
```

Then the runtime decides once, for all 300 providers:

| Error | What the runtime does | Event for the state machine |
|---|---|---|
| `AuthRejected` | Stops, doesn't retry | `authRejected` |
| `RateLimited` | Waits for `retryAfterMs` if given, then retries | None, unless retries run out |
| `ProviderUnavailable` | Retries with backoff and jitter | `syncFailed` once retries run out |
| `UnexpectedShape` | Keeps the raw page and opens a data issue | None. The mapping's owner is alerted |

This is the shallow kind of inheritance that works: one level, a shared meaning, and a platform that expects errors to extend `Error`. Expected outcomes that aren't failures, like "no more pages," belong in return values, as `nextCursor` does, not in exceptions.

## Designing for change

Designing for change starts with asking which changes are likely, then making those cheap. For the connector example:

| Change | How often | Where it lands |
|---|---|---|
| A new provider using known styles | Every week | A config record, mappings, and tests against recorded responses |
| A provider renames a field | Often, without notice | That provider's mapping, plus a data issue that catches it |
| A new paging style | A few times a year | One new `PagingStrategy` and one case in the factory |
| Provider webhooks | Some providers | A separate interface, below |
| A new kind of state, like paused | Rarely | The union and `transition`, with the compiler listing every place to update |

The most common change should mean adding code, not editing shared code. That's the old **open for extension, closed for modification** idea, applied where it pays.

Optional abilities get their own small interface instead of a method every connector must fake:

```ts
interface WebhookCapable {
  verifyWebhook(rawBody: Buffer, headers: Headers): boolean
  webhookConnection(rawBody: Buffer): ProviderAccountId
}
```

Connectors that support provider webhooks implement it as well as `Connector`, and the registry records which ones do. Nobody writes a `verifyWebhook` that throws "not supported." The Networking chapter covers what the receiver does with it.

The opposite mistake is building for changes nobody asked for: a plugin loader, a generic workflow engine, or configuration for every value. Fowler's essay on **YAGNI**, "you aren't gonna need it," names four costs of a feature built on a guess: the cost of building it, the delay to work that mattered more, the cost of carrying its complexity in every later change, and the cost of repairing it when the guess was wrong. The same essay notes that YAGNI doesn't apply to keeping code easy to change, like refactoring and tests. A practical rule is to wait for two or three real cases before extracting an abstraction, and in an interview, to name the extension point out loud rather than build it.

## In the room

When the interviewer adds a requirement at the end, answer with where the change lands before writing anything. "A provider that only offers SOAP is a new transport behind `HttpClient`, an adapter, and nothing in the runner changes." "Pausing a connection is a new state and two new events, and the compiler will show every switch that needs them." "A per-tenant limit wraps the existing `RateLimiter` in one that also checks the tenant's bucket, so the runner keeps calling `take`."

That's the signal the whole round is built to find: a design where each change has an obvious home. The two exercises give you practice on fresh problems. Set a 45-minute timer, write the interfaces and the main flow, handle the extension at the end of the statement, and score yourself before opening the model answer.
