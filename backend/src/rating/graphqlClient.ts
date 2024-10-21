/**
 * This file contains the GraphQL client and queries to fetch data from GitHub API.
 */
import { GraphQLClient, gql } from "graphql-request";
import "dotenv/config";

const endpoint = "https://api.github.com/graphql";

export const graphqlClient = new GraphQLClient(endpoint, {
  headers: {
    Authorization: `Bearer ${process.env.GITHUB_TOKEN}`
  }
});

export const GET_VALUES_FOR_LICENSE = gql`
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

export const GET_VALUES_FOR_RAMP_UP = gql`
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

export const GET_VALUES_FOR_RESPONSIVE_MAINTAINER = gql`
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

export const GET_VALUES_FOR_BUS_FACTOR = gql`
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
