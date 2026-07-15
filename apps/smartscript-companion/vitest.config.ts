import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text-summary", "json-summary", "html"],
      thresholds: {
        statements: 80,
        lines: 80,
        branches: 70,
        functions: 90,
        "src/cli.ts": { statements: 70, lines: 70, branches: 65, functions: 85 },
        "src/storage.ts": { statements: 100, lines: 100, branches: 90, functions: 100 },
        "src/processor.ts": { statements: 95, lines: 95, branches: 60, functions: 95 },
        "src/espanso.ts": { 100: true }
      }
    }
  }
});
