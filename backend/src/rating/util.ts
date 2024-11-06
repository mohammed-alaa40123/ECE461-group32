/**
 * Utility functions for the application. These functions are used to clone repositories and validate file paths.
 */
import { SimpleGit, simpleGit } from "simple-git";
import path from "path";
import { fileURLToPath } from 'url';
import fs from "fs/promises";
import { getLogger } from "./logger";
import { graphqlClient } from "./graphqlClient";
import {dirname} from "path";
const logger = getLogger();

/**
 * Clone a repository from a given URL
 * @param repoUrl The URL of the repository to clone
 * @param repoName The name of the repository
 * @returns The path to the cloned repository or null if an error occurred
 */
export async function cloneRepo(repoUrl: string, repoName: string): Promise<string | null> {
  if (!isValidFilePath(repoName)) {
    logger.info("Invalid file path");
    return null;
  }

  const git: SimpleGit = simpleGit();
  const repoDir = path.join('/tmp', repoName);

  try {
    // Create the /tmp/repoName directory
    await fs.mkdir(repoDir, { recursive: true });
    logger.debug(`Cloning repository from ${repoUrl} to ${repoDir}`);

    // Clone the repository into /tmp/repoName
    await git.clone(repoUrl, repoDir);
    logger.info(`Repository cloned to ${repoDir}`);
    return repoDir;
  } catch (error: any) {
    if (error.message.includes("already exists")) {
      logger.info(`Repository already cloned to ${repoDir}`);
      return repoDir;
    }
    logger.debug("Error cloning repository:", error);
    return null;
  }
}
// util.ts
import axios from 'axios';
import AdmZip from 'adm-zip';

/**
 * Download and extract a GitHub repository as a ZIP file
 * @param repoUrl The URL of the repository to download
 * @param repoName The name of the repository
 * @returns The directory path where the repository is extracted or null if failed
 */
export async function cloneRepoAsZip(repoUrl: string, repoName: string): Promise<string | null> {
  console.log("start downloadziptest");

  if (!isValidFilePath(repoName)) {
    logger.info(`Invalid repository name: ${repoName}`);
    return null;
  }

  const tmppath = './tmp'; // Use absolute path for /tmp
  const repoDir = path.join(tmppath, repoName);
  const zipPath = path.join(tmppath, `${repoName}.zip`);
  
  // Ensure /tmp exists
  try {
    await fs.mkdir(tmppath, { recursive: true });
    logger.debug(`/tmp directory is ready at ${tmppath}`);
  } catch (mkdirError: any) {
    console.log(`Error creating /tmp directory: ${mkdirError.message}`);
    return null;
  }

  console.log(zipPath);

  try {
    logger.debug(`Downloading repository ZIP from ${repoUrl} to ${zipPath}`);

    // Extract owner and repo name from URL
    const regex = /https:\/\/github\.com\/([^/]+)\/([^/]+)(\.git)?/;
    const match = repoUrl.match(regex);
    if (!match) {
      throw new Error('Invalid GitHub repository URL');
    }
    const owner = match[1];
    const repo = match[2];

    // GitHub API URL for downloading ZIP (defaulting to main branch)
    const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/HEAD`;

    // Download the ZIP file with authentication (to handle rate limiting)
    const token = process.env.GITHUB_TOKEN; // Ensure this environment variable is set
    const headers: any = {
      'Accept': 'application/vnd.github.v3+json'
    };
    if (token) {
      headers['Authorization'] = `token ${token}`;
    }

    const response = await axios.get(zipUrl, { responseType: 'arraybuffer', headers });
    console.log(`HTTP Status: ${response.status}`); // Log status code

    if (response.status !== 200) {
      throw new Error(`Failed to download ZIP file: Status code ${response.status}`);
    }

    await fs.writeFile(zipPath, response.data);
    console.log(`Successfully downloaded repository ZIP to ${zipPath}`);

    // Extract the ZIP file
    const zip = new AdmZip(zipPath);
    zip.extractAllTo(repoDir, true);
    console.log(`Successfully extracted repository to ${repoDir}`);

    // Find the first subdirectory in repoDir
    const extractedItems = await fs.readdir(repoDir);
    const extractedDirs: string[] = []; // Explicitly define as string[]
    for (const item of extractedItems) {
      const itemPath = path.join(repoDir, item);
      const stat = await fs.stat(itemPath);
      if (stat.isDirectory()) {
        extractedDirs.push(itemPath);
      }
    }

    if (extractedDirs.length === 0) {
      throw new Error('No directory found after extracting ZIP');
    }

    const finalRepoDir = extractedDirs[0]; // Assuming only one top-level directory
    logger.debug(`Final repository directory: ${finalRepoDir}`);

    // Cleanup ZIP file
    await fs.unlink(zipPath);
    console.log(`Deleted ZIP file at ${zipPath}`);

    return finalRepoDir;
  } catch (error: any) {
    console.log(`Error downloading and extracting repository ZIP: ${error.message}`);
    return null;
  }
}


/**
 * Delete a cloned repository from the /tmp directory
 * @param repoName The name of the repository to delete
 * @returns Promise<void>
 */
export async function deleteRepo(repoName: string): Promise<void> {
  if (!isValidFilePath(repoName)) {
    logger.info(`Invalid repository name for deletion: ${repoName}`);
    return;
  }

  const repoDir = path.join('./tmp', repoName);

  try {
    logger.debug(`Attempting to delete repository directory: ${repoDir}`);
    await fs.rm(repoDir, { recursive: true, force: true });
    logger.info(`Successfully deleted repository directory: ${repoDir}`);
  } catch (error: any) {
    logger.error(`Error deleting repository directory ${repoDir}: ${error.message}`);
  }
}
/**
 * Validate a file path by checking if it is an absolute path and does not contain ".."
 * @param filePath The path to the file to read
 * @returns Whether the path is valid
 */
export function isValidFilePath(filePath: string): boolean {
  // Validate the file path (basic validation to avoid traversal attacks)
  const resolvedPath = path.resolve(filePath);
  return path.isAbsolute(resolvedPath) && !filePath.includes("..");
}

/**
 * Validate the GitHub token by making a query to the GitHub API
 * @returns true if the GitHub token is valid, false otherwise
 */
export const validateGithubToken = async (): Promise<boolean> => {
  const logger = getLogger();
  const validateTokenQuery = `
    query {
      viewer {
        login
      }
    }
  `;
  try {
    const response: { viewer: { login: string } } = await graphqlClient.request(validateTokenQuery);
    if (response.viewer.login) {
      logger.info("GitHub token is valid");
      return true;
    } else {
      logger.info("GitHub token is invalid");
    }
  } catch (error) {
    logger.info("Error validating GitHub token:", error);
  }
  return false;
};
