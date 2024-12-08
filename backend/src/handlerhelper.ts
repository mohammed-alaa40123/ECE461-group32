/**
 * @file handlerhelper.ts
 * @description
 * This file provides helper functions and type definitions for managing package-related operations
 * within the backend service. It includes utilities for fetching GitHub repository information,
 * logging activities, calculating various metrics scores, and interacting with the PostgreSQL database.
 *
 * @imports
 * - `getGithubRepoInfoFromUrl` from `./rating/processURL`: Fetches GitHub repository details based on a given URL.
 * - `getLogger`, `logTestResults` from `./rating/logger`: Provides logging utilities for monitoring and debugging.
 * - `calculateNetScore` from `./rating/metrics/netScore`: Computes the net score for a package based on multiple metrics.
 * - `crypto` from `crypto`: Node.js module for cryptographic functionalities.
 * - `pool` from `./services/dbService`: PostgreSQL client for executing database queries.
 *
 *  *
 * @author
 * Mohamed Ahmed
 * @date
 * 2024-12-07
 */

import { getGithubRepoInfoFromUrl } from "./rating/processURL";
import {getLogger, logTestResults} from "./rating/logger";
import { calculateNetScore } from "./rating/metrics/netScore";
import crypto from "crypto";
import  pool from "./services/dbService";
export interface PackageInfo {
  ID: string;
  NAME: string;
  OWNER: string;
  VERSION: string;
  URL: string;
  NET_SCORE: number;
  RAMP_UP_SCORE: number;
  CORRECTNESS_SCORE: number;
  BUS_FACTOR_SCORE: number;
  RESPONSIVE_MAINTAINER_SCORE: number;
  LICENSE_SCORE: number;
  PULL_REQUESTS_SCORE: number;
  NET_SCORE_LATENCY: number;
  PINNED_DEPENDENCIES_SCORE: number;
  RAMP_UP_SCORE_LATENCY: number;
  CORRECTNESS_SCORE_LATENCY: number;
  BUS_FACTOR_SCORE_LATENCY: number;
  RESPONSIVE_MAINTAINER_SCORE_LATENCY: number;
  LICENSE_SCORE_LATENCY: number;
  PULL_REQUESTS_SCORE_LATENCY: number;
  PINNED_DEPENDENCIES_SCORE_LATENCY: number;
}

interface ConvertedPackageInfo {
  BusFactor: number;
  BusFactorLatency: number;
  Correctness: number;
  CorrectnessLatency: number;
  RampUp: number;
  RampUpLatency: number;
  ResponsiveMaintainer: number;
  ResponsiveMaintainerLatency: number;
  LicenseScore: number;
  LicenseScoreLatency: number;
  GoodPinningPractice: number;
  GoodPinningPracticeLatency: number;
  PullRequest: number;
  PullRequestLatency: number;
  NetScore: number;
  NetScoreLatency: number;
}

export function convertPackageInfo(newRating: PackageInfo): ConvertedPackageInfo {
  return {
    BusFactor: newRating.BUS_FACTOR_SCORE,
    BusFactorLatency: newRating.BUS_FACTOR_SCORE_LATENCY,
    Correctness: newRating.CORRECTNESS_SCORE,
    CorrectnessLatency: newRating.CORRECTNESS_SCORE_LATENCY,
    RampUp: newRating.RAMP_UP_SCORE,
    RampUpLatency: newRating.RAMP_UP_SCORE_LATENCY,
    ResponsiveMaintainer: newRating.RESPONSIVE_MAINTAINER_SCORE,
    ResponsiveMaintainerLatency: newRating.RESPONSIVE_MAINTAINER_SCORE_LATENCY,
    LicenseScore: newRating.LICENSE_SCORE,
    LicenseScoreLatency: newRating.LICENSE_SCORE_LATENCY,
    GoodPinningPractice: newRating.PINNED_DEPENDENCIES_SCORE,
    GoodPinningPracticeLatency: newRating.PINNED_DEPENDENCIES_SCORE_LATENCY,
    PullRequest: newRating.PULL_REQUESTS_SCORE,
    PullRequestLatency: newRating.PULL_REQUESTS_SCORE_LATENCY,
    NetScore: newRating.NET_SCORE,
    NetScoreLatency: newRating.NET_SCORE_LATENCY
  };
}
const logger = getLogger();

