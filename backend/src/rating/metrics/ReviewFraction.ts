import { graphqlClient, GET_VALUES_FOR_CODE_REVIEW_METRIC } from "../graphqlClient";
import { CodeReviewResponse } from "../types";
import { getLogger } from "../logger";

const logger = getLogger();

async function fetchPullRequests(repoOwner: string, repoName: string, cursor: string | null = null): Promise<CodeReviewResponse> {
  return await graphqlClient.request(GET_VALUES_FOR_CODE_REVIEW_METRIC, {
    repoOwner,
    repoName,
    after: cursor, // Pagination cursor
  });
}

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
    let cursor: string | null = null;
    let hasNextPage = true;

    // Fetch pull requests with pagination
    while (hasNextPage) {
      const data: CodeReviewResponse = await fetchPullRequests(repoOwner, repoName, cursor);

      const pullRequests = data.repository.pullRequests;
      pullRequests.edges.forEach(({ node }) => {
        totalCodeAdditions += node.additions;
        if (node.reviews.totalCount > 0) {
          reviewedCodeAdditions += node.additions;
        }
      });

      // Check for more pages
      hasNextPage = pullRequests.pageInfo.hasNextPage;
      cursor = pullRequests.pageInfo.endCursor;

      // Optional: Implement a delay to avoid rate limit
      await new Promise(resolve => setTimeout(resolve, 1000)); // Wait 1 second between requests
    }

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
