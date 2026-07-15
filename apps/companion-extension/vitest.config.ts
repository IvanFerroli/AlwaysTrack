import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "node",
    include: ["src/**/*.test.ts", "src/**/*.test.tsx"],
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text-summary", "json-summary", "html"],
      thresholds: {
        statements: 65,
        lines: 65,
        branches: 76,
        functions: 81,
        "src/background/protocol-client.ts": { statements: 85, lines: 85, branches: 60, functions: 95 },
        "src/shared/action-firewall.ts": { 100: true }
      }
    }
  }
});
