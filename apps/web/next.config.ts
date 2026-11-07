import type { NextConfig } from "next";

const apiOrigin = process.env.API_ORIGIN ?? "http://localhost:4000";

/** On every response. The proxy adds the Content Security Policy to pages. */
export const SECURITY_HEADERS = [
  { key: "X-Content-Type-Options", value: "nosniff" },
  { key: "Referrer-Policy", value: "strict-origin-when-cross-origin" },
  // Two years. Browsers ignore it over plain http, so local dev is unaffected.
  {
    key: "Strict-Transport-Security",
    value: "max-age=63072000; includeSubDomains",
  },
];

const config: NextConfig = {
  agentRules: false,
  poweredByHeader: false,
  async headers() {
    return [{ source: "/:path*", headers: SECURITY_HEADERS }];
  },
  // Workspace packages ship TypeScript source
  transpilePackages: [
    "@meritory/contracts",
    "@meritory/design-tokens",
    "@meritory/password",
  ],
  // Locally, stand in for the edge gateway: the browser calls /api/v1 on the
  // same origin and it reaches Fastify. In AWS the edge does this routing.
  async rewrites() {
    return [
      { source: "/api/v1/:path*", destination: `${apiOrigin}/v1/:path*` },
    ];
  },
};

export default config;
