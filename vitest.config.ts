import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    include: [
      "{apps,packages}/*/src/**/*.test.ts",
      "apps/web/*.test.ts",
      "apps/web/lib/**/*.test.ts",
      "tools/**/*.test.ts",
    ],
    exclude: ["**/node_modules/**", "apps/mobile/**"],
  },
});
