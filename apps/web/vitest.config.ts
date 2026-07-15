import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
    clearMocks: true,
    restoreMocks: true,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text-summary", "json-summary", "html"],
      thresholds: {
        statements: 6,
        lines: 6,
        branches: 50,
        functions: 25,
        "src/api.ts": { statements: 40, lines: 40, branches: 45, functions: 30 },
        "src/accessibility/tabs.ts": { statements: 70, lines: 70, branches: 70, functions: 100 },
        "src/views/case-flow/admin/index.tsx": { statements: 80, lines: 80, branches: 75, functions: 45 }
      }
    }
  }
});
