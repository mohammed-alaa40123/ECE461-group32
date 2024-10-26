/**
 * This file contains the GraphQL client and queries to fetch data from GitHub API.
 */
import axios from "axios";
import "dotenv/config";

// GraphQLClient class to handle GraphQL requests
export class GraphQLClient {
  private endpoint: string;
  private token: string;

  constructor() {
    this.endpoint = process.env.GITHUB_GRAPHQL_ENDPOINT || "https://api.github.com/graphql";
    this.token = process.env.GITHUB_TOKEN || "";
  }

  // Method to send a GraphQL request using axios
  public async request(query: string, variables?: Record<string, any>) {
    try {
      const response = await axios.post(
        this.endpoint,
        {
          query,
          variables,
        },
        {
          headers: {
            Authorization: `Bearer ${this.token}`,
            "Content-Type": "application/json",
          },
        }
      );
      return response.data.data;
    } catch (error) {
      console.error("GraphQL request failed:", error);
      throw error;
    }
  }
}

// Export instance for global usage if needed
export const graphqlClient = new GraphQLClient();

export const GET_VALUES_FOR_LICENSE = `
  query getLicenseInfo($repoOwner: String!, $repoName: String!) {
    repository(owner: $repoOwner, name: $repoName) {
      licenseInfo {
        key
        name
        spdxId
        url
      }
    }
  }
`;

export const GET_VALUES_FOR_RAMP_UP = `
  query getForksAndPRs($repoOwner: String!, $repoName: String!, $firstForks: Int!) {
    repository(owner: $repoOwner, name: $repoName) {
      forks(first: $firstForks) {
        edges {
          node {
            owner {
              login
            }
            createdAt
            pullRequests(first: 1) {
              nodes {
                createdAt
                author {
                  login
                }
              }
            }
            issues(first: 1) {
              nodes {
                createdAt
                author {
                  login
                }
              }
            }
            refs(refPrefix: "refs/heads/", first: 1) {
              nodes {
                target {
                  ... on Commit {
                    history(first: 1) {
                      edges {
                        node {
                          committedDate
                        }
                      }
                    }
                  }
                }
              }
            }
          }
        }
      }
      object(expression: "HEAD:README.md") {
        ... on Blob {
          id
        }
      }
      contributing: object(expression: "HEAD:CONTRIBUTING.md") {
        ... on Blob {
          id
        }
      }
    }
  }
`;

export const GET_VALUES_FOR_RESPONSIVE_MAINTAINER = `
  query getRepoData($repoOwner: String!, $repoName: String!, $firstIssues: Int!) {
    repository(owner: $repoOwner, name: $repoName) {
      issues(first: $firstIssues, states: CLOSED) {
        edges {
          node {
            createdAt
            closedAt
          }
        }
      }
      allIssues: issues {
        totalCount
      }
      totalClosedIssues: issues(states: CLOSED) {
        totalCount
      }
    }
  }
`;

export const GET_VALUES_FOR_BUS_FACTOR = `
  query getCommits($repoOwner: String!, $repoName: String!, $since: GitTimestamp!, $after: String) {
    repository(owner: $repoOwner, name: $repoName) {
      defaultBranchRef {
        target {
          ... on Commit {
            history(since: $since, first: 100, after: $after) {
              edges {
                node {
                  author {
                    user {
                      login
                    }
                  }
                  committedDate
                }
              }
              pageInfo {
                endCursor
                hasNextPage
              }
            }
          }
        }
      }
    }
  }
`;

export const GET_VALUES_FOR_CODE_REVIEW_METRIC = `
  query GetPullRequests($repoOwner: String!, $repoName: String!, $after: String) {
    repository(owner: $repoOwner, name: $repoName) {
      pullRequests(first: 100, after: $after) {
        edges {
          node {
            additions  # Total lines of code added in the pull request
            reviews {
              totalCount  # Number of reviews for the pull request
            }
          }
        }
        pageInfo {
          endCursor  # Cursor for pagination
          hasNextPage  # Boolean to check if more pages are available
        }
      }
    }
  }
`;

