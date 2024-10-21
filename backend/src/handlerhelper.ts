import { getGithubRepoInfoFromUrl } from "./rating/processURL";
import {getLogger, logTestResults} from "./rating/logger";
import { calculateNetScore } from "./rating/metrics/netScore";
import crypto from "crypto";

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

export async function metricCalcFromUrlUsingNetScore(url: string): Promise<PackageInfo | null> {
    const repoInfo = await getGithubRepoInfoFromUrl(url);
    logger.info("repoInfo:", repoInfo);
    if (repoInfo == null) {
      return null;
    }
  
    // Calculate Net Score
    const netScoreJSON = await calculateNetScore(undefined,repoInfo);
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
  
    const currentRepoInfoScores: PackageInfo = {
      ID: "",
      NAME: repoInfo.repo,
      OWNER: repoInfo.owner,
      VERSION: "1.0.0",
      URL: repoInfo.url,
      NET_SCORE: NetScore,
      RAMP_UP_SCORE: RampUp,
      CORRECTNESS_SCORE: Correctness,
      BUS_FACTOR_SCORE: BusFactor,
      RESPONSIVE_MAINTAINER_SCORE: ResponsiveMaintainer,
      LICENSE_SCORE: License,
      PULL_REQUESTS_SCORE: pullRequestsScore,
      PINNED_DEPENDENCIES_SCORE: pinnedDependenciesScore,
    };
  
    return currentRepoInfoScores;
  }


  export const generatePackageId = (name: string, version: string): string => {
    console.log(`Generating id for ${name}@${version}`);
    
    // Generate a random 63-bit integer to ensure it fits within the positive range of BIGINT
    const randomBytes = crypto.randomBytes(8); // 8 bytes = 64 bits
    let id = BigInt(`0x${randomBytes.toString('hex')}`);
    
    // Ensure the ID is within the positive range of BIGINT
    const maxBigInt = BigInt('9223372');
    id = id % maxBigInt;
    
    console.log(`Generated package id ${id.toString()} for ${name}@${version}`);
    return id.toString();
};