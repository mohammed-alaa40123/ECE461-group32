/**
 * This file contains tests for the processURL.ts file
 */
import { describe, it, expect, vi, Mock, beforeAll, afterAll } from "vitest";
import fs from "fs/promises";
import path from "path";
import { getGithubRepo, processURLs } from "../processURL.js";
import { getLogger } from "../logger.js";

vi.mock("../logger.ts", () => {
  return {
    getLogger: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn()
    })
  };
});
type MockedResponse = {
  json: () => Promise<{ repository: { url: string } }>;
} & Response;

const logger = getLogger();

global.fetch = vi.fn();

beforeAll(() => {
  process.env.NODE_ENV = "testing";
  vi.spyOn(console, "log").mockImplementation(() => {});
});

afterAll(async () => {
  await fs.rm(path.join(__dirname, "test-files"), { recursive: true, force: true });
});

describe("getGithubRepo", () => {
  it("should return the GitHub repo URL when given a GitHub URL", async () => {
    const url = "https://github.com/user/repo";

    const repo = await getGithubRepo(url);

    expect(repo).toEqual({ packageName: "repo", owner: "user" });
  });

  it("should fetch and return the GitHub repo URL when given an NPM package URL", async () => {
    const npmUrl = "https://www.npmjs.com/package/some-package";
    const mockedRepoUrl = "git+https://github.com/user/repo.git";

    (global.fetch as Mock).mockResolvedValueOnce({
      json: async () => ({
        repository: { url: mockedRepoUrl }
      })
    } as MockedResponse);

    const repo = await getGithubRepo(npmUrl);

    expect(repo).toEqual({ packageName: "repo", owner: "user" });
    expect(global.fetch).toHaveBeenCalledWith("https://registry.npmjs.org/some-package");
  });

  it("should return null if the URL is not GitHub or NPM", async () => {
    const invalidUrl = "https://example.com";

    const repo = await getGithubRepo(invalidUrl);

    expect(logger.info).toBeCalledWith("Invalid URL");
    expect(repo).toBeNull();
  });

  it("should return null if given a bad url containing npmjs", async () => {
    const invalidUrl = "https://www.npmjs.com/package/randomjunkasdfasdf";

    const repo = await getGithubRepo(invalidUrl);

    expect(logger.info).toBeCalledWith("Invalid URL");
    expect(repo).toBeNull();
  });

  it("should return null if given a bad url containing github - Owner not exist", async () => {
    const invalidUrl = "https://github.com/asivatha";

    const repo = await getGithubRepo(invalidUrl);

    expect(repo).toBeNull();
  });
});

describe("processURLs", () => {
  const testDir = path.join(__dirname, "test-files");

  beforeAll(async () => {
    await fs.mkdir(testDir, { recursive: true });
  });

  it("should return an empty array if the file is empty", async () => {
    const filePath = path.join(testDir, "emptyFile.txt");
    await fs.writeFile(filePath, "");

    const result = await processURLs(filePath);

    expect(result).toEqual([]);
  });

  it("should return an empty array if the file does not exist", async () => {
    const filePath = path.join(testDir, "nonexistent_file.txt");

    const result = await processURLs(filePath);

    expect(result).toEqual([]);
  });

  it("Should test file input and return an array of package repos with package name and owner", async () => {
    const expected = [
      { packageName: "cloudinary_npm", owner: "cloudinary", url: "https://github.com/cloudinary/cloudinary_npm" },
      { packageName: "nodist", owner: "nullivex", url: "https://github.com/nullivex/nodist" },
      { packageName: "lodash", owner: "lodash", url: "https://github.com/lodash/lodash" }
    ];

    const filePath = path.join(testDir, "sampleURL.txt");
    await fs.writeFile(
      filePath,
      `https://github.com/cloudinary/cloudinary_npm
https://github.com/nullivex/nodist
https://github.com/lodash/lodash`
    );

    const result = await processURLs(filePath);
    console.log(result);

    expect(result).toEqual(expected);
  });
});