export async function metricCalcFromUrlUsingNetScore(url: string,ID?:string): Promise<PackageInfo | null> {
  const repoInfo = await getGithubRepoInfoFromUrl(url);
  if (!repoInfo) {
    return null;
  }

  const pkgName = repoInfo.repo;
  const pkgOwner = repoInfo.owner;
  const pkgUrl = repoInfo.url;

  // Check if this package version is already rated in the database
  const existingRating = await pool.query(
    `SELECT 
    p.id, 
    p.name, 
    p.owner, 
    p.version,
    p.url,
    pr.bus_factor, 
    pr.bus_factor_latency, 
    pr.correctness, 
    pr.correctness_latency, 
    pr.ramp_up, 
    pr.ramp_up_latency, 
    pr.responsive_maintainer, 
    pr.responsive_maintainer_latency, 
    pr.license_score, 
    pr.license_score_latency, 
    pr.good_pinning_practice, 
    pr.good_pinning_practice_latency, 
    pr.pull_request, 
    pr.pull_request_latency, 
    pr.net_score, 
    pr.net_score_latency
FROM 
    packages p
JOIN 
    package_ratings pr ON p.id = pr.package_id
WHERE 
    p.name = $1 
    AND p.owner = $2;
`,
    [pkgName, pkgOwner]
  );

  if (existingRating.rows.length > 0) {
    const storedRating = existingRating.rows[0];
    return {
      ID: storedRating.id,
      NAME: storedRating.name,
      OWNER: storedRating.owner,
      VERSION: storedRating.version,
      URL: storedRating.url,
      NET_SCORE: storedRating.net_score,
      RAMP_UP_SCORE: storedRating.ramp_up,
      CORRECTNESS_SCORE: storedRating.correctness,
      BUS_FACTOR_SCORE: storedRating.bus_factor,
      RESPONSIVE_MAINTAINER_SCORE: storedRating.responsive_maintainer,
      LICENSE_SCORE: storedRating.license_score,
      PULL_REQUESTS_SCORE: storedRating.pull_request,
      PINNED_DEPENDENCIES_SCORE: storedRating.good_pinning_practice,
      NET_SCORE_LATENCY: storedRating.net_score_latency,
      RAMP_UP_SCORE_LATENCY: storedRating.ramp_up_latency,
      CORRECTNESS_SCORE_LATENCY: storedRating.correctness_latency,
      BUS_FACTOR_SCORE_LATENCY: storedRating.bus_factor_latency,
      RESPONSIVE_MAINTAINER_SCORE_LATENCY: storedRating.responsive_maintainer_latency,
      LICENSE_SCORE_LATENCY: storedRating.license_score_latency,
      PULL_REQUESTS_SCORE_LATENCY: storedRating.pull_request_latency,
      PINNED_DEPENDENCIES_SCORE_LATENCY: storedRating.good_pinning_practice_latency,
  
    };
  }

  // Fetch the repository details to get the default branch
  const repoDetailsUrl = `https://api.github.com/repos/${pkgOwner}/${pkgName}`;
  const repoDetailsResponse = await fetch(repoDetailsUrl, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!repoDetailsResponse.ok) {
    throw new Error('Failed to fetch repository details from GitHub');
  }

  const repoDetails = await repoDetailsResponse.json() as unknown as any;
  const defaultBranch = repoDetails.default_branch;

  // Fetch the package.json file from the default branch
  const packageJsonUrl = `https://raw.githubusercontent.com/${pkgOwner}/${pkgName}/${defaultBranch}/package.json`;
  const packageJsonResponse = await fetch(packageJsonUrl, {
    headers: {
      Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
      Accept: 'application/vnd.github.v3+json',
    },
  });

  if (!packageJsonResponse.ok) {
    throw new Error('Failed to fetch package.json from GitHub');
  }

  const packageJson = await packageJsonResponse.json() as unknown as any;
  let pkgVersion = packageJson.version;
  
  const versionPattern = /^\d+\.\d+\.\d+$/;
  
  if (!pkgVersion || !versionPattern.test(pkgVersion)) {
    // Fetch the version via releases
    const releasesResponse = await fetch('https://api.github.com/repos/' + pkgOwner + '/' + pkgName + '/releases', {  
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });
    const releasesJson = await releasesResponse.json() as unknown as any;
    pkgVersion = releasesJson[0]?.tag_name; // Assuming the latest release is the first item
  
    // Extract version if it matches the pattern
    if (pkgVersion && !versionPattern.test(pkgVersion)) {
      const match = pkgVersion.match(/\d+\.\d+\.\d+/);
      pkgVersion = match ? match[0] : undefined;
    }
  }
  
  if (!pkgVersion || !versionPattern.test(pkgVersion)) {
    throw new Error('Valid version not found in package.json or releases');
  }
  // If not rated, calculate Net Score
  const netScoreJSON = await calculateNetScore(undefined, repoInfo);
  if (!netScoreJSON) {
    return null;
  }
  console.log("Net Score JSON", netScoreJSON);
  const NetScore = netScoreJSON.NetScore;
  const RampUp = netScoreJSON.RampUp;
  const Correctness = netScoreJSON.Correctness;
  const BusFactor = netScoreJSON.BusFactor;
  const ResponsiveMaintainer = netScoreJSON.ResponsiveMaintainer;
  const License = netScoreJSON.License;

  // Placeholder values for Pull Requests Score and Pinned Dependencies Score
  const pullRequestsScore = netScoreJSON.CodeReviewFraction; // Placeholder value
  const pinnedDependenciesScore = netScoreJSON.DependencyPinning; // Placeholder value

  const newRating: PackageInfo = {
    ID: ID?ID:"", // Example: adjust as needed
    NAME: pkgName,
    OWNER: pkgOwner,
    VERSION: pkgVersion, // Example version
    URL: pkgUrl,
    NET_SCORE: NetScore,
    RAMP_UP_SCORE: RampUp,
    CORRECTNESS_SCORE: Correctness,
    BUS_FACTOR_SCORE: BusFactor,
    RESPONSIVE_MAINTAINER_SCORE: ResponsiveMaintainer,
    LICENSE_SCORE: License,
    PULL_REQUESTS_SCORE: pullRequestsScore,
    NET_SCORE_LATENCY: netScoreJSON.NetScore_Latency,
    PINNED_DEPENDENCIES_SCORE: pinnedDependenciesScore,
    RAMP_UP_SCORE_LATENCY: netScoreJSON.RampUp_Latency,
    CORRECTNESS_SCORE_LATENCY: netScoreJSON.Correctness_Latency,
    BUS_FACTOR_SCORE_LATENCY: netScoreJSON.BusFactor_Latency,
    RESPONSIVE_MAINTAINER_SCORE_LATENCY: netScoreJSON.ResponsiveMaintainer_Latency,
    LICENSE_SCORE_LATENCY: netScoreJSON.License_Latency,
    PULL_REQUESTS_SCORE_LATENCY: netScoreJSON.CodeReviewFraction_Latency,
    PINNED_DEPENDENCIES_SCORE_LATENCY: netScoreJSON.DependencyPinning_Latency
  
  };

  

  return newRating;
}


  export const generatePackageId = (): string => {
    // console.log(`Generating id`);
    
    // Generate a random 63-bit integer to ensure it fits within the positive range of BIGINT
    const randomBytes = crypto.randomBytes(8); // 8 bytes = 64 bits
    let id = BigInt(`0x${randomBytes.toString('hex')}`);
    
    // Ensure the ID is within the positive range of BIGINT
    const maxBigInt = BigInt('9223372');
    id = id % maxBigInt;
    
    // console.log(`Generated package id ${id.toString()} successfully`);
    return id.toString();
};


