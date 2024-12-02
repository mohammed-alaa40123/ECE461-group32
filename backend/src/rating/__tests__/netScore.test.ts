/**
 * This file contains tests for the calculateNetScore function in metrics/netScore.ts
 */
import { describe, it, expect, vi } from "vitest";
import { calculateNetScore } from "../metrics/netScore.js";
import { calculateLicenseScore } from "../metrics/license.js";
import { calculateRampUpScore } from "../metrics/rampUp.js";
import { calculateResponsiveMaintainerScore } from "../metrics/responsiveMaintainer.js";
import { calculateCorrectness } from "../metrics/correctness.js";
import { calculateBusFactorScore } from "../metrics/busFactor.js";
import { processURLs } from "../processURL.js";
import { getLogger } from "../logger.js";
import { beforeEach } from 'vitest';
import { cloneRepo } from "../util.js";

vi.mock("../logger.ts", () => {
  return {
    getLogger: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn(),
      console: vi.fn()
    })
  };
});

vi.mock("../metrics/license.ts", () => ({
  calculateLicenseScore: vi.fn().mockResolvedValue(1)
}));

vi.mock("../metrics/rampUp.ts", () => ({
  calculateRampUpScore: vi.fn().mockResolvedValue(1)
}));

vi.mock("../metrics/responsiveMaintainer.ts", () => ({
  calculateResponsiveMaintainerScore: vi.fn().mockResolvedValue(1)
}));

vi.mock("../metrics/correctness.ts", () => ({
  calculateCorrectness: vi.fn().mockResolvedValue(1)
}));

vi.mock("../metrics/busFactor.ts", () => ({
  calculateBusFactorScore: vi.fn().mockResolvedValue(1)
}));

vi.mock("../processURL.ts", () => ({
  processURLs: vi
    .fn()
    .mockResolvedValue([
      { packageName: "test-package", owner: "test-owner", url: "https://github.com/test/test-package" }
    ])
}));

vi.mock("../util.ts", () => ({
  cloneRepo: vi.fn().mockResolvedValue("mockRepoDir")
}));

vi.mock("util", () => ({
  promisify: vi.fn(() => {
    return vi.fn().mockResolvedValue({
      stdout: JSON.stringify({
        JavaScript: { code: 1000 },
        TypeScript: { code: 500 },
        SUM: { code: 1500 }
      })
    });
  })
}));

describe("calculateNetScore", () => {
  const logger = getLogger();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate the correct net score for a given repository", async () => {
    const logSpy = vi.spyOn(logger, "console").mockImplementation(() => {});

    await calculateNetScore("path/to/url_file.txt");

    // Verify that the correct functions were called with expected arguments
    expect(processURLs).toHaveBeenCalledWith("path/to/url_file.txt");
    expect(cloneRepo).toHaveBeenCalledWith("https://github.com/test-owner/test-package.git", "test-package");
    expect(calculateLicenseScore).toHaveBeenCalledWith("test-owner", "test-package", "mockRepoDir");
    expect(calculateRampUpScore).toHaveBeenCalledWith("test-owner", "test-package", "mockRepoDir", 1500);
    expect(calculateResponsiveMaintainerScore).toHaveBeenCalledWith("test-owner", "test-package");
    expect(calculateCorrectness).toHaveBeenCalledWith("mockRepoDir", 1500);
    expect(calculateBusFactorScore).toHaveBeenCalledWith("test-owner", "test-package");

    const loggedOutput = logSpy.mock.calls[0][0]; // Get the first argument of the first call to console.log
    const parsedOutput = JSON.parse(loggedOutput); // Parse the logged JSON string

    // Verify the logged output matches the expected structure
    expect(parsedOutput).toEqual({
      URL: "https://github.com/test/test-package",
      NetScore: 1,
      NetScore_Latency: expect.any(Number),
      RampUp: 1,
      RampUp_Latency: expect.any(Number),
      Correctness: 1,
      Correctness_Latency: expect.any(Number),
      BusFactor: 1,
      BusFactor_Latency: expect.any(Number),
      ResponsiveMaintainer: 1,
      ResponsiveMaintainer_Latency: expect.any(Number),
      License: 1,
      License_Latency: expect.any(Number)
    });

    logSpy.mockRestore(); // Restore the original console.log after the test
  });
});
