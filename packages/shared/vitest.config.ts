import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text-summary", "json-summary", "html"],
      thresholds: {
        statements: 65,
        lines: 65,
        branches: 80,
        functions: 85,
        "src/companion/protocol.ts": { statements: 85, lines: 85, branches: 80, functions: 80 },
        "src/connectors/parser.ts": { statements: 95, lines: 95, branches: 80, functions: 95 },
        "src/security/action-firewall.ts": { 100: true }
      }
    }
  }
});
