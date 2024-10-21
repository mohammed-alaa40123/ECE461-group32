/**
 * Calculate the responsive maintainer score of a repository
 */
import { graphqlClient, GET_VALUES_FOR_RESPONSIVE_MAINTAINER } from "../graphqlClient";
import { ResponsiveMaintainerResponse } from "../types";
import { differenceInDays } from "date-fns";
import { getLogger } from "../logger";

const logger = getLogger();

/**
 * Calculate the responsive maintainer score of a repository. The score is based on the median response time of issues and the closure rate of issues.
 * @param repoOwner The owner of the repository
 * @param repoName The name of the repository
 * @returns The responsive maintainer score of the repository
 */
export async function calculateResponsiveMaintainerScore(repoOwner: string, repoName: string): Promise<number> {
  try {
    const data: ResponsiveMaintainerResponse = await graphqlClient.request(GET_VALUES_FOR_RESPONSIVE_MAINTAINER, {
      repoOwner,
      repoName,
      firstIssues: 100
    });

    const medianResponseTime = calculateMedianResponseTime(data.repository.issues.edges);
    if (medianResponseTime === -1) {
      logger.debug(`For repository ${repoOwner}/${repoName}, no issues found, assigning score 0.5`);
      return 0.5;
    }

    const responseTimeFactor = medianResponseTime == 0 ? 1 : Math.min(1, 7 / medianResponseTime);

    const totalIssues = data.repository.allIssues.totalCount;
    const closedIssues = data.repository.totalClosedIssues.totalCount;
    const closureRate = closedIssues / totalIssues;

    const score = responseTimeFactor * closureRate;

    logger.debug(
      `Responsive maintainer score for ${repoOwner}/${repoName}: ${score} with median response time: ${medianResponseTime} days, closure rate: ${closureRate}`
    );
    return score;
  } catch (error) {
    logger.info("Error calculating responsive maintainer score:", error);
    return 0;
  }
}

/**
 * Calculate the median response time of issues in a repository
 * @param issues The issues in the repository
 * @returns The median response time of the issues
 */
function calculateMedianResponseTime(issues: { node: { createdAt: string; closedAt: string } }[]): number {
  if (issues.length === 0) {
    return -1;
  }

  const responseTimes = issues.map((issue) => {
    const createdAt = new Date(issue.node.createdAt);
    const closedAt = new Date(issue.node.closedAt);
    return differenceInDays(closedAt, createdAt);
  });

  responseTimes.sort((a, b) => a - b);
  const mid = Math.floor(responseTimes.length / 2);

  return responseTimes.length % 2 !== 0
    ? responseTimes[Number(mid)]
    : (responseTimes[mid - 1] + responseTimes[Number(mid)]) / 2;
}
