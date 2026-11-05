# 0001: Host on AWS

**Status:** Accepted, 2026-11-03

## Decision

Run everything in one AWS region (us-east-1 to start), with separate accounts for staging and production.

| Piece | Service |
|---|---|
| Web (Next.js) | Amplify Hosting |
| API and worker | ECS Fargate, one image with two entrypoints |
| Database | RDS PostgreSQL |
| Files | Private S3 bucket |
| Email | SES |
| Secrets | Secrets Manager |
| Deploys | GitHub Actions through an OIDC IAM role, no stored AWS keys |

## Why

One provider covers every piece the architecture needs, and each service is managed, so there's no server patching. Fargate runs the API and worker from the same image, which matches the modular monolith.

## Consequences

More setup than a single-vendor platform like Vercel plus a hosted Postgres. RDS and Fargate have a monthly floor even with no traffic. A budget alarm goes on both accounts before anything is deployed.
