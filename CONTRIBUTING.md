# Contributing

Outside pull requests aren't being accepted yet. A contributor agreement needs to be in place first, because the curriculum in `content/` is licensed separately from the code. Issues and bug reports are welcome.

## Running it locally

You need Node 26 (Volta picks the right version from `package.json`), pnpm 12 and Docker.

```bash
pnpm install
cp .env.example .env
pnpm services:up
pnpm dev
```

| What | Where |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:4000/v1/health/ready |
| API schema | http://localhost:4000/v1/openapi.json |
| Mail inbox | http://localhost:8025 |
| Storage console | http://localhost:9001 |

For the phone app, run `pnpm dev:mobile` and open it in Expo Go or a simulator.

Before pushing, run `pnpm check`. It runs lint, type checks and tests, the same as CI.

The database tests skip unless `TEST_DATABASE_URL` is set. Tests don't read `.env`, so set it in the shell. They only touch rows they create, so the local database works once it's migrated.

```bash
pnpm db:migrate
TEST_DATABASE_URL=postgres://meritory:meritory@localhost:5432/meritory pnpm test
```

Every change follows the rules in [docs/security.md](docs/security.md). The pull request template has a short checklist for them.
