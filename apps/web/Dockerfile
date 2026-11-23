# Built from the repo root: docker build -f apps/web/Dockerfile .
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

# The build needs the dev tools, which the final image leaves out
FROM base AS build
RUN pnpm install --frozen-lockfile --filter "@meritory/web..."
COPY tsconfig.base.json tsconfig.node.json ./
COPY packages packages
COPY apps/web apps/web
# Next.js fixes its rewrites at build time, so the API's address is set here
ARG API_ORIGIN=http://api:4000
ENV API_ORIGIN=${API_ORIGIN}
RUN pnpm --filter @meritory/web build

FROM base AS run
ENV NODE_ENV=production
RUN pnpm install --frozen-lockfile --prod --filter "@meritory/web..."
COPY packages packages
COPY apps/web apps/web
COPY --from=build /repo/apps/web/.next apps/web/.next
USER node
WORKDIR /repo/apps/web
EXPOSE 3000
CMD ["node", "node_modules/next/dist/bin/next", "start", "--port", "3000"]
