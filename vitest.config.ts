import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

// The database tests skip without it, and CI must never pass with them skipped
if (process.env.CI && !process.env.TEST_DATABASE_URL) {
  throw new Error(
    "TEST_DATABASE_URL is not set, so the database tests would skip. CI sets it in .github/workflows/ci.yml.",
  );
}

export default defineConfig({
  resolve: {
    // The web app's "@/" import alias
    alias: [
      {
        find: /^@\//,
        replacement: fileURLToPath(new URL("apps/web/", import.meta.url)),
      },
    ],
  },
  test: {
    include: [
      "{apps,packages}/*/src/**/*.test.ts",
      "apps/web/*.test.ts",
      "apps/web/lib/**/*.test.ts",
      "apps/web/app/**/*.test.tsx",
      "apps/mobile/lib/**/*.test.ts",
      "tools/**/*.test.ts",
    ],
    exclude: ["**/node_modules/**"],
  },
});
