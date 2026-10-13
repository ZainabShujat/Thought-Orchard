import { defineConfig } from "vitest/config";
import { fileURLToPath } from "node:url";

export default defineConfig({
  resolve: {
    alias: {
      // `server-only` throws outside a React Server bundle; it's a no-op in tests.
      "server-only": fileURLToPath(new URL("./tests/support/empty.ts", import.meta.url)),
      "@": fileURLToPath(new URL("./", import.meta.url)),
    },
  },
  test: {
    include: ["tests/**/*.test.ts"],
    environment: "node",
    // The first run downloads a MongoDB binary for the integration tests.
    testTimeout: 60_000,
    hookTimeout: 180_000,
  },
});
