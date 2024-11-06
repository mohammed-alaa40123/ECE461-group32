/**
 * Calculate the net score of a repository
 */
import { calculateLicenseScore } from "./license";
import { calculateRampUpScore } from "./rampUp";
import { calculateResponsiveMaintainerScore } from "./responsiveMaintainer";
import { calculateCorrectness } from "./correctness";
import { GithubRepoInfo, processURLs } from "../processURL";
import { calculateBusFactorScore } from "./busFactor";
import {calculateCodeReviewFractionMetric} from "./ReviewFraction";
import {calculatePinningFraction} from "./dependencyPinning";
import { getLogger } from "../logger";
import { promisify } from "util";
import { exec } from "child_process";
import { cloneRepoAsZip, deleteRepo } from "../util";

const logger = getLogger();

/**
 * Calculate the net score of a repository and print it to standard out
 * @param repoOwner The owner of the repository
 * @param repoName The name of the repository
 */
export async function calculateNetScore(linkPath?: string, repoInfo?: GithubRepoInfo): Promise<any> {
  let results: any = [];
  if (linkPath) {
    results = await processURLs(linkPath);
  }
  else if (repoInfo) {
    results = [{ packageName: repoInfo.repo , owner: repoInfo.owner, url: repoInfo.url }];
  }

  for (const { packageName, owner, url } of results) {
    const netStart = Date.now();
    const repoDir = await cloneRepoAsZip(`https://github.com/${owner}/${packageName}`, packageName);

    let totalLinesCorrectness = 0;
    let totalLinesRamp = 0;
    if (repoDir) {
      try {
        const execAsync = promisify(exec);
        const slocCommand = 'npx sloc'; // Using npx to run sloc without needing a global install
      
        // Set environment variables for npm
        const env = {
          ...process.env,
          HOME: '/tmp',
          NPM_CONFIG_CACHE: '/tmp/.npm',
          XDG_CACHE_HOME: '/tmp/.cache'
        };
      
        const { stdout } = await execAsync(`${slocCommand} --format json ${repoDir}`, { env });
        const slocData = JSON.parse(stdout);
        const jsLines = slocData.JavaScript?.source || 0;
        const tsLines = slocData.TypeScript?.source || 0;
        totalLinesCorrectness = jsLines + tsLines;
        totalLinesRamp = slocData.total?.source || 0;
        logger.debug(`Sloc data - JS Lines: ${jsLines}, TS Lines: ${tsLines}, Total Lines: ${totalLinesCorrectness}`);
      } catch (error: any) {
        logger.info(`Error calculating lines of code: ${error.message}`);
      }
      
    }

    const [licenseScoreResult, rampUpScoreResult, responsiveMaintainerScoreResult, busFactorResult, correctnessResult, codeReviewFractionResult] =
      await Promise.all([
        calculateWithLatency(() => calculateLicenseScore(owner, packageName, repoDir)),
        calculateWithLatency(() => calculateRampUpScore(owner, packageName, repoDir, totalLinesRamp)),
        calculateWithLatency(() => calculateResponsiveMaintainerScore(owner, packageName)),
        calculateWithLatency(() => calculateBusFactorScore(owner, packageName)),
        calculateWithLatency(() => calculateCorrectness(repoDir, totalLinesCorrectness)),
        calculateWithLatency(() => calculateCodeReviewFractionMetric(owner, packageName)) 
      ]);

    const { score: licenseScore, latency: licenseLatency } = licenseScoreResult;
    const { score: rampUpScore, latency: rampUpLatency } = rampUpScoreResult;
    const { score: responsiveMaintainerScore, latency: responsiveMaintainerLatency } = responsiveMaintainerScoreResult;
    const { score: busFactor, latency: busFactorLatency } = busFactorResult;
    const { score: correctness, latency: correctnessLatency } = correctnessResult;
    const {score: codeReviewFraction, latency: codeReviewFractionLatency} = codeReviewFractionResult;
    const netScore =
      0.25 * licenseScore + 0.1 * rampUpScore + 0.15 * responsiveMaintainerScore + 0.15 * busFactor + 0.25 * correctness + 0.1 * codeReviewFraction;

    const netEnd = Date.now();
    const netLatency = (netEnd - netStart) / 1000;

    logger.console(
      JSON.stringify({
        URL: url.trim(),
        NetScore: parseFloat(netScore.toFixed(2)),
        NetScore_Latency: parseFloat(netLatency.toFixed(3)),
        RampUp: parseFloat(rampUpScore.toFixed(2)),
        RampUp_Latency: parseFloat(rampUpLatency.toFixed(3)),
        Correctness: parseFloat(correctness.toFixed(2)),
        Correctness_Latency: parseFloat(correctnessLatency.toFixed(3)),
        BusFactor: parseFloat(busFactor.toFixed(2)),
        BusFactor_Latency: parseFloat(busFactorLatency.toFixed(3)),
        ResponsiveMaintainer: parseFloat(responsiveMaintainerScore.toFixed(2)),
        ResponsiveMaintainer_Latency: parseFloat(responsiveMaintainerLatency.toFixed(3)),
        License: parseFloat(licenseScore.toFixed(2)),
        License_Latency: parseFloat(licenseLatency.toFixed(3)),
        CodeReviewFraction: parseFloat(codeReviewFraction.toFixed(2)),
        CodeReviewFraction_Latency: parseFloat(codeReviewFractionLatency.toFixed(3))
      })
    );

    if (repoDir) {
      await deleteRepo(packageName);
    }

    return {
      URL: url.trim(),
      NetScore: parseFloat(netScore.toFixed(2)),
      NetScore_Latency: parseFloat(netLatency.toFixed(3)),
      RampUp: parseFloat(rampUpScore.toFixed(2)),
      RampUp_Latency: parseFloat(rampUpLatency.toFixed(3)),
      Correctness: parseFloat(correctness.toFixed(2)),
      Correctness_Latency: parseFloat(correctnessLatency.toFixed(3)),
      BusFactor: parseFloat(busFactor.toFixed(2)),
      BusFactor_Latency: parseFloat(busFactorLatency.toFixed(3)),
      ResponsiveMaintainer: parseFloat(responsiveMaintainerScore.toFixed(2)),
      ResponsiveMaintainer_Latency: parseFloat(responsiveMaintainerLatency.toFixed(3)),
      License: parseFloat(licenseScore.toFixed(2)),
      License_Latency: parseFloat(licenseLatency.toFixed(3)),
      CodeReviewFraction: parseFloat(codeReviewFraction.toFixed(2)),
      CodeReviewFraction_Latency: parseFloat(codeReviewFractionLatency.toFixed(3))
    };
  }
}

/**
 * Calculate the score of a function and return the score and latency
 * @param calculateFn The function to calculate the score
 * @returns The score and latency
 */
async function calculateWithLatency(calculateFn: () => Promise<number>): Promise<{ score: number; latency: number }> {
  const startTime = Date.now();
  try {
    const score = await calculateFn();
    const endTime = Date.now();
    const latency = (endTime - startTime) / 1000;
    return { score, latency };
  } catch (error) {
    logger.info(`Error calculating score: ${error}`);
    const endTime = Date.now();
    const latency = (endTime - startTime) / 1000;
    return { score: 0, latency: latency };
  }
}
