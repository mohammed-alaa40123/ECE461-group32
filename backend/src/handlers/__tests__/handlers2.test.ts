// handlers.test.ts
import { describe, it, expect, beforeEach, vi, Mock } from 'vitest';
import {
  handleDeletePackage,
  handleListPackages,
  handleResetRegistry,
  handleGetPackageHistoryByName,
  handleSearchPackagesByRegEx,
  handleGetPackageRating,
  handleGetPackageCost,
  handleGetTracks,
} from '../handlers'; // Ensure this path is correct based on your project structure
import { authenticate } from '../../utils/auth';
import { sendResponse } from '../../utils/response';
import pool from '../../services/dbService';
import {
  deletePackageContent,
  uploadPackageContent,
  getPackageContent,
} from '../../services/s3Service';
import {
  metricCalcFromUrlUsingNetScore,
  generatePackageId,
  fetchRepoDetails,
} from '../../handlerhelper';
import fetch from 'node-fetch';
import bcrypt from 'bcrypt';

// Mock dependencies with factory functions
vi.mock('../../utils/auth', () => ({
  authenticate: vi.fn(),
}));

vi.mock('../../utils/response', () => ({
  sendResponse: vi.fn(),
}));

vi.mock('../../services/dbService', () => ({
  default: {
    query: vi.fn(),
  },
}));

vi.mock('../../services/s3Service', () => ({
  deletePackageContent: vi.fn(),
  uploadPackageContent: vi.fn(),
  getPackageContent: vi.fn(),
}));

vi.mock('../../handlerhelper', () => ({
  metricCalcFromUrlUsingNetScore: vi.fn(),
  generatePackageId: vi.fn(),
  fetchRepoDetails: vi.fn(),
}));

vi.mock('node-fetch', () => ({
  default: vi.fn(),
}));

vi.mock('bcrypt', () => ({
    default: {
      hash: vi.fn(),
      compare: vi.fn(),
      // Add other methods as needed
    },
  }));
  

// Get references to mocked functions
const mockedAuthenticate = authenticate as Mock;
const mockedSendResponse = sendResponse as Mock;
const mockedPoolQuery = pool.query as Mock;
const mockedDeletePackageContent = deletePackageContent as Mock;
const mockedMetricCalc = metricCalcFromUrlUsingNetScore as Mock;
const mockedFetchRepoDetails = fetchRepoDetails as Mock;
const mockedFetch = fetch as Mock;
const mockedBcryptHash = bcrypt.hash as unknown as any;

