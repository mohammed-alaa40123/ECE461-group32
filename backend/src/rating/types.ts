/**
 * This file contains all the types used in the application.
 */
export type returnRepo = {
  owner: string;
  packageName: string;
} | null;

export type LicenseReponse = {
  repository: {
    licenseInfo: {
      key: string;
      name: string;
      spdxId: string;
      url: string;
    };
  };
};

export type RampUpResponse = {
  repository: {
    forks: {
      edges: {
        node: {
          owner: {
            login: string;
          };
          createdAt: string;
          pullRequests: {
            nodes: {
              createdAt: string;
              author: {
                login: string;
              };
            }[];
          };
          issues: {
            nodes: {
              createdAt: string;
              author: {
                login: string;
              };
            }[];
          };
          refs: {
            nodes: {
              target: {
                history: {
                  edges: {
                    node: {
                      committedDate: string;
                    };
                  }[];
                };
              };
            }[];
          };
        };
      }[];
    };
    object: {
      id?: string;
    } | null;
    contributing: {
      id?: string;
    } | null;
  };
};

export type ResponsiveMaintainerResponse = {
  repository: {
    issues: {
      edges: {
        node: {
          createdAt: string;
          closedAt: string;
        };
      }[];
    };
    allIssues: {
      totalCount: number;
    };
    totalClosedIssues: {
      totalCount: number;
    };
  };
};

export type BusFactorResponse = {
  repository: {
    defaultBranchRef: {
      target: {
        history: {
          edges: {
            node: {
              author: {
                user: {
                  login: string;
                } | null;
              };
              committedDate: string;
            };
          }[];
          pageInfo: {
            endCursor: string | null;
            hasNextPage: boolean;
          };
        };
      };
    };
  };
};

export type CodeReviewResponse = {
  repository: {
    pullRequests: {
      edges: {
        node: {
          additions: number;  // Total lines of code added in the pull request
          reviews: {
            totalCount: number;  // Number of reviews for the pull request
          };
        };
      }[];
      pageInfo: {
        endCursor: string | null;  // Cursor for pagination
        hasNextPage: boolean;  // Flag to indicate if more pages are available
      };
    };
  };
};

