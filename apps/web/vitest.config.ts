import { defineConfig } from "vitest/config";

export default defineConfig({
  test: {
    environment: "jsdom",
    setupFiles: ["./test/setup.ts"],
    include: ["test/**/*.test.ts", "test/**/*.test.tsx"],
    clearMocks: true,
    restoreMocks: true,
    testTimeout: 10_000,
    coverage: {
      provider: "v8",
      include: ["src/**/*.{ts,tsx}"],
      reporter: ["text-summary", "json-summary", "html"],
      thresholds: {
        statements: 30,
        lines: 30,
        branches: 65,
        functions: 40,
        "src/api.ts": { statements: 40, lines: 40, branches: 45, functions: 30 },
        "src/accessibility/tabs.ts": { statements: 70, lines: 70, branches: 70, functions: 100 },
        "src/main.tsx": { statements: 10, lines: 10, branches: 70, functions: 40 },
        "src/views/case-flow/admin/index.tsx": { statements: 80, lines: 80, branches: 75, functions: 45 },
        "src/views/notes.tsx": { statements: 85, lines: 85, branches: 60, functions: 50 },
        "src/views/script-library.tsx": { statements: 60, lines: 60, branches: 60, functions: 24 },
        "src/views/service-flows.tsx": { statements: 85, lines: 85, branches: 70, functions: 55 },
        "src/views/wiki.tsx": { statements: 65, lines: 65, branches: 60, functions: 35 }
      }
    }
  }
});
