/**
 * This file contains tests for the license metric.
 */
import { describe, it, expect, vi, beforeEach } from "vitest";
import { calculateLicenseScore } from "../metrics/license.js"; // Adjust the import path
import { graphqlClient } from "../graphqlClient.js";
import * as fsPromises from "fs/promises";
import * as graphqlClientModule from "../graphqlClient.js";
import { getLogger } from "../logger.js";

vi.mock("../graphqlClient.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof graphqlClientModule>();
  return {
    ...actual,
    graphqlClient: {
      request: vi.fn().mockResolvedValue({
        repository: {
          licenseInfo: {
            spdxId: null
          }
        }
      })
    }
  };
});
vi.mock("fs/promises", async (importOriginal) => {
  const actual = await importOriginal<typeof fsPromises>();
  return {
    ...actual,
    readFile: vi.fn()
  };
});
vi.mock("../util.ts", () => ({
  cloneRepo: vi.fn().mockResolvedValue("mockRepoDir")
}));
vi.mock("../logger.ts", () => {
  return {
    getLogger: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn()
    })
  };
});
vi.mock("../util.ts", () => ({
  cloneRepo: vi.fn().mockResolvedValue("mockRepoDir")
}));

describe("calculateLicenseScore", () => {
  const logger = getLogger();
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should return 1 when the license is found in GraphQL response", async () => {
    vi.mocked(graphqlClientModule.graphqlClient.request).mockResolvedValueOnce({
      repository: {
        licenseInfo: {
          spdxId: "MIT"
        }
      }
    });

    const result = await calculateLicenseScore("owner", "repo", "mockRepoDir");
    expect(logger.info).toHaveBeenCalledWith("License found in GraphQL");
    expect(result).toBe(1);
  });

  it("should return 1 when the license is found in README.md", async () => {
    vi.spyOn(fsPromises, "readFile").mockResolvedValueOnce("Some content with MIT license information.");

    const result = await calculateLicenseScore("owner", "repo", "mockRepoDir");
    expect(logger.info).toHaveBeenCalledWith("License found in README.md");
    expect(result).toBe(1);
  });

  it("should return 1 when the license is found in package.json", async () => {
    vi.spyOn(fsPromises, "readFile").mockResolvedValueOnce("").mockResolvedValueOnce('{ "license": "MIT" }');

    const result = await calculateLicenseScore("owner", "repo", "mockRepoDir");
    expect(logger.info).toHaveBeenCalledWith("License found in package.json");
    expect(result).toBe(1);
  });

  it("should return 0 when no license is found in GraphQL or README.md", async () => {
    vi.spyOn(fsPromises, "readFile")
      .mockResolvedValueOnce("Some content without any license information.")
      .mockResolvedValueOnce("");

    const result = await calculateLicenseScore("owner", "repo", "mockRepoDir");
    expect(result).toBe(0);
  });

  it("should handle errors in GraphQL request", async () => {
    graphqlClient.request = vi.fn().mockRejectedValueOnce(new Error("GraphQL request failed"));

    vi.spyOn(fsPromises, "readFile").mockResolvedValueOnce("");

    const result = await calculateLicenseScore("owner", "repo", "mockRepoDir");
    expect(result).toBe(0);
  });

  it("should handle errors in README.md file reading", async () => {
    graphqlClient.request = vi.fn().mockResolvedValueOnce({
      repository: {
        licenseInfo: {
          spdxId: null
        }
      }
    });

    vi.spyOn(fsPromises, "readFile").mockRejectedValueOnce(new Error("README.md not found"));

    const result = await calculateLicenseScore("owner", "repo", "mockRepoDir");
    expect(result).toBe(0);
  });

  it("should handle errors in package.json file reading", async () => {
    vi.spyOn(fsPromises, "readFile")
      .mockResolvedValueOnce("")
      .mockRejectedValueOnce(new Error("package.json not found"));

    const result = await calculateLicenseScore("owner", "repo", "mockRepoDir");
    expect(result).toBe(0);
  });
});
