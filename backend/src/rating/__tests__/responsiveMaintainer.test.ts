/**
 * This file contains tests for the responsiveMaintainer metric.
 */
import { vi, describe, beforeEach, it, expect } from "vitest";
import * as graphqlClientModule from "../graphqlClient.js";
import { calculateResponsiveMaintainerScore } from "../metrics/responsiveMaintainer.js";
import { getLogger } from "../logger.js";

vi.mock("../graphqlClient.ts", async (importOriginal) => {
  const actual = await importOriginal<typeof graphqlClientModule>();
  return {
    ...actual,
    graphqlClient: {
      request: vi.fn()
    }
  };
});
vi.mock("../logger.ts", () => {
  return {
    getLogger: vi.fn().mockReturnValue({
      debug: vi.fn(),
      info: vi.fn()
    })
  };
});

describe("calculateResponsiveMaintainerScore", () => {
  const logger = getLogger();
  const mockDate = new Date("2022-01-01T00:00:00Z");
  const mockDatePlus5Days = new Date(mockDate);
  const mockDatePlus200Days = new Date(mockDate);
  mockDatePlus200Days.setDate(mockDate.getDate() + 200);
  mockDatePlus5Days.setDate(mockDate.getDate() + 5);
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should calculate a high score for fast response times and high closure rates", async () => {
    const mockGraphQLResponse = {
      repository: {
        issues: {
          edges: [
            {
              node: {
                createdAt: mockDate.toISOString(),
                closedAt: mockDatePlus5Days.toISOString()
              }
            },
            {
              node: {
                createdAt: mockDate.toISOString(),
                closedAt: mockDatePlus5Days.toISOString()
              }
            }
          ]
        },
        allIssues: {
          totalCount: 100
        },
        totalClosedIssues: {
          totalCount: 90
        }
      }
    };
    vi.mocked(graphqlClientModule.graphqlClient.request).mockResolvedValueOnce(mockGraphQLResponse);

    await calculateResponsiveMaintainerScore("repoOwner", "repoName");

    const expectedMedianResponseTime = 5;
    const expectedResponseTimeFactor = Math.min(1, 7 / expectedMedianResponseTime);
    const expectedTotalIssues = 100;
    const expectedClosedIssues = 90;
    const expectedClosureRate = expectedClosedIssues / expectedTotalIssues;
    const expectedScore = expectedResponseTimeFactor * expectedClosureRate;
    expect(logger.debug).toHaveBeenCalledWith(
      `Responsive maintainer score for repoOwner/repoName: ${expectedScore} with median response time: ${expectedMedianResponseTime} days, closure rate: ${expectedClosureRate}`
    );
  });

  it("should calculate a low score for long response times and low closure rates", async () => {
    const mockGraphQLResponse = {
      repository: {
        issues: {
          edges: [
            {
              node: {
                createdAt: mockDate.toISOString(),
                closedAt: mockDatePlus200Days.toISOString()
              }
            },
            {
              node: {
                createdAt: mockDate.toISOString(),
                closedAt: mockDatePlus200Days.toISOString()
              }
            },
            {
              node: {
                createdAt: mockDate.toISOString(),
                closedAt: mockDatePlus5Days.toISOString()
              }
            }
          ]
        },
        allIssues: {
          totalCount: 200
        },
        totalClosedIssues: {
          totalCount: 50
        }
      }
    };
    vi.mocked(graphqlClientModule.graphqlClient.request).mockResolvedValueOnce(mockGraphQLResponse);

    await calculateResponsiveMaintainerScore("repoOwner", "repoName");

    const expectedMedianResponseTime = 200;
    const expectedResponseTimeFactor = Math.min(1, 7 / expectedMedianResponseTime);
    const expectedTotalIssues = 200;
    const expectedClosedIssues = 50;
    const expectedClosureRate = expectedClosedIssues / expectedTotalIssues;
    const expectedScore = expectedResponseTimeFactor * expectedClosureRate;
    expect(logger.debug).toHaveBeenCalledWith(
      `Responsive maintainer score for repoOwner/repoName: ${expectedScore} with median response time: ${expectedMedianResponseTime} days, closure rate: ${expectedClosureRate}`
    );
  });

  it("should return a score 0.5 if there are no issues", async () => {
    const mockGraphQLResponse = {
      repository: {
        issues: {
          edges: []
        },
        allIssues: {
          totalCount: 0
        },
        totalClosedIssues: {
          totalCount: 0
        }
      }
    };
    vi.mocked(graphqlClientModule.graphqlClient.request).mockResolvedValueOnce(mockGraphQLResponse);

    const score = await calculateResponsiveMaintainerScore("repoOwner", "repoName");

    expect(score).toBe(0.5);
    expect(logger.debug).toHaveBeenCalledWith(
      "For repository repoOwner/repoName, no issues found, assigning score 0.5"
    );
  });

  it("should return a score of 0 if there is an error", async () => {
    vi.mocked(graphqlClientModule.graphqlClient.request).mockRejectedValueOnce(new Error("GraphQL Error"));

    const score = await calculateResponsiveMaintainerScore("repoOwner", "repoName");

    expect(score).toBe(0);
    expect(logger.info).toHaveBeenCalledWith(
      "Error calculating responsive maintainer score:",
      new Error("GraphQL Error")
    );
  });
});
