import type { NextConfig } from "next";

const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:4000";

const config: NextConfig = {
  agentRules: false,
  // Workspace packages ship TypeScript source
  transpilePackages: ["@meritory/contracts", "@meritory/design-tokens"],
  // Locally, stand in for the edge gateway: the browser calls /api/v1 on the
  // same origin and it reaches Fastify. In AWS the edge does this routing.
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${apiOrigin}/v1/:path*` },
    ];
  },
};

export default config;
