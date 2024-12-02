/*
 * This file contains end-to-end tests for the CLI.
 * It tests the CLI commands and their output.
 * As much as possible, avoid mocking and use the actual implementation because this is an end-to-end test.
 */
import { promisify } from "util";
import { exec } from "child_process";
import { describe, it, expect, afterAll } from "vitest";
import path from "path";
import fs from "fs/promises";

type ExecError = {
  stdout: string;
  stderr: string;
  code: number;
  signal: string | null;
  cmd: string;
} & Error;

// Cleanup created files after tests
afterAll(async () => {
  await fs.rm(path.resolve(__dirname, "test-files"), { recursive: true, force: true });
});

describe("E2E Test", () => {
  const execAsync = promisify(exec);
  const testDir = path.resolve(__dirname, "test-files");

  it('should run "./run test" and output results', { timeout: 50000 }, async () => {
    const { stdout } = await execAsync("./backend/src/run test", { env: { ...process.env, NODE_ENV: "test" } });

    expect(stdout).toContain("Total:");
    expect(stdout).toContain("Passed:");
    expect(stdout).toContain("Coverage:");

    const totalMatches = stdout.match(/Total: (\d+)/);
    const passedMatches = stdout.match(/Passed: (\d+)/);
    const coverageMatches = stdout.match(/Coverage: (\d+)%/);

    if (totalMatches && passedMatches && coverageMatches) {
      const totalTests = parseInt(totalMatches[1], 10);
      const totalPassed = parseInt(passedMatches[1], 10);
      const lineCoverage = parseFloat(coverageMatches[1]);

      // Instead of being smart and actually trying to calculate the actual values (we would need to subtact the index.test.ts tests), we will just hardcode it, so these needs to be updated if the tests are updated
      // Don't get the values from ./run test (would defeat the purpose of this test), run the tests using npm run test and get the values from there and get coverage from npm run test:coverage
      expect(totalTests).toBe(55);
      expect(totalPassed).toBe(55);
      expect(lineCoverage).toBe(93);
    } else {
      throw new Error("Could not parse the output");
    }
  });

  it("should calculate a netscore", async () => {
    await fs.mkdir(testDir, { recursive: true });

    const filePath = path.join(testDir, "sampleURL.txt");
    await fs.writeFile(filePath, `https://www.npmjs.com/package/browserify`);

    const { stdout } = await execAsync(`./run ${filePath}`, {
      env: { ...process.env, NODE_ENV: "test", LOG_LEVEL: "0" }
    });

    const actual = JSON.parse(stdout.trim());

    // Validate static values
    expect(actual.URL).toBe("https://www.npmjs.com/package/browserify");
    expect(actual.RampUp).toBe(0.29);
    expect(actual.Correctness).toBe(0.13);
    expect(actual.BusFactor).toBe(0.15);
    expect(actual.ResponsiveMaintainer).toBe(0.02);
    expect(actual.License).toBe(1);

    // Validate latency ranges
    expect(actual.NetScore_Latency).toBeGreaterThan(0);
    expect(actual.RampUp_Latency).toBeGreaterThan(0);
    expect(actual.Correctness_Latency).toBeGreaterThan(0);
    expect(actual.BusFactor_Latency).toBeGreaterThan(0);
    expect(actual.ResponsiveMaintainer_Latency).toBeGreaterThan(0);
    expect(actual.License_Latency).toBeGreaterThan(0);

    expect(actual.NetScore).toBe(0.39);
  }, 50000);

  it("should fail with no command provided", async () => {
    try {
      await execAsync("./run");
      throw new Error("Expected the script to exit with code 1 but it did not");
    } catch (error) {
      const { stdout, code } = error as ExecError;
      expect(stdout).toBe("No command entered\n");
      expect(code).toBe(1);
    }
  });
});
