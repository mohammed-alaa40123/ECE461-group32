/**
 * Calculate the net score of a repository
 */
import { calculateLicenseScore } from "./license";
import { calculateRampUpScore } from "./rampUp";
import { calculateResponsiveMaintainerScore } from "./responsiveMaintainer";
import { calculateCorrectness } from "./correctness";
import { GithubRepoInfo, processURLs } from "../processURL";
import { calculateBusFactorScore } from "./busFactor";
import { getLogger } from "../logger";
import { promisify } from "util";
import { exec } from "child_process";
import { cloneRepo } from "../util";

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
    const repoDir = await cloneRepo(`https://github.com/${owner}/${packageName}.git`, packageName);

    let totalLinesCorrectness = 0;
    let totalLinesRamp = 0;
    if (repoDir) {
      try {
        const execAsync = promisify(exec);
        const { stdout } = await execAsync(`npx cloc --json ${repoDir}`);
        const clocData = JSON.parse(stdout);
        const jsLines = clocData.JavaScript?.code || 0;
        const tsLines = clocData.TypeScript?.code || 0;
        totalLinesCorrectness = jsLines + tsLines;
        totalLinesRamp = clocData.SUM?.code || 0;
      } catch (error) {
        logger.info(`Error calculating lines of code: ${error}`);
      }
    }

    const [licenseScoreResult, rampUpScoreResult, responsiveMaintainerScoreResult, busFactorResult, correctnessResult] =
      await Promise.all([
        calculateWithLatency(() => calculateLicenseScore(owner, packageName, repoDir)),
        calculateWithLatency(() => calculateRampUpScore(owner, packageName, repoDir, totalLinesRamp)),
        calculateWithLatency(() => calculateResponsiveMaintainerScore(owner, packageName)),
        calculateWithLatency(() => calculateBusFactorScore(owner, packageName)),
        calculateWithLatency(() => calculateCorrectness(repoDir, totalLinesCorrectness))
      ]);

    const { score: licenseScore, latency: licenseLatency } = licenseScoreResult;
    const { score: rampUpScore, latency: rampUpLatency } = rampUpScoreResult;
    const { score: responsiveMaintainerScore, latency: responsiveMaintainerLatency } = responsiveMaintainerScoreResult;
    const { score: busFactor, latency: busFactorLatency } = busFactorResult;
    const { score: correctness, latency: correctnessLatency } = correctnessResult;
    const netScore =
      0.3 * licenseScore + 0.1 * rampUpScore + 0.15 * responsiveMaintainerScore + 0.15 * busFactor + 0.3 * correctness;

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
        License_Latency: parseFloat(licenseLatency.toFixed(3))
      })
    );
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
      License_Latency: parseFloat(licenseLatency.toFixed(3))
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
