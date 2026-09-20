import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    globalSetup: ["./src/tests/globalSetup.ts"],
    setupFiles: ["./src/tests/setup.ts"],
    // Tests share one real Postgres DB and reset it between tests,
    // so files must not run concurrently against it.
    fileParallelism: false,
    testTimeout: 15000
  }
});
