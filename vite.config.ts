import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    watch: {
      ignored: [path.resolve(__dirname, "repos")]
    }
  },
  test: {
    include: ["backend/src/rating/__tests__/**.test.ts"],
    coverage: {
      reporter: ["json-summary", "html"],
      reportsDirectory: './coverage', // Optional, specify output directory
      include: ["backend/src"],  
      exclude: ["backend/src/index.ts","backend/src/eslint.config.mjs","backend/src/rating","backend/src/index.js","backend/src/vite.config.ts","backend/src/webpack.config.js","backend/src/dist"],
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
