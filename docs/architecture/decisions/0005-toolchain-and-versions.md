# 0005: Toolchain and pinned versions

**Status:** Accepted, 2026-11-04

## Decision

| Area | Choice |
|---|---|
| Runtime | Node 26.13 LTS, pinned in `package.json` for Volta and for pnpm (`devEngines.runtime`, so scripts use it even if another Node is installed) |
| Packages | pnpm 12 workspace, pinned with `packageManager` |
| Language | TypeScript 6.0 |
| Server code | Run directly by Node's built-in type stripping, no build step |
| Lint and format | Biome |
| Tests | Vitest |
| Web | Next.js 16, React 19, Tailwind CSS 4 |
| Mobile | Expo SDK 58, Expo Router, React Native 0.88 |
| API | Fastify 5 with TypeBox 1 schemas and generated OpenAPI |
| Database | PostgreSQL 18, Drizzle ORM |
| Scheduling | ts-fsrs 6, fuzz off |
| Local storage | RustFS (S3-compatible) |
| Local email | Mailpit |

## Why

- **TypeScript 6, not 7.** TypeScript 7 is out, but Expo SDK 58 expects 6.0 and expo-doctor fails on 7. Move when Expo does.
- **No server build.** Node runs `.ts` files directly as long as they use only erasable syntax (`erasableSyntaxOnly` enforces that). Workspace packages export their source, so the API and worker deploy without a bundler.
- **Biome.** One fast tool for lint and format instead of ESLint plus Prettier.
- **RustFS instead of MinIO.** The architecture page names MinIO, but MinIO's images are no longer published on Docker Hub. RustFS speaks the same S3 API and runs from one image. Code only talks to S3, so production on AWS S3 is unaffected.
- **ts-fsrs with fuzz off.** The phone and server must compute identical schedules from the same review. `SCHEDULER_VERSION` in `packages/learning` is recorded with each review and bumped when the parameters change.

## Consequences

pnpm holds back releases younger than a day, so a brand-new Expo patch needs a temporary entry in `minimumReleaseAgeExclude`. Dependabot groups Expo packages, but major SDK upgrades are done by hand with `expo install`.
