import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    watch: {
      ignored: [path.resolve(__dirname, "repos")]
    }
  },
  test: {
    include: ["backend/src/handlers/__tests__/**.test.ts"],
    coverage: {
      reporter: ['text', 'text-summary', 'json', 'html'], // Include 'text-summary' for percentage
      reportsDirectory: './coverage', // Optional, specify output directory
      include: ["backend/src/handlers"],  
      exclude: ["src/__tests__/**", "src/index.ts"],
      thresholds: {
        statements: 90,
        functions: 100,
        lines: 90
      },
      ignoreEmptyLines: true,
      reportOnFailure: true
    },
    hookTimeout: 30000
  }
});
