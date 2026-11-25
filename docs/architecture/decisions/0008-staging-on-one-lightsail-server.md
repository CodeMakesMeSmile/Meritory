# 0008: Staging on one Lightsail server

**Status:** Accepted, 2026-11-22. Supersedes [0001](0001-aws-hosting.md). The server, its budget alert, and the stack it runs are in `infra/`, as described in [The staging server](../../staging-server.md). The Tunnel isn't built yet.

## Decision

Stay on AWS, in `ca-central-1`, in the same account that sends email through SES.

Staging is one Lightsail server that runs the Docker Compose stack. It starts on the 1 GB plan, with the 2 GB plan as the fallback if memory is too tight.

| Piece | How |
|---|---|
| Web, API, and worker | Three containers on the server, built from this repo |
| Database | Postgres in a container on the same server |
| Files | Nothing stores files yet, so there's no bucket |
| Email | SES, as in [Sending test email through Amazon SES](../../email-sending.md) |
| DNS and access | Cloudflare, with a Tunnel to the server and Access in front, so staging stays private |
| Infrastructure | CDK |
| Deploys | CI builds the images on every merge to `main` and pushes them to `ghcr.io`. A timer on the server pulls them. |
| Secrets | A `.env` file on the server, never in the instance's user data |

The server opens no inbound ports for the app. The Tunnel connects outward, and SSH is limited to Lightsail's own browser connection.

Production isn't decided here. It comes much later and gets its own record.

## Why

Staging is small and private, so a low fixed cost matters more than managed services. The options in [0001](0001-aws-hosting.md) don't fit that:

- Fargate with RDS has a monthly floor several times the cost of one small server.
- Aurora Serverless v2 can't scale to zero here, because the job queue polls the database and keeps it awake.
- App Runner has no `ca-central-1` endpoint.

The server needs IPv4, because GitHub, `ghcr.io`, and the SES SMTP endpoint have no IPv6 addresses. That rules out the cheaper IPv6-only plan.

Pulling images from the server means no deploy keys and no inbound deploy port.

One region for everything keeps email and hosting together.

## Consequences

Patching the server and its containers is our job. Nothing is managed.

There are no database backups. Staging data is disposable.

A restart or a deploy takes staging down for a moment, since there's one server.

Staging signs in with email and password only, and the phone app stays local.

Rate limits by real client IP wait for production, where the edge is known. Until then the API's production start check needs `AUTH_TRUSTED_PROXIES` or an edge header set for staging.

The 1 GB plan needs swap, a staggered start, and Node heap limits to hold the whole stack.
