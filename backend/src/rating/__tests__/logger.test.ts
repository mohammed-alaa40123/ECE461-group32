/**
 * This file contains tests for the logger.ts file.
 */
import { describe, it, expect, vi, afterEach, beforeAll, beforeEach, afterAll } from "vitest";
import fs from "fs/promises";
import path from "path";
import { getLogger, reinitializeLogger, logTestResults } from "../logger.js";
import * as util from "util";
import * as fsPromises from "fs/promises";

vi.mock("util", async () => {
  return {
    promisify: vi.fn().mockReturnValue(vi.fn())
  };
});
vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof fsPromises>();
  return {
    ...actual,
    readFile: vi.fn()
  };
});

const logFilePath = path.join("backend/src/rating", "__tests__", "logs", "test.log");

beforeAll(() => {
  const mockDate = new Date(2021, 1, 1);
  vi.setSystemTime(mockDate);
  process.env.LOG_LEVEL = "2";
  process.env.LOG_FILE = logFilePath;
  process.env.NODE_ENV = "test";
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(async () => {
  await fs.rm(path.join("src", "__tests__", "logs"), { recursive: true, force: true });
});

describe("Logger Tests", () => {
  let logger: ReturnType<typeof getLogger>;
  let debugSpy: ReturnType<typeof vi.spyOn>;
  let infoSpy: ReturnType<typeof vi.spyOn>;
  let consoleLogSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(async () => {
    reinitializeLogger();
    logger = getLogger();
    debugSpy = vi.spyOn(logger, "debug");
    infoSpy = vi.spyOn(logger, "info");
    consoleLogSpy = vi.spyOn(console, "log");
  });

  afterEach(() => {
    debugSpy.mockClear();
    infoSpy.mockClear();
    consoleLogSpy.mockClear();
  });

  it("Should log a debug message when logger.debug is called", async () => {
    const logMessage = "This is a debug message";
    await fs.writeFile(logFilePath, "");

    logger.debug(logMessage);

    expect(debugSpy).toHaveBeenCalledWith(logMessage);
    expect(infoSpy).not.toHaveBeenCalled();

    const logContents = await fs.readFile(logFilePath, "utf-8");
    expect(logContents).toBe(`01/02/2021 00:00:00 [debug]: ${logMessage}\r\n`);
  });

  it("Should log an info message when logger.info is called", async () => {
    const logMessage = "This is an info message";
    await fs.writeFile(logFilePath, "");

    logger.info(logMessage);

    const logContents = await fs.readFile(logFilePath, "utf-8");
    expect(logContents).toBe(`01/02/2021 00:00:00 [info]: ${logMessage}\r\n`);
    expect(infoSpy).toHaveBeenCalledWith(logMessage);
    expect(debugSpy).not.toHaveBeenCalled();
  });

  it("should not log a debug message and log an info message when log level is 1", async () => {
    process.env.LOG_LEVEL = "1";
    reinitializeLogger();
    logger = getLogger();
    await fs.writeFile(logFilePath, "");

    logger.debug("This is a debug message");
    logger.info("This is an info message");

    const logContents = await fs.readFile(logFilePath, "utf-8");
    expect(logContents).toBe(`01/02/2021 00:00:00 [info]: This is an info message\r\n`);
  });

  it("should not log a debug or info message when log level is 0", async () => {
    process.env.LOG_LEVEL = "0";
    reinitializeLogger();
    logger = getLogger();
    await fs.writeFile(logFilePath, "");

    logger.debug("This is a debug message");
    logger.info("This is an info message");

    const logContents = await fs.readFile(logFilePath, "utf-8");
    expect(logContents).toBe("");
  });

  it("should log JSON score messages correctly", async () => {
    process.env.LOG_LEVEL = "1";
    reinitializeLogger();
    logger = getLogger();
    await fs.writeFile(logFilePath, "");

    const message = {
      URL: "https://github.com/nullivex/nodist",
      NetScore: 0.9,
      NetScore_Latency: 0.033,
      RampUp: 0.5,
      RampUp_Latency: 0.023,
      Correctness: 0.7,
      Correctness_Latency: 0.005,
      BusFactor: 0.3,
      BusFactor_Latency: 0.002,
      ResponsiveMaintainer: 0.4,
      ResponsiveMaintainer_Latency: 0.002,
      License: 1,
      License_Latency: 0.001
    };

    logger.info(message);
    const logContents = await fs.readFile(logFilePath, "utf-8");
    expect(logContents).toContain(`[info]: ${JSON.stringify(message, null, 2)}`);
  });

  it("should run tests and log results", async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: "success" });
    const consoleSpy = vi.spyOn(console, "log");
    const readFileSpy = vi
      .spyOn(fsPromises, "readFile")
      .mockResolvedValueOnce(JSON.stringify({ numTotalTests: 10, numPassedTests: 8 }))
      .mockResolvedValueOnce(JSON.stringify({ total: { lines: { pct: 80 } } }));
    vi.spyOn(util, "promisify").mockReturnValueOnce(mockExec);
    await fs.writeFile(logFilePath, "");

    await logTestResults();

    expect(mockExec).toHaveBeenCalledWith(
      "npx vitest run --coverage --coverage.reportsDirectory=./logCoverage --reporter=json --outputFile=logCoverage/test-results.json --exclude src/__tests__/index.test.ts"
    );
    expect(readFileSpy).toHaveBeenCalledTimes(2);
    expect(consoleSpy).toHaveBeenCalledWith("Total: 10");
    expect(consoleSpy).toHaveBeenCalledWith("Passed: 8");
    expect(consoleSpy).toHaveBeenCalledWith("Coverage: 80%");
    expect(consoleSpy).toHaveBeenCalledWith("8/10 test cases passed. 80% line coverage achieved.");
  });

  it("should log an error when running tests fail ", async () => {
    const mockExec = vi.fn().mockRejectedValue(new Error("Test failure"));
    const loggerSpy = vi.spyOn(logger, "debug");
    const readFileSpy = vi
      .spyOn(fsPromises, "readFile")
      .mockResolvedValueOnce(JSON.stringify({ numTotalTests: 10, numPassedTests: 8 }))
      .mockResolvedValueOnce(JSON.stringify({ total: { lines: { pct: 80 } } }));
    vi.spyOn(util, "promisify").mockReturnValueOnce(mockExec);
    await fs.writeFile(logFilePath, "");

    await logTestResults();

    expect(mockExec).toHaveBeenCalledWith(
      "npx vitest run --coverage --coverage.reportsDirectory=./logCoverage --reporter=json --outputFile=logCoverage/test-results.json --exclude src/__tests__/index.test.ts"
    );
    expect(readFileSpy).toHaveBeenCalledTimes(2);
    expect(loggerSpy).toHaveBeenCalledWith(new Error("Test failure"));
  });

  it("should log an error when reading test results fail and throw", async () => {
    const mockExec = vi.fn().mockResolvedValue({ stdout: "success" });
    const loggerSpy = vi.spyOn(logger, "debug");
    const readFileSpy = vi.spyOn(fsPromises, "readFile").mockRejectedValueOnce(new Error("File read failure"));
    vi.spyOn(util, "promisify").mockReturnValueOnce(mockExec);
    await fs.writeFile(logFilePath, "");

    await expect(logTestResults()).rejects.toThrow("File read failure");

    expect(mockExec).toHaveBeenCalledWith(
      "npx vitest run --coverage --coverage.reportsDirectory=./logCoverage --reporter=json --outputFile=logCoverage/test-results.json --exclude src/__tests__/index.test.ts"
    );
    expect(readFileSpy).toHaveBeenCalledTimes(1);
    expect(loggerSpy).toHaveBeenCalledWith(new Error("File read failure"));
  });

  it("should print to console and not log to file when verbosity is 3 or higher", async () => {
    process.env.LOG_LEVEL = "3";
    reinitializeLogger();
    logger = getLogger();
    await fs.writeFile(logFilePath, "");

    logger.console("This is a console message");

    expect(consoleLogSpy).toHaveBeenCalledWith("This is a console message");
    expect(infoSpy).not.toHaveBeenCalled();

    const logContents = await fs.readFile(logFilePath, "utf-8");
    expect(logContents).toBe("");
  });

  it("should print to console and log to file when verbosity is 1", async () => {
    process.env.LOG_LEVEL = "1";
    reinitializeLogger();
    logger = getLogger();
    await fs.writeFile(logFilePath, "");

    logger.console("This is a console message");

    expect(consoleLogSpy).toHaveBeenCalledWith("This is a console message");

    const logContents = await fs.readFile(logFilePath, "utf-8");
    expect(logContents).toBe(`01/02/2021 00:00:00 [info]: This is a console message\r\n`);
  });

  it("should print to console and log to file when verbosity is 2", async () => {
    process.env.LOG_LEVEL = "2";
    reinitializeLogger();
    logger = getLogger();
    await fs.writeFile(logFilePath, "");

    logger.console("This is a console message");

    expect(consoleLogSpy).toHaveBeenCalledWith("This is a console message");

    const logContents = await fs.readFile(logFilePath, "utf-8");
    expect(logContents).toBe(`01/02/2021 00:00:00 [info]: This is a console message\r\n`);
  });

  it("should not log to console with info", async () => {
    process.env.LOG_LEVEL = "1";
    reinitializeLogger();
    logger = getLogger();
    await fs.writeFile(logFilePath, "");

    logger.info("This is an info message");

    expect(consoleLogSpy).not.toHaveBeenCalled();

    const logContents = await fs.readFile(logFilePath, "utf-8");
    expect(logContents).toBe(`01/02/2021 00:00:00 [info]: This is an info message\r\n`);
  });

  it("should not log to console with debug", async () => {
    process.env.LOG_LEVEL = "2";
    reinitializeLogger();
    logger = getLogger();
    await fs.writeFile(logFilePath, "");

    logger.debug("This is a debug message");

    expect(consoleLogSpy).not.toHaveBeenCalled();

    const logContents = await fs.readFile(logFilePath, "utf-8");
    expect(logContents).toBe(`01/02/2021 00:00:00 [debug]: This is a debug message\r\n`);
  });
});
