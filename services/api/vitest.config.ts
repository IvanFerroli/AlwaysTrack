import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text-summary", "json-summary", "html"],
      thresholds: {
        statements: 60,
        lines: 60,
        branches: 60,
        functions: 68,
        "src/core/auth/access-policy.ts": { statements: 65, lines: 65, branches: 80, functions: 95 },
        "src/core/auth/session.ts": { statements: 80, lines: 80, branches: 75, functions: 95 },
        "src/core/case-flow/action-firewall.ts": { 100: true },
        "src/core/validation/input-validation.ts": { statements: 95, lines: 95, branches: 80, functions: 90 }
      }
    }
  }
});
