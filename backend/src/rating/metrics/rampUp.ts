/**
 * Calculate the rampUp score of a repository
 */
import { graphqlClient, GET_VALUES_FOR_RAMP_UP } from "../graphqlClient.js";
import { RampUpResponse } from "../types.js";
import { differenceInDays } from "date-fns";
import { getLogger } from "../logger.js";

const logger = getLogger();

/**
 * Calculate the rampUp score of a repository. The score is based on the average days to first activity and the presence of a README and CONTRIBUTING file.
 * @param repoOwner The owner of the repository
 * @param repoName The name of the repository
 * @param repoDir The directory of the repository
 * @param loc The lines of code in the repository
 * @param firstForks The number of forks to fetch
 * @returns The rampUp score of the repository
 */
export async function calculateRampUpScore(
  repoOwner: string,
  repoName: string,
  repoDir: string | null,
  loc: number,
  firstForks = 50
): Promise<number> {
  try {
    const data: RampUpResponse = await graphqlClient.request(GET_VALUES_FOR_RAMP_UP, {
      repoOwner,
      repoName,
      firstForks
    });
    const averageDays = await calculateAverageDaysToFirstActivity(data);
    const documentationWeight = await calculateDocumentationWeight(data, repoOwner, repoName);
    const targetTime = repoDir ? await calculateTargetTime(repoDir, loc) : 21;
    const constant = targetTime / Math.log(1.05);
    const averageTimeValue = Math.max(Math.exp(-(averageDays - targetTime) / constant), 0.3);
    const score = Math.min(1, averageTimeValue * documentationWeight);
    logger.debug(
      `Parts of the Ramp Up score: Main part: ${averageTimeValue}, Constant: ${constant}, Documentation Weight: ${documentationWeight}, Target Time: ${targetTime}`
    );
    logger.debug(`Ramp Up score for ${repoOwner}/${repoName}: ${score}`);
    return score;
  } catch (error) {
    logger.info("Error fetching forks and PRs:", error);
    return 0;
  }
}

/**
 * Calculate the average days to first activity of a repository. The activity is defined as the first commit, pull request, or issue.
 * @param data The data from the GraphQL query
 * @returns The average days to first activity of the repository
 */
async function calculateAverageDaysToFirstActivity(data: RampUpResponse): Promise<number> {
  let totalDays = 0;
  let forksWithActivity = 0;

  data.repository.forks.edges.forEach(({ node: fork }) => {
    const forkCreatedAt = new Date(fork.createdAt);
    const firstPRDate = fork.pullRequests.nodes.length > 0 ? new Date(fork.pullRequests.nodes[0].createdAt) : null;
    const firstIssueDate = fork.issues.nodes.length > 0 ? new Date(fork.issues.nodes[0].createdAt) : null;
    const firstCommitDate =
      fork.refs.nodes.length > 0 ? new Date(fork.refs.nodes[0].target.history.edges[0].node.committedDate) : null;
    const validActivityDates = [firstCommitDate, firstPRDate, firstIssueDate].filter(
      (date) => date && date >= forkCreatedAt
    );
    const firstActivityDate = validActivityDates
      .filter(Boolean)
      .reduce((earliest, current) => (current && (!earliest || current < earliest) ? current : earliest), null);
    if (firstActivityDate) {
      const daysBetween = differenceInDays(firstActivityDate, forkCreatedAt);
      totalDays += daysBetween;
      forksWithActivity++;
    }
  });
  logger.debug(`Total days: ${totalDays}, Forks with activity: ${forksWithActivity}`);

  return forksWithActivity > 0 ? totalDays / forksWithActivity : 0;
}

/**
 * Calculate the documentation weight of a repository. The weight is based on the presence of a README and CONTRIBUTING file.
 * @param data The data from the GraphQL query
 * @param repoOwner The owner of the repository
 * @param repoName The name of the repository
 * @returns The documentation weight of the repository
 */
async function calculateDocumentationWeight(
  data: RampUpResponse,
  repoOwner: string,
  repoName: string
): Promise<number> {
  const readme = data.repository.object;
  const contributing = data.repository.contributing;
  if (readme && contributing) {
    logger.debug(`Found README and CONTRIBUTING for repo ${repoOwner}/${repoName}`);
    return 1;
  } else if (readme || contributing) {
    logger.debug(`Found README or CONTRIBUTING for repo ${repoOwner}/${repoName}`);
    return 0.9;
  } else {
    logger.debug(`No README or CONTRIBUTING found for repo ${repoOwner}/${repoName}`);
    return 0.8;
  }
}

/**
 * Calculate the target time for a repository.
 * @param repoDir The directory of the repository
 * @param loc The lines of code in the repository
 * @returns The target time for the repository
 */
async function calculateTargetTime(repoDir: string, loc: number): Promise<number> {
  try {
    logger.debug(`Lines of code: ${loc}`);

    if (loc <= 5000) {
      return 7;
    } else if (loc <= 10000) {
      return 10;
    } else if (loc <= 50000) {
      return 14;
    } else if (loc <= 100000) {
      return 21;
    } else if (loc <= 500000) {
      return 30;
    } else if (loc <= 1000000) {
      return 45;
    } else {
      return 60;
    }
  } catch (error) {
    logger.info("Error calculating target time:", error);
  }
  return 21;
}
