/**
 * This module calculates the correctness score of a repository
 */
import { ESLint } from "eslint";
import { getLogger } from "../logger";

const logger = getLogger();
/**
 * Calculate the correctness score of a repository
 * @param repoDir The directory of the repository
 * @param totalLines The total number of lines of code in the repository
 * @returns The correctness score of the repository
 **/
export async function calculateCorrectness(repoDir: string | null, totalLines: number): Promise<number> {
  console.log("start calculateCorrectness");
  if (!repoDir) {
    logger.info("Could not calculate correctness score: No repository directory provided");
    return 0;
  }
  const eslintScore = await calculateESLintScore(repoDir, totalLines);
  return eslintScore;
}

/**
 * Calculate the ESLint score of a repository. The score is based on the number of errors and warnings found by ESLint. Errors are weighted 5 times more than warnings.
 * @param repoDir The directory of the repository
 * @param totalLines The total number of lines of code in the repository
 * @returns The ESLint score of the repository
 */
async function calculateESLintScore(repoDir: string, totalLines: number): Promise<number> {
  try {
    const eslint = new ESLint({ ignore: false });
    const results = await eslint.lintFiles([`${repoDir}/**/*.{js,ts,tsx}`]);

    let totalErrors = 0;
    let totalWarnings = 0;
    for (const result of results) {
      totalErrors += result.errorCount;
      totalWarnings += result.warningCount;
    }

    if (totalLines === 0) {
      logger.debug(`No lines of code found in ${repoDir}`);
      return 0;
    }

    const eslintScore = Math.max(0, Math.min(1, 1 - (2 * totalErrors + totalWarnings) / totalLines));
    logger.debug(
      `ESLint errors: ${totalErrors}, warnings: ${totalWarnings}, total lines: ${totalLines}, final score: ${eslintScore} for ${repoDir}`
    );
    return eslintScore;
  } catch (error) {
    logger.info(`Failed to calculate ESLint score: ${error}`);
    return 0;
  }
}
