# 0002: Claude Haiku behind a provider adapter

**Status:** Accepted, 2026-11-03

## Decision

Use Anthropic's Claude Haiku 5.5 (`claude-haiku-5-5`) for AI feedback to start. The model ID comes from the `AI_MODEL` setting, never from code. All model calls go through the `AiProvider` interface in `packages/ai`. Locally and in tests the provider is `mock`, which is deterministic and needs no key.

Only the worker holds the API key. The API queues AI jobs and never calls the model.

## Why

Haiku is the cheapest current Claude model and good enough for rubric-based feedback at the start. Keeping the model in config means trying a bigger model is a settings change. Keeping the provider behind an interface, in its own package, means the AI code can be licensed or swapped separately from the rest.

Moving to Amazon Bedrock later would keep billing inside AWS. It only needs a new adapter.

## Consequences

API usage is billed separately from a claude.ai subscription. Set a monthly spend limit in the Anthropic console when the key is created.
