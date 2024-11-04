import { getGithubRepoInfoFromUrl } from "./rating/processURL";
import {getLogger, logTestResults} from "./rating/logger";
import { calculateNetScore } from "./rating/metrics/netScore";
import crypto from "crypto";
import  pool from "./services/dbService";
export type PackageInfo = {
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
	PINNED_DEPENDENCIES_SCORE: number;
};

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
    };
  }

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
  const pullRequestsScore = 1; // Placeholder value
  const pinnedDependenciesScore = 1; // Placeholder value

  const newRating: PackageInfo = {
    ID: ID?ID:"", // Example: adjust as needed
    NAME: pkgName,
    OWNER: pkgOwner,
    VERSION: "1.0.0", // Example version
    URL: pkgUrl,
    NET_SCORE: NetScore,
    RAMP_UP_SCORE: RampUp,
    CORRECTNESS_SCORE: Correctness,
    BUS_FACTOR_SCORE: BusFactor,
    RESPONSIVE_MAINTAINER_SCORE: ResponsiveMaintainer,
    LICENSE_SCORE: License,
    PULL_REQUESTS_SCORE: pullRequestsScore,
    PINNED_DEPENDENCIES_SCORE: pinnedDependenciesScore,
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