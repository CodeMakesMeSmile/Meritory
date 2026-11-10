# Contributing

Outside pull requests aren't being accepted yet. A contributor agreement needs to be in place first, because the curriculum in `content/` is licensed separately from the code. Issues and bug reports are welcome.

## Running it locally

You need Node 26 (Volta picks the right version from `package.json`), pnpm 12, and Docker.

```bash
pnpm install
cp .env.example .env
pnpm services:up
pnpm db:migrate
pnpm dev
```

In `.env`, set `BETTER_AUTH_SECRET` and `MAIL_JOB_KEY` first. `openssl rand -base64 32` makes a good value for each.

| What | Where |
|---|---|
| Web | http://localhost:3000 |
| API | http://localhost:4000/v1/health/ready |
| API schema | http://localhost:4000/v1/openapi.json |
| Mail inbox | http://localhost:8025 |
| Storage console | http://localhost:9001 |

Before pushing, run `pnpm check`. It runs lint, type checks, and tests, the same as CI.

The database tests skip unless `TEST_DATABASE_URL` is set. Tests don't read `.env`, so set it in the shell. They only touch rows they create, so the local database works once it's migrated. CI runs them against a fresh Postgres on every pull request, and fails if they skip.

```bash
pnpm db:migrate
TEST_DATABASE_URL=postgres://meritory:meritory@localhost:5432/meritory pnpm test
```

Every change follows the rules in [docs/security.md](docs/security.md). The pull request template has a short checklist for them.

## The phone app

The app has its own native code, so it runs as a development build, not in Expo Go. With an Android emulator running or a phone connected, build and install it. This also starts Metro:

```bash
pnpm --filter @meritory/mobile android
```

After that, `pnpm dev:mobile` starts Metro for the installed app. Build again after adding or updating a package with native code. `apps/mobile/.env.example` says how the app finds the local website.

### Android builds on Windows

The native build has file paths longer than 260 characters. The CMake 3.22.1 that Android uses by default comes with a Ninja that can't handle them, so:

1. Turn on long paths in Windows. In PowerShell as an administrator, run the command below, then restart.
2. In Android Studio, open Settings, then Languages & Frameworks, Android SDK, and SDK Tools. Tick Show Package Details and install CMake 3.31.6.
3. Add `android.cmakeVersion=3.31.6` to `%USERPROFILE%\.gradle\gradle.properties`. Create the file if it doesn't exist.

```powershell
New-ItemProperty -Path "HKLM:\SYSTEM\CurrentControlSet\Control\FileSystem" -Name "LongPathsEnabled" -Value 1 -PropertyType DWORD -Force
```

CMake 4 doesn't work yet, because `expo-sqlite` asks for a CMake older than 3.5.
