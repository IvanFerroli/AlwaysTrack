import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text-summary", "json-summary", "html"],
      thresholds: {
        statements: 92,
        lines: 92,
        branches: 84,
        functions: 95,
        "src/security/action-firewall.ts": { 100: true },
        "src/security/protocol-security.ts": { statements: 100, lines: 100, branches: 90, functions: 100 }
      }
    }
  }
});
