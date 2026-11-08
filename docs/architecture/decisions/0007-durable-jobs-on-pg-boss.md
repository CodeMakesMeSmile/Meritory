# 0007: Durable jobs on pg-boss

**Status:** Accepted, 2026-11-07

## Decision

Background jobs live in Postgres and run through pg-boss 12. The first queue is `mail`, which carries every sign-in email.

- The API adds a job during the request and doesn't wait for the write, so a reset request takes as long whether or not the account exists.
- The job holds the email sealed with AES-256-GCM under `MAIL_JOB_KEY`. Only the kind of email and the user id are readable. In AWS the key lives in Secrets Manager.
- The worker wakes on each new job through LISTEN/NOTIFY, sends it, and deletes the job right away.
- A 4xx reply, a dropped connection, or an unknown error retries. A 5xx reply, or a job that can't be opened, goes straight to the `mail-dead` queue.
- Up to 9 tries over about 25 minutes. Waits double from 15 seconds up to 5 minutes, with jitter. Then the job goes to `mail-dead`, still sealed, for a week.
- Logs and stored failures carry the job id, the kind of email, the user id, the attempt, and the SMTP code. Never the address, the text, or the link.
- `pnpm db:migrate` installs and upgrades the `pgboss` schema and sets up the queues. The API and worker only check that it's there, and refuse to start if it isn't.

## Why

- **pg-boss over our own jobs table.** Retries with backoff, dead letters, `SKIP LOCKED` claiming, LISTEN/NOTIFY, and cleanup are easy to get subtly wrong. pg-boss is MIT, well used, and keeps everything in the database we already run.
- **pg-boss over Graphile Worker.** Both fit. pg-boss has dead-letter queues and per-job settlement built in, which the 5xx rule needs, and its queue settings live in the database instead of in each worker.
- **No Redis or SQS yet.** One store means one backup, and a job can be added in the same transaction as the rows it belongs to. SQS stays an option once volume calls for it.
- **Sealed jobs.** Reset and confirm links are as good as a password for an hour. Sealing them keeps them out of backups, replicas, and anyone's query results.
- **Migrated, never at startup.** Schema changes run once per deploy under our control, not when several tasks race to start.

## Consequences

pg-boss brings a second Postgres driver, `pg`, beside `postgres`. The API holds a pool of 2 for it and the worker a pool of 4.

LISTEN/NOTIFY needs a session connection. It won't work through PgBouncer in transaction mode, so the worker falls back to polling every 2 seconds if a pooler is added.

Changing `MAIL_JOB_KEY` makes queued and dead-lettered emails unreadable. Rotate it only once the `mail` queue is empty.

A job is sent at least once. If the worker stops between sending and deleting, the email can go out twice. That's harmless for these emails.

Nothing reads `mail-dead` yet. Alerts on it wait for the AWS monitoring work.