describe('Handlers', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock sendResponse to return the response object
    mockedSendResponse.mockImplementation((statusCode: number, body: any) => ({
      statusCode,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  describe('handleDeletePackage', () => {
    it('should delete a package successfully', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1, permissions: ['upload'] });
      mockedPoolQuery.mockResolvedValueOnce({}); // For historyInsert
      mockedDeletePackageContent.mockResolvedValueOnce();

      const response = await handleDeletePackage('package-id', {});

      expect(mockedAuthenticate).toHaveBeenCalled();
      expect(mockedPoolQuery).toHaveBeenCalledWith(
        expect.any(String),
        ['package-id', 1, 'DELETE']
      );
      expect(mockedDeletePackageContent).toHaveBeenCalledWith('package-id');
      expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({ message: 'Package is deleted.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should return 403 if user lacks permissions', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1, permissions: [] });

      const response = await handleDeletePackage('package-id', {});

      expect(response).toEqual({
        statusCode: 403,
        body: JSON.stringify({
          message: 'You do not have permission to upload/delete packages.',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle authentication errors', async () => {
      mockedAuthenticate.mockRejectedValue({ statusCode: 401, message: 'Unauthorized' });

      const response = await handleDeletePackage('package-id', {});

      expect(response).toEqual({
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle internal server errors', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1, permissions: ['upload'] });
      mockedPoolQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await handleDeletePackage('package-id', {});

      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal server error.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('handleListPackages', () => {
    it('should list packages successfully', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1, permissions: ['search'] });
      const body = JSON.stringify([
        { Name: 'test-package', Version: 'Exact (1.0.0)' },
      ]);
      const queryStringParameters = { offset: '0' };
      mockedPoolQuery.mockResolvedValueOnce({
        rows: [{ version: '1.0.0', name: 'test-package', id: 'package-id' }],
      });

      const response = await handleListPackages(body, {}, queryStringParameters);

      expect(mockedAuthenticate).toHaveBeenCalled();
      expect(mockedPoolQuery).toHaveBeenCalled();
      expect(response.statusCode).toBe(200);
      expect(JSON.parse(response.body)).toEqual([
        { version: '1.0.0', name: 'test-package', id: 'package-id' },
      ]);
    });

    it('should return 400 for invalid JSON', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1, permissions: ['search'] });
      const body = 'Invalid JSON';

      const response = await handleListPackages(body, {}, {});

      expect(response).toEqual({
        statusCode: 400,
        body: JSON.stringify({ message: 'Invalid JSON format in request body.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle authentication errors', async () => {
      mockedAuthenticate.mockRejectedValue({ statusCode: 401, message: 'Unauthorized' });

      const response = await handleListPackages('[]', {}, {});

      expect(response).toEqual({
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle internal server errors', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1, permissions: ['search'] });
      mockedPoolQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await handleListPackages('[]', {}, {});

      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal server error.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('handleResetRegistry', () => {
    it('should reset the registry successfully', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPoolQuery.mockResolvedValue({}); // For all pool.query calls

      const response = await handleResetRegistry({});

      expect(mockedAuthenticate).toHaveBeenCalled();
      expect(mockedPoolQuery).toHaveBeenCalledTimes(9); // BEGIN, TRUNCATE x7, COMMIT
      expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({
          message: 'Registry is reset, only the default admin user is retained.',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should return 403 if user is not admin', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });

      const response = await handleResetRegistry({});

      expect(response).toEqual({
        statusCode: 403,
        body: JSON.stringify({ message: 'Admin privileges required.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle authentication errors', async () => {
      mockedAuthenticate.mockRejectedValue({ statusCode: 401, message: 'Unauthorized' });

      const response = await handleResetRegistry({});

      expect(response).toEqual({
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle errors during reset', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPoolQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await handleResetRegistry({});

      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal server error.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('handleGetPackageHistoryByName', () => {
    it('should return package history successfully', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1, permissions: ['search'] });
      const historyRows = [
        {
          user_name: 'user1',
          is_admin: false,
          date: new Date('2023-01-01'),
          package_id: 'package-id',
          name: 'test-package',
          version: '1.0.0',
          action: 'CREATE',
        },
      ];
      mockedPoolQuery.mockResolvedValueOnce({ rows: historyRows });

      const response = await handleGetPackageHistoryByName('test-package', {});

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual([
        {
          User: { name: 'user1', isAdmin: false },
          Date: '2023-01-01T00:00:00.000Z',
          PackageMetadata: {
            Name: 'test-package',
            Version: '1.0.0',
            ID: 'package-id',
          },
          Action: 'CREATE',
        },
      ]);
    });

    it('should return 404 if no package history found', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1, permissions: ['search'] });
      mockedPoolQuery.mockResolvedValueOnce({ rows: [] });

      const response = await handleGetPackageHistoryByName('non-existent-package', {});

      expect(response).toEqual({
        statusCode: 404,
        body: JSON.stringify({ message: 'No such package.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle authentication errors', async () => {
      mockedAuthenticate.mockRejectedValue({ statusCode: 401, message: 'Unauthorized' });

      const response = await handleGetPackageHistoryByName('test-package', {});

      expect(response).toEqual({
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle internal server errors', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1, permissions: ['search'] });
      mockedPoolQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await handleGetPackageHistoryByName('test-package', {});

      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal server error.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('handleSearchPackagesByRegEx', () => {
    it('should return packages matching regex', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1, permissions: ['search'] });
      const body = JSON.stringify({ RegEx: '^test' });
      mockedPoolQuery.mockResolvedValueOnce({
        rows: [
          { version: '1.0.0', name: 'test-package', id: 'package-id' },
        ],
      });

      const response = await handleSearchPackagesByRegEx(body, {});

      expect(response.statusCode).toBe(200);
      const bodyParsed = JSON.parse(response.body);
      expect(bodyParsed).toEqual([
        {
          Version: '1.0.0',
          Name: 'test-package',
          ID: 'package-id',
        },
      ]);
    });

    it('should return 404 if no packages found', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1, permissions: ['search'] });
      const body = JSON.stringify({ RegEx: '^nonexistent' });
      mockedPoolQuery.mockResolvedValueOnce({ rows: [] });

      const response = await handleSearchPackagesByRegEx(body, {});

      expect(response).toEqual({
        statusCode: 404,
        body: JSON.stringify({ message: 'No package found under this regex.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should return 400 if RegEx is missing', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1, permissions: ['search'] });
      const body = JSON.stringify({});

      const response = await handleSearchPackagesByRegEx(body, {});

      expect(response).toEqual({
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing RegEx field in PackageRegEx.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle authentication errors', async () => {
      mockedAuthenticate.mockRejectedValue({ statusCode: 401, message: 'Unauthorized' });
      const body = JSON.stringify({ RegEx: '^test' });

      const response = await handleSearchPackagesByRegEx(body, {});

      expect(response).toEqual({
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle internal server errors', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1, permissions: ['search'] });
      mockedPoolQuery.mockRejectedValueOnce(new Error('Database error'));
      const body = JSON.stringify({ RegEx: '^test' });

      const response = await handleSearchPackagesByRegEx(body, {});

      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal server error.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('handleGetPackageRating', () => {
    it('should return package rating successfully', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1 });
      mockedPoolQuery.mockResolvedValueOnce({ rows: [{ url: 'https://github.com/owner/repo' }] });
      const mockRating = {
        ID: 'package-id',
        NET_SCORE: 0.8,
        BUS_FACTOR_SCORE: 0.7,
        CORRECTNESS_SCORE: 0.9,
        RAMP_UP_SCORE: 0.6,
        RESPONSIVE_MAINTAINER_SCORE: 0.8,
        LICENSE_SCORE: 1.0,
        PINNED_DEPENDENCIES_SCORE: 0.5,
        PULL_REQUESTS_SCORE: 0.9,
        NET_SCORE_LATENCY: 100,
        BUS_FACTOR_SCORE_LATENCY: 50,
        CORRECTNESS_SCORE_LATENCY: 60,
        RAMP_UP_SCORE_LATENCY: 70,
        RESPONSIVE_MAINTAINER_SCORE_LATENCY: 80,
        LICENSE_SCORE_LATENCY: 90,
        PINNED_DEPENDENCIES_SCORE_LATENCY: 40,
        PULL_REQUESTS_SCORE_LATENCY: 30,
      };
      mockedMetricCalc.mockResolvedValueOnce(mockRating);
      mockedPoolQuery.mockResolvedValueOnce({ rows: [] }); // No existing rating

      const response = await handleGetPackageRating('package-id', {});

      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({
        ID: 'package-id',
        NET_SCORE: 0.8,
        RAMP_UP_SCORE: 0.6,
        CORRECTNESS_SCORE: 0.9,
        BUS_FACTOR_SCORE: 0.7,
        RESPONSIVE_MAINTAINER_SCORE: 0.8,
        LICENSE_SCORE: 1.0,
        PULL_REQUESTS_SCORE: 0.9,
        PINNED_DEPENDENCIES_SCORE: 0.5,
      });
    });

    it('should handle missing package ID', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1 });

      const response = await handleGetPackageRating('', {});

      expect(response).toEqual({
        statusCode: 400,
        body: JSON.stringify({ message: 'Missing field(s) in PackageID.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle authentication errors', async () => {
      mockedAuthenticate.mockRejectedValue({ statusCode: 401, message: 'Unauthorized' });

      const response = await handleGetPackageRating('package-id', {});

      expect(response).toEqual({
        statusCode: 403,
        body: JSON.stringify({
          message: 'Authentication failed due to invalid or missing AuthenticationToken',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle internal server errors', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1 });
      mockedPoolQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await handleGetPackageRating('package-id', {});

      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({ message: 'An error occurred while calculating the package rating.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('handleGetPackageCost', () => {
    it('should return package cost successfully', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1 });
      mockedPoolQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'package-id',
            name: 'test-package',
            version: '1.0.0',
            url: 'https://github.com/owner/repo',
            owner: 'owner',
          },
        ],
      });

      const mockFetchResponse1 = {
        ok: true,
        json: vi.fn().mockResolvedValue({ default_branch: 'main' }),
      };
      const mockFetchResponse2 = {
        ok: true,
        arrayBuffer: vi.fn().mockResolvedValue(new ArrayBuffer(1024 * 1024 * 5)), // 5 MB
      };
      mockedFetch.mockResolvedValueOnce(mockFetchResponse1 as any);
      mockedFetch.mockResolvedValueOnce(mockFetchResponse2 as any);

      const response = await handleGetPackageCost(
        'package-id',
        {},
        { dependency: 'false' }
      );

      expect(mockedAuthenticate).toHaveBeenCalled();
      expect(mockedPoolQuery).toHaveBeenCalledWith(expect.any(String), ['package-id']);
      expect(mockedFetch).toHaveBeenCalledTimes(2);
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toHaveProperty('package-id');
      expect(body['package-id']).toHaveProperty('totalCost');
    });

    it('should handle package not found', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1 });
      mockedPoolQuery.mockResolvedValueOnce({ rows: [] });

      const response = await handleGetPackageCost('non-existent-id', {}, {});

      expect(response).toEqual({
        statusCode: 404,
        body: JSON.stringify({ message: 'Package does not exist.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle authentication errors', async () => {
      mockedAuthenticate.mockRejectedValue({ statusCode: 401, message: 'Unauthorized' });

      const response = await handleGetPackageCost('package-id', {}, {});

      expect(response).toEqual({
        statusCode: 403,
        body: JSON.stringify({
          message: 'Authentication failed due to invalid or missing AuthenticationToken',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle errors during cost calculation', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1 });
      mockedPoolQuery.mockResolvedValueOnce({
        rows: [
          {
            id: 'package-id',
            name: 'test-package',
            version: '1.0.0',
            url: 'https://github.com/owner/repo',
            owner: 'owner',
          },
        ],
      });
      mockedFetch.mockRejectedValueOnce(new Error('Fetch error'));

      const response = await handleGetPackageCost(
        'package-id',
        {},
        { dependency: 'false' }
      );

      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({
          message: 'The package rating system choked on at least one of the metrics.',
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });

  describe('handleGetTracks', () => {
    it('should return planned tracks successfully', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1 });
      mockedPoolQuery.mockResolvedValueOnce({
        rows: [{ track_name: 'Track A' }, { track_name: 'Track B' }],
      });

      const response = await handleGetTracks({});

      expect(mockedAuthenticate).toHaveBeenCalled();
      expect(mockedPoolQuery).toHaveBeenCalledWith(
        expect.any(String),
        [1]
      );
      expect(response.statusCode).toBe(200);
      const body = JSON.parse(response.body);
      expect(body).toEqual({ plannedTracks: ['Track A', 'Track B'] });
    });

    it('should handle authentication errors', async () => {
      mockedAuthenticate.mockRejectedValue({ statusCode: 401, message: 'Unauthorized' });

      const response = await handleGetTracks({});

      expect(response).toEqual({
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should handle internal server errors', async () => {
      mockedAuthenticate.mockResolvedValue({ sub: 1 });
      mockedPoolQuery.mockRejectedValueOnce(new Error('Database error'));

      const response = await handleGetTracks({});

      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({
          message:
            "The system encountered an error while retrieving the student's track information.",
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });
});