// Helper function to fetch package.json and get dependencies
export async function fetchPackageDependencies(pkgOwner: string, pkgName: string): Promise<string[]> {
  try {
    // Fetch the repository details to get the default branch
    const repoDetailsUrl = `https://api.github.com/repos/${pkgOwner}/${pkgName}`;
    const repoDetailsResponse = await fetch(repoDetailsUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!repoDetailsResponse.ok) {
      throw new Error('Failed to fetch repository details from GitHub');
    }

    const repoDetails = await repoDetailsResponse.json() as unknown as any;
    const defaultBranch = repoDetails.default_branch;

    // Fetch the package.json file from the default branch
    const packageJsonUrl = `https://raw.githubusercontent.com/${pkgOwner}/${pkgName}/${defaultBranch}/package.json`;
    const packageJsonResponse = await fetch(packageJsonUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!packageJsonResponse.ok) {
      throw new Error('Failed to fetch package.json from GitHub');
    }

    const packageJson = await packageJsonResponse.json() as { dependencies: { [key: string]: string } };
    // console.log("Package JSON", packageJson);
    return Object.keys(packageJson.dependencies || {});
  } catch (error) {
    console.error('Error fetching package dependencies:', error);
    throw error;
  }
}

// Helper function to fetch repository details
export async function fetchRepoDetails(packageName: string): Promise<{packageId:string, url: string, owner: string, name: string, defaultBranch: string,version:string } | null> {
  try {
    // Fetch package metadata from the npm registry
    const npmUrl = `https://registry.npmjs.org/${packageName}`;
    const npmResponse = await fetch(npmUrl);

    if (!npmResponse.ok) {
      console.error(`Failed to fetch npm metadata for ${packageName}`);
      return null;
    }

    const npmData = await npmResponse.json() as unknown as any;
    const latestVersion = npmData['dist-tags'].latest;
    const npmDataLatest = npmData.versions[latestVersion];

    const repoUrl = npmDataLatest.repository?.url;

    if (!repoUrl) {
      console.error(`No repository URL found for ${packageName}`);
      return null;
    }

    // Extract owner and repository name from the repository URL
    const repoMatch = repoUrl.match(/github\.com\/([^\/]+)\/([^\/]+)(\.git)?$/);
    if (!repoMatch) {
      console.error(`Invalid repository URL format for ${packageName}: ${repoUrl}`);
      return null;
    }

    let [, owner, name] = repoMatch;
    name = name.replace(/\.git$/, '');
    console.log(`Owner: ${owner}, Name: ${name}`);

    // Fetch additional details from the GitHub API
    const repoDetailsUrl = `https://api.github.com/repos/${owner}/${name}`;
    const repoDetailsResponse = await fetch(repoDetailsUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!repoDetailsResponse.ok) {
      console.error(`Failed to fetch repository details for ${owner}/${name}`);
      return null;
    }

    const repoDetails = await repoDetailsResponse.json() as unknown as any;
    return {
      packageId: generatePackageId(),
      url: repoDetails.html_url,
      owner: repoDetails.owner.login,
      name: repoDetails.name,
      version: latestVersion,
      defaultBranch: repoDetails.default_branch,
    };
  } catch (error) {
    console.error(`Error fetching repository details for ${packageName}:`, error);
    return null;
  }
}
// Helper function to fetch package size from GitHub
export async function fetchPackageSize(pkgOwner: string, pkgName: string, defaultBranch: string): Promise<number> {
  try {
    const releasesUrl = `https://api.github.com/repos/${pkgOwner}/${pkgName}/tags`;
    const releasesResponse = await fetch(releasesUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!releasesResponse.ok) {
      throw new Error('Failed to fetch releases from GitHub');
    }

    const releases = await releasesResponse.json() as any[];
    if (releases.length === 0) {
      throw new Error('No releases found for the repository');
    }

    const tarballUrl = releases[0].zipball_url;
    const tarballResponse = await fetch(tarballUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!tarballResponse.ok) {
      throw new Error('Failed to fetch tarball from GitHub');
    }

    const arrayBuffer = await tarballResponse.arrayBuffer();
    const sizeInMB = arrayBuffer.byteLength / (1024 * 1024); // Convert bytes to MB
    return sizeInMB;
  } catch (error) {
    console.error('Error fetching package size:', error);
    throw error;
  }
}

