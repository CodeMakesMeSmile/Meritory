import { fileURLToPath } from "node:url";
import { defineConfig } from "vitest/config";

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
      "tools/**/*.test.ts",
    ],
    exclude: ["**/node_modules/**", "apps/mobile/**"],
  },
});
