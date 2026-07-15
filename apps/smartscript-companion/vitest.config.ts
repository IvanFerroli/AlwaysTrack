import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text-summary", "json-summary", "html"],
      thresholds: {
        statements: 15,
        lines: 15,
        branches: 60,
        functions: 75,
        "src/processor.ts": { statements: 95, lines: 95, branches: 60, functions: 95 },
        "src/espanso.ts": { 100: true }
      }
    }
  }
});
