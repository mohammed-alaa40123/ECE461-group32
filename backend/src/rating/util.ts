/**
 * Utility functions for the application. These functions are used to clone repositories and validate file paths.
 */
import path from "path";
import { fileURLToPath } from 'url';
import fspromises from "fs/promises";
import dotenv from "dotenv";
import { getLogger } from "./logger";
import { graphqlClient } from "./graphqlClient";
import {dirname} from "path";
const logger = getLogger();
import * as git from 'isomorphic-git';
import fs from 'fs';
import http from 'isomorphic-git/http/node';
dotenv.config();
/**
 * Clone a repository from a given URL
 * @param repoUrl The URL of the repository to clone
 * @param repoName The name of the repository
 * @returns The path to the cloned repository or null if an error occurred
 */
// export async function cloneRepo(repoUrl: string, repoName: string): Promise<string | null> {
//   if (!isValidFilePath(repoName)) {
//     logger.info("Invalid file path");
//     return null;
//   }

//   const git: SimpleGit = simpleGit();
//   const repoDir = path.join('./tmp', repoName);

//   try {
//     // Create the /tmp/repoName directory
//     await fs.mkdir(repoDir, { recursive: true });
//     logger.debug(`Cloning repository from ${repoUrl} to ${repoDir}`);

//     // Clone the repository into /tmp/repoName
//     await git.clone(repoUrl, repoDir, ['--depth', '1']);
//     logger.info(`Repository cloned to ${repoDir}`);
//     return repoDir;
//   } catch (error: any) {
//     if (error.message.includes("already exists")) {
//       logger.info(`Repository already cloned to ${repoDir}`);
//       return repoDir;
//     }
//     logger.debug("Error cloning repository:", error);
//     return null;
//   }
// }
export async function cloneRepo(repoUrl: string, repoName: string): Promise<string | null> {
  if (!isValidFilePath(repoName)) {
    logger.info("Invalid file path");
    return null;
  }

  const repoDir = path.join(process.env.tmpDir!, 'lodash');

  try {
    // Create the /tmp/lodash directory
    await fs.promises.mkdir(repoDir, { recursive: true });
    logger.debug(`Cloning repository from ${repoUrl} to ${repoDir}`);

    // Clone the repository directly into the /tmp/lodash directory
    await git.clone({
      fs,
      http,
      dir: repoDir,
      url: repoUrl,
      singleBranch: true,
      depth: 1,
    });
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
// export async function cloneRepoAsZip(repoUrl: string, repoName: string): Promise<string | null> {
//   if (!isValidFilePath(repoName)) {
//     logger.info(`Invalid repository name: ${repoName}`);
//     return null;
//   }

//   const tmppath = './tmp'; // Use absolute path for /tmp
//   const repoDir = path.join(tmppath, repoName);
//   const zipPath = path.join(tmppath, `${repoName}.zip`);
  
//   // Ensure /tmp exists
//   try {
//     await fs.mkdir(tmppath, { recursive: true });
//     logger.debug(`/tmp directory is ready at ${tmppath}`);
//   } catch (mkdirError: any) {
//     console.log(`Error creating /tmp directory: ${mkdirError.message}`);
//     return null;
//   }

//   console.log(zipPath);

//   try {
//     logger.debug(`Downloading repository ZIP from ${repoUrl} to ${zipPath}`);

//     // Extract owner and repo name from URL
//     const regex = /https:\/\/github\.com\/([^/]+)\/([^/]+)(\.git)?/;
//     const match = repoUrl.match(regex);
//     if (!match) {
//       throw new Error('Invalid GitHub repository URL');
//     }
//     const owner = match[1];
//     const repo = match[2];

//     // GitHub API URL for downloading ZIP (defaulting to main branch)
//     const zipUrl = `https://api.github.com/repos/${owner}/${repo}/zipball/HEAD`;

//     // Download the ZIP file
//     const response = await axios.get(zipUrl, { responseType: 'arraybuffer' });
//     await fs.writeFile(zipPath, response.data);
//     logger.debug(`Successfully downloaded repository ZIP to ${zipPath}`);

//     // Extract the ZIP file
//     const zip = new AdmZip(zipPath);
//     const zipEntries = zip.getEntries();

//     // Extract each entry to the repoDir, avoiding extra folder creation
//     zipEntries.forEach(entry => {
//       const entryPath = path.join(repoDir, entry.entryName);
//       if (entry.isDirectory) {
//         fs.mkdir(entryPath, { recursive: true });
//       } else {
//         fs.writeFile(entryPath, entry.getData());
//       }
//     });
//     logger.debug(`Successfully extracted repository to ${repoDir}`);

//     // Cleanup ZIP file
//     await fs.unlink(zipPath);
//     logger.debug(`Deleted ZIP file at ${zipPath}`);

//     return repoDir;
//   } catch (error: any) {
//     logger.debug(`Error downloading and extracting repository ZIP: ${error.message}`);
//     return null;
//   }
// }


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

  const repoDir = path.join(process.env.tmpDir!, repoName);

  try {
    logger.debug(`Attempting to delete repository directory: ${repoDir}`);
    await fspromises.rm(repoDir, { recursive: true, force: true });
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



interface LineCountResult {
  totalLinesCorrectness: number;
  totalLinesRamp: number;
}

export async function calculateLinesOfCode(repoDir: string): Promise<LineCountResult> {
  let totalLinesCorrectness = 0;
  let totalLinesRamp = 0;

  // Recursively get all files in the directory
  async function getFiles(dir: string): Promise<string[]> {
    const entries = await fs.promises.readdir(dir, { withFileTypes: true });
    const files = await Promise.all(entries.map((entry) => {
      const res = path.resolve(dir, entry.name);
      return entry.isDirectory() ? getFiles(res) : Promise.resolve([res]);
    }));
    return Array.prototype.concat(...files);
  }

  try {
    const allFiles = await getFiles(repoDir);

    // Filter only JavaScript or TypeScript files
    const filteredFiles = allFiles.filter(file => file.endsWith('.js') || file.endsWith('.ts'));

    for (const file of filteredFiles) {
      const lineCount = await countLines(file);
      totalLinesCorrectness += lineCount;
      totalLinesRamp += lineCount; // Assuming both correctness and ramp use the same count here
    }
  } catch (error) {
    console.error(`Error calculating lines of code: ${(error as Error).message}`);
  }

  return { totalLinesCorrectness, totalLinesRamp };
}

function countLines(filePath: string): Promise<number> {
  return new Promise((resolve, reject) => {
    let lineCount = 0;

    const stream = fs.createReadStream(filePath);
    stream.on('data', (buffer: Buffer) => {
      let idx = -1;
      lineCount--; // Adjust because the loop runs one extra time for the final chunk
      do {
        idx = buffer.indexOf(10, idx + 1); // 10 is the ASCII code for line feed '\n'
        lineCount++;
      } while (idx !== -1);
    }).on('end', () => {
      resolve(lineCount);
    }).on('error', (err) => {
      reject(err);
    });
  });
}