// Helper function to fetch package size from npm
export async function fetchNpmPackageSize(packageName: string): Promise<number> {
  try {
    const npmPackageUrl = `https://registry.npmjs.org/${packageName}`;
    const npmPackageResponse = await fetch(npmPackageUrl);

    if (!npmPackageResponse.ok) {
      throw new Error(`Failed to fetch package details from npm for ${packageName}`);
    }

    const npmPackage = await npmPackageResponse.json() as any;
    const latestVersion = npmPackage['dist-tags'].latest;
    const tarballUrl = npmPackage.versions[latestVersion].dist.tarball;

    const tarballResponse = await fetch(tarballUrl);

    if (!tarballResponse.ok) {
      throw new Error(`Failed to fetch tarball for ${packageName}`);
    }

    const arrayBuffer = await tarballResponse.arrayBuffer();
    const sizeInMB = arrayBuffer.byteLength / (1024 * 1024); // Convert bytes to MB
    return sizeInMB;
  } catch (error) {
    console.error(`Error fetching package size from npm for ${packageName}:`, error);
    return 0;
  }
}

// Helper function to get the default branch of a repository
export async function getDefaultBranch(pkgOwner: string, pkgName: string): Promise<string> {
  try {
    const repoDetailsUrl = `https://api.github.com/repos/${pkgOwner}/${pkgName}`;
    const repoDetailsResponse = await fetch(repoDetailsUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!repoDetailsResponse.ok) {
      throw new Error('Failed to fetch repository details from GitHub');
    }

    const repoDetails = await repoDetailsResponse.json() as unknown as any;
    return repoDetails.default_branch;
  } catch (error) {
    console.error('Error fetching default branch:', error);
    throw error;
  }
}