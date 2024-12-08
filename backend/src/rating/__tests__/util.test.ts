/**
 * This file contains tests for the utility functions in util.ts.
 */
import { describe, it, expect, vi, Mock, beforeEach } from "vitest";
import { cloneRepo, isValidFilePath } from "../util.js";
import fs from "fs/promises";
import { simpleGit } from "simple-git";
import { getLogger } from "../logger.js";
import path from "path";
import { fileURLToPath } from "url";
import { validateGithubToken } from "../util.js";
import * as graphqlClientModule from "../graphqlClient.js";

vi.mock("fs/promises");
vi.mock("simple-git");
vi.mock("../logger.ts", () => {
  return {
    getLogger: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn()
    })
  };
});
vi.mock("../graphqlClient.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof graphqlClientModule>();
  return {
    ...actual,
    graphqlClient: {
      request: vi.fn()
    }
  };
});

describe("cloneRepo", () => {
  const __dirname = path.dirname(__filename);
  const repoUrl = "https://github.com/user/repo.git";
  const repoName = "repo";
  const expectedRepoDir = path.resolve(__dirname, "..", "..", "tmp", repoName);
  const logger = getLogger();
  const mkdirSpy = vi.spyOn(fs, "mkdir");

  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return null if the file path is invalid", async () => {
    const invalidRepoName = "..";
    const repoDir = await cloneRepo(repoUrl, invalidRepoName);

    expect(repoDir).toBeNull();
    expect(logger.info).toHaveBeenCalledWith("Invalid file path");
    expect(mkdirSpy).not.toHaveBeenCalled();
  });
});

describe("isValidFilePath", async () => {
  it("should return true for valid file paths", () => {
    expect(isValidFilePath("/path/to/file")).toBe(true);
    expect(isValidFilePath("C:\\path\\to\\file")).toBe(true);
  });

  it("should return false for invalid file paths", () => {
    expect(isValidFilePath("../path/to/file")).toBe(false);
    expect(isValidFilePath("../../cwd/password")).toBe(false);
  });
});

describe("validateGithubToken", () => {
  const logger = getLogger();

  it("should return true if the GitHub token is valid", async () => {
    vi.mocked(graphqlClientModule.graphqlClient.request).mockResolvedValueOnce({ viewer: { login: "user" } });

    const result = await validateGithubToken();

    expect(result).toBe(true);
    expect(logger.info).toHaveBeenCalledWith("GitHub token is valid");
  });

  it("should return false if the GitHub token is invalid", async () => {
    vi.mocked(graphqlClientModule.graphqlClient.request).mockResolvedValueOnce({ viewer: { login: "" } });

    const result = await validateGithubToken();

    expect(result).toBe(false);
    expect(logger.info).toHaveBeenCalledWith("GitHub token is invalid");
  });

  it("should return false if there is an error", async () => {
    vi.mocked(graphqlClientModule.graphqlClient.request).mockRejectedValueOnce(new Error("GraphQL Error"));

    const result = await validateGithubToken();

    expect(result).toBe(false);
    expect(logger.info).toHaveBeenCalledWith("GitHub token is invalid");
  });
});
