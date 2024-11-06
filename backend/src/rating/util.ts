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
/**
 * Delete a cloned repository from the /tmp directory
 * @param repoName The name of the repository to delete
 * @returns Promise<void>
 */
export async function deleteRepo(repoName: string): Promise<void> {
  if (!isValidFilePath(repoName)) {
    logger.info("Invalid file path for deletion");
    return;
  }

  const repoDir = path.join('/tmp', repoName);

  try {
    logger.debug(`Attempting to delete repository directory: ${repoDir}`);
    await fs.rm(repoDir, { recursive: true, force: true });
    logger.info(`Successfully deleted repository directory: ${repoDir}`);
  } catch (error: any) {
    logger.debug(`Error deleting repository directory ${repoDir}:`, error);
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
