# 0006: Auth routes under the web origin, with Better Auth's own errors

**Status:** Accepted, 2026-11-05

## Decision

Better Auth runs in the API at `/v1/auth`. Browsers and the phone reach it at `{WEB_ORIGIN}/api/v1/auth`, the same public URL the web uses for every API call. The API rebuilds each auth request from that configured URL, never from the Host header.

Responses from `/v1/auth` keep Better Auth's own error shape and codes, such as `INVALID_EMAIL_OR_PASSWORD`. Every other route keeps our lowercase codes.

Auth tables are plural and snake_case, with UUID keys. Rate limits live in the database. Emails are sent without waiting for the SMTP server.

## Why

Better Auth builds email links and OAuth callbacks from its base URL, so that URL has to be the public one. Building requests from config also means a forged Host header can't steer those links.

Better Auth's web and Expo clients read its error codes directly. Rewriting them would break those clients for no gain.

Not waiting on email keeps sign-up and reset responses equally fast whether or not an account exists.

## Consequences

The phone talks to the web origin, so the AWS edge must route `/api/v1` to the API in every environment.

An email is lost if SMTP fails at the moment of sending. A queued sender with retries is planned before public sign-up.

Rate limits count requests per client IP, so the trusted proxy headers must be set once the AWS edge exists.
