# Built from the repo root: docker build -f apps/api/Dockerfile .
ARG NODE_IMAGE=node:26.13.1-alpine@sha256:6bd9ab43c0ec0190ca7b2d193906cb8b7edf6e7f4afa43ddeccd6452710bffb5

FROM ${NODE_IMAGE} AS base
WORKDIR /repo
# pnpm at the version in package.json
COPY package.json ./
RUN npm install -g "$(node -p "require('./package.json').packageManager")"
# Every manifest, so the lockfile matches the workspace
COPY pnpm-lock.yaml pnpm-workspace.yaml ./
COPY apps/api/package.json apps/api/
COPY apps/mobile/package.json apps/mobile/
COPY apps/runner/package.json apps/runner/
COPY apps/web/package.json apps/web/
COPY apps/worker/package.json apps/worker/
COPY packages/ai/package.json packages/ai/
COPY packages/content/package.json packages/content/
COPY packages/contracts/package.json packages/contracts/
COPY packages/design-tokens/package.json packages/design-tokens/
COPY packages/learning/package.json packages/learning/
COPY packages/password/package.json packages/password/
COPY packages/recall-client/package.json packages/recall-client/
COPY packages/security-testing/package.json packages/security-testing/
COPY packages/server/package.json packages/server/

FROM base AS deps
RUN pnpm install --frozen-lockfile --prod --filter "@meritory/api..."

# Builds the content bundle, so the content sources never reach the final image
FROM deps AS bundle
COPY packages/content packages/content
COPY content content
RUN node packages/content/src/build-command.ts

# Starts clean, so pnpm and npm's cache stay behind
FROM ${NODE_IMAGE} AS run
WORKDIR /repo
ENV NODE_ENV=production
COPY --from=deps /repo ./
# Only the packages the API imports
COPY packages/content packages/content
COPY packages/contracts packages/contracts
COPY packages/design-tokens packages/design-tokens
COPY packages/learning packages/learning
COPY packages/password packages/password
COPY packages/server packages/server
COPY apps/api apps/api
COPY --from=bundle /repo/packages/content/dist/bundle.json packages/content/dist/bundle.json
USER node
EXPOSE 4000
CMD ["node", "apps/api/src/main.ts"]
