import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    watch: {
      ignored: [path.resolve(__dirname, "repos")]
    }
  },
  test: {
    include: ["backend/src","backend/src/handlers/__tests__/**.test.ts","backend/src/rating/__tests__/**.test.ts"],
    coverage: {
      reporter: ['text', 'text-summary', 'json', 'html'], // Include 'text-summary' for percentage
      reportsDirectory: './coverage', // Optional, specify output directory
      include: ["backend/src"],  
      exclude: ["backend/src/index.ts","backend/src/eslint.config.mjs","backend/src/index.js","backend/src/vite.config.ts","backend/src/webpack.config.js","backend/src/dist"],
      ignoreEmptyLines: true,
      reportOnFailure: true
    },
    hookTimeout: 30000
  }
});
