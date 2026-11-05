# 0004: AGPL code, all-rights-reserved curriculum

**Status:** Accepted, 2026-11-03

## Decision

Code is licensed under the GNU AGPL v3 (`LICENSE`). The curriculum in `content/` is all rights reserved (`LICENSE-CONTENT.md`). AI code stays in `packages/ai` so its license can change on its own later.

## Why

Open code makes the project easy to show and review. The AGPL means anyone who runs a modified copy as a public service has to publish their changes, which discourages a closed clone. The curriculum is where most of the effort and value is, so it stays protected.

## Consequences

Outside contributions need a contributor agreement before they can be accepted, since contributors would otherwise keep rights that block relicensing. Until then, outside pull requests aren't accepted.
