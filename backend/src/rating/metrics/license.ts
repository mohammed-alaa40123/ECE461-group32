/**
 * This file contains the functions to calculate the license score of a repository
 */
import { graphqlClient, GET_VALUES_FOR_LICENSE } from "../graphqlClient";
import { LicenseReponse } from "../types";
import { getLogger } from "../logger";
import path from "path";
import { readFile } from "fs/promises";

const logger = getLogger();

const Licenses = new Set([
  "MIT",
  "Apache-2.0",
  "ISC",
  "BSD-2-Clause",
  "BSD-3-Clause",
  "0BSD",
  "Academic Free License v3.0",
  "AFL-3.0",
  "Artistic License 2.0",
  "Artistic-2.0",
  "Boost Software License 1.0",
  "BSL-1.0",
  "BSD-4-Clause",
  "BSD-3-Clause-Clear",
  "Creative Commons license family",
  "CC",
  "Creative Commons Zero v1.0 Universal",
  "CC0-1.0",
  "Creative Commons Attribution 4.0",
  "CC-BY-4.0",
  "Creative Commons Attribution ShareAlike 4.0",
  "CC-BY-SA-4.0",
  "Do What The F*ck You Want To Public License",
  "WTFPL",
  "Educational Community License v2.0",
  "ECL-2.0",
  "Eclipse Public License 1.0",
  "EPL-1.0",
  "Eclipse Public License 2.0",
  "EPL-2.0",
  "European Union Public License 1.1",
  "EUPL-1.1",
  "GNU Affero General Public License v3.0",
  "AGPL-3.0",
  "GNU General Public License v2.0",
  "GPL-2.0",
  "GNU General Public License v3.0",
  "GPL-3.0",
  "GNU Lesser General Public License v2.1",
  "LGPL-2.1",
  "GNU Lesser General Public License v3.0",
  "LGPL-3.0",
  "LaTeX Project Public License v1.3c",
  "LPPL-1.3c",
  "Microsoft Public License",
  "MS-PL",
  "Mozilla Public License 2.0",
  "MPL-2.0",
  "Open Software License 3.0",
  "OSL-3.0",
  "PostgreSQL License",
  "PostgreSQL",
  "SIL Open Font License 1.1",
  "OFL-1.1",
  "University of Illinois/NCSA Open Source License",
  "NCSA",
  "The Unlicense",
  "Zlib",
  "zLib License"
]);

/**
 * Fetch the license of a repository from the GitHub GraphQL API
 * @param repoOwner The owner of the repository
 * @param repoName The name of the repository
 * @returns The license of the repository or null if not found
 */
async function fetchLicenseFromGraphQL(repoOwner: string, repoName: string): Promise<string | null> {
  try {
    const data: LicenseReponse = await graphqlClient.request(GET_VALUES_FOR_LICENSE, {
      repoOwner,
      repoName
    });

    const restLicense = data.repository.licenseInfo.spdxId;
    logger.debug("restLicense: ", restLicense);

    return Licenses.has(restLicense) ? restLicense : null;
  } catch (error) {
    logger.info("Error retrieving license information:", error);
    return null;
  }
}

/**
 * Fetch the license of a repository from the README.md file
 * @param repoDir The directory of the repository
 * @returns The license of the repository or null if not found
 */
async function fetchLicenseFromReadme(repoDir: string): Promise<string | null> {
  try {
    const readmePath = path.join(repoDir, "README.md");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath is controlled by the script
    const readmeContent = await readFile(readmePath, "utf8");

    for (const licenseName of Licenses) {
      // eslint-disable-next-line security/detect-non-literal-regexp -- licenseName comes from trusted source
      if (new RegExp(`\\b${licenseName}\\b`, "i").test(readmeContent)) {
        return licenseName;
      }
    }

    return null;
  } catch (readError) {
    logger.info(`README.md not found or could not be read: ${readError}`);
    return null;
  }
}

/**
 * Fetch the license of a repository from the package.json file
 * @param repoDir The directory of the repository
 * @returns The license of the repository or null if not found
 */
async function fetchLicenseFromPackageJson(repoDir: string): Promise<string | null> {
  try {
    const packageJsonPath = path.join(repoDir, "package.json");
    // eslint-disable-next-line security/detect-non-literal-fs-filename -- filePath is controlled by the script
    const packageJson = await readFile(packageJsonPath, "utf8");
    const packageJsonObj = JSON.parse(packageJson);
    const license = packageJsonObj.license;
    return Licenses.has(license) ? license : null;
  } catch (readError) {
    logger.info(`package.json not found or could not be read: ${readError}`);
    return null;
  }
}

/**
 * Calculate the license score of a repository. The score is based on the presence of a license in the repository.
 * @param repoOwner The owner of the repository
 * @param repoName The name of the repository
 * @param repoDir The directory of the repository
 * @returns The license score of the repository
 */
export async function calculateLicenseScore(
  repoOwner: string,
  repoName: string,
  repoDir: string | null
): Promise<number> {
  const restLicense = await fetchLicenseFromGraphQL(repoOwner, repoName);
  if (restLicense) {
    logger.info("License found in GraphQL");
    return 1;
  }

  if (!repoDir) {
    logger.info("Could not calculate license score: No repository directory provided");
    return 0;
  }

  const readmeLicense = await fetchLicenseFromReadme(repoDir);
  if (readmeLicense) {
    logger.info("License found in README.md");
    return 1;
  }

  const packageJsonLicense = await fetchLicenseFromPackageJson(repoDir);
  if (packageJsonLicense) {
    logger.info("License found in package.json");
    return 1;
  }
  logger.info("No license found");
  return 0;
}
