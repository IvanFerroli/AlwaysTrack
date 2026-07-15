import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text-summary", "json-summary", "html"],
      thresholds: {
        statements: 55,
        lines: 55,
        branches: 70,
        functions: 80,
        "src/companion/protocol.ts": { statements: 85, lines: 85, branches: 80, functions: 80 },
        "src/connectors/parser.ts": { statements: 95, lines: 95, branches: 80, functions: 95 }
      }
    }
  }
});
