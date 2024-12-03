/**
 * This file contains tests for the bus factor metric.
 */
import { describe, it, vi, expect, beforeEach } from "vitest";
import { calculateBusFactorScore } from "../metrics/busFactor.js";
import * as graphqlClientModule from "../graphqlClient.js";

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

describe("calculateBusFactorScore", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should fail and return 0 if invalid repository", async () => {
    const score = await calculateBusFactorScore("", "");
    expect(score).toEqual(0);
  });

  it("should return a low bus factor score when no authors", async () => {
    const mockGraphQLResponse = {
      repository: {
        defaultBranchRef: {
          target: {
            history: {
              edges: [],
              pageInfo: { endCursor: null, hasNextPage: false }
            }
          }
        }
      }
    };

    vi.mocked(graphqlClientModule.graphqlClient.request).mockResolvedValue(mockGraphQLResponse);
    const score = await calculateBusFactorScore("owner", "repo");
    expect(score).toEqual(0);
  });

  it("should return a low bus factor score", async () => {
    const mockGraphQLResponse = {
      repository: {
        defaultBranchRef: {
          target: {
            history: {
              edges: [
                {
                  node: {
                    author: { user: { login: "user1" } },
                    committedDate: "2023-01-01T00:00:00Z"
                  }
                }
              ],
              pageInfo: { endCursor: null, hasNextPage: false }
            }
          }
        }
      }
    };

    vi.mocked(graphqlClientModule.graphqlClient.request).mockResolvedValue(mockGraphQLResponse);
    const score = await calculateBusFactorScore("owner", "repo");
    expect(score).toEqual(0.05);
  });

  it("should return a medium bus factor score", async () => {
    const mockGraphQLResponse = {
      repository: {
        defaultBranchRef: {
          target: {
            history: {
              edges: [
                {
                  node: {
                    author: { user: { login: "user1" } },
                    committedDate: "2023-01-01T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user2" } },
                    committedDate: "2023-01-01T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user3" } },
                    committedDate: "2023-01-01T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user4" } },
                    committedDate: "2023-01-01T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user5" } },
                    committedDate: "2023-01-01T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user6" } },
                    committedDate: "2023-01-01T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user7" } },
                    committedDate: "2023-01-01T00:00:00Z"
                  }
                }
              ],
              pageInfo: { endCursor: null, hasNextPage: false }
            }
          }
        }
      }
    };

    vi.mocked(graphqlClientModule.graphqlClient.request).mockResolvedValue(mockGraphQLResponse);
    const score = await calculateBusFactorScore("owner", "repo");
    expect(score).toEqual(0.35);
  });

  it("should return a high bus factor score", async () => {
    const mockGraphQLResponse = {
      repository: {
        defaultBranchRef: {
          target: {
            history: {
              edges: [
                {
                  node: {
                    author: { user: { login: "user1" } },
                    committedDate: "2023-01-01T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user2" } },
                    committedDate: "2023-01-02T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user3" } },
                    committedDate: "2023-01-03T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user4" } },
                    committedDate: "2023-01-03T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user5" } },
                    committedDate: "2023-01-03T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user6" } },
                    committedDate: "2023-01-03T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user7" } },
                    committedDate: "2023-01-03T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user8" } },
                    committedDate: "2023-01-03T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user9" } },
                    committedDate: "2023-01-03T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user10" } },
                    committedDate: "2023-01-03T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user11" } },
                    committedDate: "2023-01-03T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user12" } },
                    committedDate: "2023-01-03T00:00:00Z"
                  }
                },
                {
                  node: {
                    author: { user: { login: "user13" } },
                    committedDate: "2023-01-03T00:00:00Z"
                  }
                }
              ],
              pageInfo: { endCursor: null, hasNextPage: false }
            }
          }
        }
      }
    };

    vi.mocked(graphqlClientModule.graphqlClient.request).mockResolvedValue(mockGraphQLResponse);
    const score = await calculateBusFactorScore("facebook", "react");
    expect(score).toEqual(0.65);
  });
});
