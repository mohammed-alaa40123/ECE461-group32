import path from "path";
import { defineConfig } from "vitest/config";

export default defineConfig({
  server: {
    watch: {
      ignored: [path.resolve(__dirname, "repos")]
    }
  },
  test: {
    include: ["handlers/__tests__/**.test.ts","rating/__tests__/**.test.ts"],
    coverage: {
      provider: 'v8', // Ensure you're using the 'v8' coverage provider
      reporter: ['text', 'text-summary', 'json', 'html'], // Include 'text-summary' for percentage
      reportsDirectory: './coverage', // Optional, specify output directory
          },

    hookTimeout: 30000
  }
});
