# 0003: Email, GitHub and Google sign-in through Better Auth

**Status:** Accepted, 2026-11-03

## Decision

Offer email and password, GitHub and Google sign-in, all through Better Auth running in the API, with its Expo integration on mobile. Verification and reset emails go through SES in AWS and Mailpit locally. OAuth apps are registered separately per environment.

Signing in never grants AI access. The owner account gets AI through a separate provisioning step outside public signup.

## Why

Engineers mostly have GitHub accounts, Google covers most others, and email and password is the fallback. Better Auth handles sessions, OAuth and password storage, so no custom auth protocol gets written.

## Consequences

Three methods means three flows to test on web and native. The web and native callback behavior needs an integration test early.
