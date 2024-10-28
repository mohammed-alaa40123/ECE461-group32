import { graphqlClient, GET_VALUES_FOR_CODE_REVIEW_METRIC } from "../graphqlClient";
import { CodeReviewResponse } from "../types";
import { getLogger } from "../logger";

const logger = getLogger();

/**
 * Calculate the code review fraction metric for a repository
 * @param repoOwner The owner of the repository
 * @param repoName The name of the repository
 * @returns The code review fraction metric of the repository
 */
export async function calculateCodeReviewFractionMetric(repoOwner: string, repoName: string): Promise<number> {
  try {
    let totalCodeAdditions = 0;
    let reviewedCodeAdditions = 0;

    // Fetch all pull requests
      const data: CodeReviewResponse = await graphqlClient.request(GET_VALUES_FOR_CODE_REVIEW_METRIC, {
        repoOwner,
        repoName,
      });

      const pullRequests = data.repository.pullRequests;

      // Count code additions for total and reviewed pull requests
      pullRequests.edges.forEach(({ node }) => {
        totalCodeAdditions += node.additions;
        if (node.reviews.totalCount > 0) {  // if there are reviews, consider it reviewed
          reviewedCodeAdditions += node.additions;
        }
      });

      // Pagination handling
      

    // Avoid division by zero
    if (totalCodeAdditions === 0) {
      return 0;
    }

    // Calculate the code review fraction metric
    const metric = reviewedCodeAdditions / totalCodeAdditions;

    logger.debug(`Code Review Fraction Metric for ${repoOwner}/${repoName}: ${metric}`);
    return metric;
  } catch (error) {
    logger.info("Error calculating code review fraction metric:", error);
    return 0;
  }
}
