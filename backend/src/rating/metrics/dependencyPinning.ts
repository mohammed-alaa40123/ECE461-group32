import axios from 'axios';
import * as semver from 'semver';
import * as dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

// Define types for clarity
interface PackageJSON {
  dependencies?: { [key: string]: string };
  devDependencies?: { [key: string]: string };
}

interface RepoInfo {
  owner: string;
  name: string;
}

interface RepositoryResponse {
  repository: {
    defaultBranchRef: {
      name: string;
    };
    object: {
      text: string;
    } | null;
  } | null;
}

// Function to check if a version string is pinned
function isPinned(version: string): boolean {
  // A pinned version should be a valid exact semver
  return semver.valid(version) !== null;
}

/**
 * Fetches the default branch name of a repository using GitHub's GraphQL API.
 * 
 * @param repo - Information about the repository.
 * @returns The name of the default branch or null if not found.
 */
async function fetchDefaultBranch(repo: RepoInfo): Promise<string | null> {
  const { owner, name } = repo;

  const query = `
    query($owner: String!, $name: String!) {
      repository(owner: $owner, name: $name) {
        defaultBranchRef {
          name
        }
      }
    }
  `;

  const variables = {
    owner,
    name,
  };

  const url = 'https://api.github.com/graphql';
  const token = process.env.GITHUB_TOKEN;

  if (!token) {
    console.error('Error: GITHUB_TOKEN is not set in environment variables.');
    return null;
  }

  try {
    const response = await axios.post(
      url,
      {
        query,
        variables,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Check for GraphQL errors
    if (response.data.errors) {
      console.error(`GraphQL Errors for ${owner}/${name}:`, JSON.stringify(response.data.errors, null, 2));
      return null;
    }

    const repository = response.data.data.repository;
    if (!repository || !repository.defaultBranchRef) {
      console.error(`Default branch not found for ${owner}/${name}.`);
      return null;
    }

    return repository.defaultBranchRef.name;
  } catch (error: any) {
    if (error.response) {
      console.error(`HTTP Error fetching default branch for ${owner}/${name}:`, error.response.status, error.response.statusText);
      console.error('Response data:', error.response.data);
    } else {
      console.error(`Error fetching default branch for ${owner}/${name}:`, error.message);
    }
    return null;
  }
}

/**
 * Fetches the package.json content from a repository's default branch using GitHub's GraphQL API.
 * 
 * @param repo - Information about the repository.
 * @param branch - The default branch name.
 * @returns The parsed package.json content or null if not found.
 */
async function fetchPackageJSON(repo: RepoInfo, branch: string): Promise<PackageJSON | null> {
  const { owner, name } = repo;

  const query = `
    query($owner: String!, $name: String!, $expression: String!) {
      repository(owner: $owner, name: $name) {
        object(expression: $expression) {
          ... on Blob {
            text
          }
        }
      }
    }
  `;

  const variables = {
    owner,
    name,
    expression: `${branch}:package.json`,
  };

  const url = 'https://api.github.com/graphql';
  const token = process.env.GITHUB_TOKEN;

  try {
    const response = await axios.post(
      url,
      {
        query,
        variables,
      },
      {
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
      }
    );

    // Check for GraphQL errors
    if (response.data.errors) {
      console.error(`GraphQL Errors for ${owner}/${name}:`, JSON.stringify(response.data.errors, null, 2));
      return null;
    }

    const obj = response.data.data.repository.object;
    if (!obj || !obj.text) {
      console.error(`No package.json found for ${owner}/${name} in branch ${branch}.`);
      return null;
    }

    return JSON.parse(obj.text) as PackageJSON;
  } catch (error: any) {
    if (error.response) {
      console.error(`HTTP Error fetching package.json for ${owner}/${name}:`, error.response.status, error.response.statusText);
      console.error('Response data:', error.response.data);
    } else {
      console.error(`Error fetching package.json for ${owner}/${name}:`, error.message);
    }
    return null;
  }
}

/**
 * Calculates the Dependency Pinning Fraction Metric.
 * 
 * @param pkg - The package.json content.
 * @returns The percentage of dependencies that are pinned.
 */
function calculatePinningFraction(pkg: PackageJSON): number {
  const allDeps = {
    ...pkg.dependencies,
    ...pkg.devDependencies,
  };

  const total = Object.keys(allDeps).length;
  if (total === 0) return 0;

  const pinned = Object.values(allDeps).filter(isPinned).length;

  return (pinned / total) * 100;
}

/**
 * Processes a single repository to calculate and display the Dependency Pinning Fraction.
 * 
 * @param repo - Information about the repository.
 */
async function processRepository(repo: RepoInfo): Promise<void> {
  const defaultBranch = await fetchDefaultBranch(repo);
  if (!defaultBranch) {
    console.log(`${repo.owner}/${repo.name}: Unable to determine the default branch.`);
    return;
  }

  const pkg = await fetchPackageJSON(repo, defaultBranch);
  if (pkg) {
    const fraction = calculatePinningFraction(pkg);
    console.log(
      `${repo.owner}/${repo.name}: ${fraction.toFixed(2)}% of dependencies are pinned.`
    );
  } else {
    console.log(`${repo.owner}/${repo.name}: Unable to fetch package.json.`);
  }
}

/**
 * Main function to process multiple repositories.
 */
async function main() {
  // Example repository list; modify this as needed
  const repositories: RepoInfo[] = [
    { owner: 'octocat', name: 'Hello-World' },
    { owner: 'facebook', name: 'react' },
    { owner: 'lodash', name: 'lodash' },
    // Add more repositories here
  ];

  // Limit the number of concurrent requests to avoid hitting rate limits
  const CONCURRENT_REQUESTS = 5;
  let index = 0;

  async function runNext() {
    if (index >= repositories.length) return;
    const repo = repositories[index++];
    await processRepository(repo);
    await runNext();
  }

  const workers = Array.from({ length: CONCURRENT_REQUESTS }, runNext);
  await Promise.all(workers);
}

main().catch((error) => {
  console.error('An unexpected error occurred:', error);
  process.exit(1);
});
