/**
 * This file contains tests for the correctness metric.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateCorrectness } from "../metrics/correctness.js";
import { cloneRepo } from "../util.js";
import { ESLint } from "eslint";
import { getLogger } from "../logger.js";
import * as utilModule from "util";

vi.mock("../util.ts", () => ({
  cloneRepo: vi.fn().mockResolvedValue("mockRepoDir")
}));
vi.mock("util", () => ({
  promisify: vi.fn().mockReturnValue(async () => {
    return Promise.resolve({
      stdout: JSON.stringify({
        JavaScript: {
          code: 10000
        },
        TypeScript: {
          code: 10000
        }
      })
    });
  })
}));
vi.mock("../logger.ts", () => {
  return {
    getLogger: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn()
    })
  };
});

describe("calculateCorrectness", () => {
  const logger = getLogger();

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 0 if the repository cannot be cloned", async () => {
    vi.mocked(cloneRepo).mockResolvedValueOnce(null);

    const result = await calculateCorrectness("mockrepo", 0);
    expect(result).toBe(0);
  });

  it("should calculate correctness score based on ESLint results", async () => {
    const mockESLintResults = [
      {
        errorCount: 5,
        warningCount: 2,
        filePath: "file1",
        messages: [],
        fixableErrorCount: 0,
        fixableWarningCount: 0,
        suppressedMessages: [],
        fatalErrorCount: 0,
        source: "",
        usedDeprecatedRules: []
      }
    ];
    vi.spyOn(ESLint.prototype, "lintFiles").mockResolvedValueOnce(mockESLintResults);
    vi.spyOn(utilModule, "promisify").mockReturnValueOnce(async () => {
      return Promise.resolve({
        stdout: JSON.stringify({
          JavaScript: {
            code: 10000
          },
          TypeScript: {
            code: 10000
          }
        })
      });
    });

    await calculateCorrectness("mockRepoDir", 20000);

    const expectedScore = 1 - (2 * 5 + 2) / 20000;
    expect(logger.debug).toHaveBeenCalledWith(
      `ESLint errors: 5, warnings: 2, total lines: 20000, final score: ${expectedScore} for mockRepoDir`
    );
  });

  it("should return minimum score of 0.1 if there are too many ESLint errors", async () => {
    const mockESLintResults = [
      {
        errorCount: 100000,
        warningCount: 5000,
        filePath: "file1",
        messages: [],
        fixableErrorCount: 0,
        fixableWarningCount: 0,
        suppressedMessages: [],
        fatalErrorCount: 0,
        source: "",
        usedDeprecatedRules: []
      }
    ];
    vi.spyOn(ESLint.prototype, "lintFiles").mockResolvedValueOnce(mockESLintResults);

    await calculateCorrectness("mockRepoDir", 20000);

    const expectedScore = Math.max(0, Math.min(1, 1 - (2 * 100000 + 5000) / 20000));
    expect(logger.debug).toHaveBeenCalledWith(
      `ESLint errors: 100000, warnings: 5000, total lines: 20000, final score: ${expectedScore} for mockRepoDir`
    );
  });

  it("should return 0 if no lines of code are found", async () => {
    const mockESLintResults = [
      {
        errorCount: 100000,
        warningCount: 5000,
        filePath: "file1",
        messages: [],
        fixableErrorCount: 0,
        fixableWarningCount: 0,
        suppressedMessages: [],
        fatalErrorCount: 0,
        source: "",
        usedDeprecatedRules: []
      }
    ];
    vi.spyOn(ESLint.prototype, "lintFiles").mockResolvedValueOnce(mockESLintResults);
    const mockExec = vi.fn().mockResolvedValue({ stdout: "{}" });
    vi.spyOn(utilModule, "promisify").mockReturnValueOnce(mockExec);

    const result = await calculateCorrectness("mockRepoDir", 0);

    expect(logger.debug).toHaveBeenCalledWith(`No lines of code found in mockRepoDir`);
    expect(result).toBe(0);
  });

  it("should return 0 if there is an error calculating ESLint score", async () => {
    vi.spyOn(ESLint.prototype, "lintFiles").mockRejectedValueOnce(new Error("ESLint error"));

    const result = await calculateCorrectness("mockrepo", 20000);

    expect(logger.info).toHaveBeenCalledWith("Failed to calculate ESLint score: Error: ESLint error");
    expect(result).toBe(0);
  });
});
