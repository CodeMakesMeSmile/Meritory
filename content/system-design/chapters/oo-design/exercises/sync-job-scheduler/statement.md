# Classes for a rate-limited sync job scheduler

Your platform's sync workers run jobs that each sync one connection against one outside provider. Design the classes for the in-process scheduler that decides which job runs next. Write it in TypeScript: interfaces, key method signatures, and the code for the main flow.

The scheduler should:

- Accept jobs for a connection with one of three priorities: on demand, scheduled, or backfill. Higher priorities run first.
- Respect each provider's limits: a rate in requests per second, and a cap on how many of its jobs run at once.
- Never run two jobs for the same connection at once. An on-demand job for a connection that already has a job waiting is merged into that job.
- Retry failed jobs with capped exponential backoff and jitter, up to a set number of attempts, and only for errors worth retrying.
- Let callers cancel a waiting or running job, and ask for any job's status.
- Be testable without real time passing.

Assume one process that holds its jobs in memory. Persistence and many cooperating processes are out of scope, but be ready to say what would change if jobs had to survive a restart.

You have 45 minutes. Clarify the requirements, list the entities, write the interfaces, and walk one flow in detail: an on-demand job arrives while its provider's rate limit is used up. In the last 10 minutes, extend the design so that no single tenant can take more than half of any provider's capacity.
