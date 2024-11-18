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
      RAMP_UP_SCORE: storedRating.ramp_up_score,
      CORRECTNESS_SCORE: storedRating.correctness_score,
      BUS_FACTOR_SCORE: storedRating.bus_factor_score,
      RESPONSIVE_MAINTAINER_SCORE: storedRating.responsive_maintainer_score,
      LICENSE_SCORE: storedRating.license_score,
      PULL_REQUESTS_SCORE: storedRating.pull_requests_score,
      PINNED_DEPENDENCIES_SCORE: storedRating.pinned_dependencies_score,
      NET_SCORE_LATENCY: storedRating.net_score_latency,
      RAMP_UP_SCORE_LATENCY: storedRating.ramp_up_score_latency,
      CORRECTNESS_SCORE_LATENCY: storedRating.correctness_score_latency,
      BUS_FACTOR_SCORE_LATENCY: storedRating.bus_factor_score_latency,
      RESPONSIVE_MAINTAINER_SCORE_LATENCY: storedRating.responsive_maintainer_score_latency,
      LICENSE_SCORE_LATENCY: storedRating.license_score_latency,
      PULL_REQUESTS_SCORE_LATENCY: storedRating.pull_requests_score_latency,
      PINNED_DEPENDENCIES_SCORE_LATENCY: storedRating.pinned_dependencies_score_latency,
  
    };
  }

  const packageJsonUrl = `https://raw.githubusercontent.com/${pkgOwner}/${pkgName}/main/package.json`;
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
  const pkgVersion = packageJson.version;
  // If not rated, calculate Net Score
  const netScoreJSON = await calculateNetScore(undefined, repoInfo);
  if (!netScoreJSON) {
    return null;
  }

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
    console.log(`Generating id`);
    
    // Generate a random 63-bit integer to ensure it fits within the positive range of BIGINT
    const randomBytes = crypto.randomBytes(8); // 8 bytes = 64 bits
    let id = BigInt(`0x${randomBytes.toString('hex')}`);
    
    // Ensure the ID is within the positive range of BIGINT
    const maxBigInt = BigInt('9223372');
    id = id % maxBigInt;
    
    console.log(`Generated package id ${id.toString()} successfully`);
    return id.toString();
};