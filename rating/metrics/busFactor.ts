/**
 * Calculate the bus factor score of a repository
 */
import { graphqlClient, GET_VALUES_FOR_BUS_FACTOR } from "../graphqlClient.js";
import { BusFactorResponse } from "../types.js";
import { getLogger } from "../logger.js";

const logger = getLogger();

/**
 * Calculate the bus factor score of a repository
 * @param repoOwner The owner of the repository
 * @param repoName The name of the repository
 * @returns The bus factor score of the repository
 */
export async function calculateBusFactorScore(repoOwner: string, repoName: string): Promise<number> {
  try {
    // filter commits since last 30 months aka 2.5 years
    const since = new Date(new Date().setMonth(new Date().getMonth() - 30)).toISOString();
    let hasNextPage = true;
    let cursor = null;
    const commitData = new Map<string, number>();

    // Fetch all commits
    while (hasNextPage) {
      const data: BusFactorResponse = await graphqlClient.request(GET_VALUES_FOR_BUS_FACTOR, {
        repoOwner,
        repoName,
        since,
        after: cursor
      });

      const history = data.repository.defaultBranchRef.target.history;

      // Count commits per contributor
      history.edges.forEach(({ node }) => {
        const login = node.author.user?.login;
        if (login) {
          commitData.set(login, (commitData.get(login) || 0) + 1);
        }
      });

      // Pagination handling
      cursor = history.pageInfo.endCursor;
      hasNextPage = history.pageInfo.hasNextPage;
    }

    // Calculate the score using the 90th percentile
    const score = calculateBusFactor90thPercentile(commitData);

    logger.debug(`Bus factor score for ${repoOwner}/${repoName}: ${score}`);
    return score;
  } catch (error) {
    logger.info("Error calculating bus factor score:", error);
    return 0;
  }
}

/**
 * Calculate the bus factor score based on the 90th percentile of commit data
 * For each additonal abovethreshold contributor, the score increases by 0.05
 * Capped at 1, min 0
 * @param commitData A map of contributor logins to their commit counts
 * @returns The bus factor score
 */
function calculateBusFactor90thPercentile(commitData: Map<string, number>): number {
  const commitCounts = Array.from(commitData.values());
  commitCounts.sort((a, b) => a - b);

  const totalContributors = commitCounts.length;
  if (totalContributors === 0) return 0;

  // Determine the 90th percentile index
  const percentileIndex = Math.floor(0.9 * totalContributors);
  const threshold = commitCounts[Number(percentileIndex)];

  // Count contributors above the 90th percentile threshold
  const aboveThresholdContributors = commitCounts.filter((count) => count >= threshold).length;
  const score = Math.min(1, Math.max(Math.round(aboveThresholdContributors * 0.05 * 100) / 100, 0));
  return score;
}
