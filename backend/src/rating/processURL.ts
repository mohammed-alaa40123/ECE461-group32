/**
 * This module contains functions to process the URLs and get the GitHub repo, package name, and owner from the URL.
 */
import fs from "fs/promises";
import { getLogger } from "./logger.js";
import { returnRepo } from "./types.js";
import { isValidFilePath } from "./util.js";

const logger = getLogger();

/**
 * Get the owner and package name of the GitHub repository from the URL
 * @param url The URL to process
 * @returns The owner and package name of the GitHub repository
 */
export async function getGithubRepo(url: string): Promise<returnRepo | null> {
  const { default: fetch } = await import("node-fetch");
  const trimmedUrl = url.trim();

  const npmRegex = /npmjs\.com\/package\/(?<packageName>[^/]+)/;
  const githubRegex = /github\.com\/(?<owner>[^/]+)\/(?<packageName>[^/]+)/;

  if (trimmedUrl.includes("npmjs.com")) {
    return handleNpmUrl(trimmedUrl, npmRegex, githubRegex);
  } else if (trimmedUrl.includes("github.com")) {
    return handleGithubUrl(trimmedUrl, githubRegex);
  } else {
    logger.info("Invalid URL");
    return null;
  }
}

/**
 * Handle the NPM URL to get the GitHub repository owner and package name
 * @param url The URL to process
 * @param npmRegex The regex to match the NPM URL
 * @param githubRegex The regex to match the GitHub URL
 * @returns The owner and package name of the GitHub repository
 */
async function handleNpmUrl(url: string, npmRegex: RegExp, githubRegex: RegExp): Promise<returnRepo> {
  logger.info("Handling NPM URL");

  const match = url.match(npmRegex);
  if (!match?.groups?.packageName) return null;

  const packageName = match.groups.packageName;

  try {
    const repoURL = await getRepoUrlFromNpm(packageName, githubRegex);
    if (repoURL?.groups) {
      logger.info(`RepoURL: ${repoURL.input}`);
      logger.info(`Owner: ${repoURL.groups.owner}, Package: ${repoURL.groups.packageName}`);
      return { packageName: repoURL.groups.packageName, owner: repoURL.groups.owner };
    }
  } catch (error) {
    logger.info(`Error fetching NPM package: ${error}`);
  }

  return null;
}

/**
 * Get the GitHub repository URL from the NPM package name
 * @param packageName The NPM package name
 * @param githubRegex The regex to match the GitHub URL
 * @returns The GitHub repository URL
 */
async function getRepoUrlFromNpm(packageName: string, githubRegex: RegExp): Promise<RegExpMatchArray> {
  const fetch = (await import("node-fetch")).default;
  const response = await fetch(`https://registry.npmjs.org/${packageName}`);
  const data = await response.json();
  if (typeof data !== 'object' || data === null || !('repository' in data) || typeof (data as any).repository.url !== 'string') {
    throw new Error('Invalid data format');
  }
  let repoURL = (data as any).repository.url;

  repoURL = repoURL.replace(/^git\+/, "").replace(/\.git$/, "");

  return repoURL.match(githubRegex);
}

/**
 * Handle the GitHub URL to get the GitHub repository owner and package name
 * @param url The URL to process
 * @param githubRegex The regex to match the GitHub URL
 * @returns The owner and package name of the GitHub repository
 */
function handleGithubUrl(url: string, githubRegex: RegExp): returnRepo {
  logger.info("Handling GitHub URL");

  const match = url.match(githubRegex);
  if (match?.groups) {
    return { packageName: match.groups.packageName, owner: match.groups.owner };
  }

  logger.info("Invalid GitHub URL");
  return null;
}

/**
 * Read a file and process the URLs within it
 * @param filePath The path to the file to read
 * @returns The owner, package name, and URL of the GitHub repositories
 */
export async function processURLs(filePath: string) {
  if (!isValidFilePath(filePath)) {
    logger.info("Invalid file path");
    return [];
  }
  let fileContent;
  try {
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath is validated
    fileContent = await fs.readFile(filePath, "utf-8");
  } catch (error) {
    logger.info(`Error reading file: ${error}`);
    return [];
  }

  if (!fileContent) {
    logger.info("Empty file");
    return [];
  }

  const urls = fileContent.trim().split("\n");
  const results: Array<{ url: string; owner: string; packageName: string }> = [];

  for (const url of urls) {
    logger.info(`Working with URL: ${url}`);
    const repo = await getGithubRepo(url);
    if (!repo) {
      logger.info("Invalid URL");
      continue;
    }
    results.push({ ...repo, url: url });
  }
  logger.info(`Results: ${JSON.stringify(results)}`);
  return results;
}
export type GithubRepoInfo = {
	url: string;
	owner: string;
	repo: string;
};


/**
 * Extract the GitHub repository information from a given URL
 * @param url The URL to process
 * @returns The GitHub repository information
 */
export async function getGithubRepoInfoFromUrl(url: string): Promise<GithubRepoInfo | null> {
  const repoInfo = await getGithubRepo(url);
  if (repoInfo) {
    return {
      url,
      owner: repoInfo.owner,
      repo: repoInfo.packageName,
    };
  }
  return null;
}