// handlers_handleRetrievePackage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleRetrievePackage } from '../../handlers/handlers';
import { authenticate } from '../../utils/auth';
import { sendResponse } from '../../utils/response';
import pool from '../../services/dbService';
import { getPackageContent } from '../../services/s3Service';

// Mock dependencies
vi.mock('../../utils/auth');
vi.mock('../../utils/response');
vi.mock('../../services/dbService');
vi.mock('../../services/s3Service');

const mockedAuthenticate = authenticate as unknown as any;
const mockedSendResponse = sendResponse as unknown as any;
const mockedPoolQuery = pool.query as unknown as any;
const mockedGetPackageContent = getPackageContent as unknown as any;

describe('handleRetrievePackage', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock sendResponse to return the response object
    mockedSendResponse.mockImplementation((statusCode, body) => ({
      statusCode,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  it('should return 400 if PackageID is invalid', async () => {
    const id = '';
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    const result = await handleRetrievePackage(id, headers);

    expect(result.statusCode).toBe(400);
    expect(mockedSendResponse).toHaveBeenCalledWith(400, { message: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
  });

  it('should return 500 if authentication fails', async () => {
    const id = 'valid-id';
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockRejectedValue({ statusCode: 500, message: 'Authentication failed' });

    const result = await handleRetrievePackage(id, headers);

    expect(result.statusCode).toBe(500);
    expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Authentication failed' });
  });

  it('should return 403 if user does not have download permission', async () => {
    const id = 'valid-id';
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: [] });

    const result = await handleRetrievePackage(id, headers);

    expect(result.statusCode).toBe(401);
    expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'You do not have permission to download packages.' });
  });

  it('should return 404 if package does not exist', async () => {
    const id = 'valid-id';
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: ['download'] });
    mockedPoolQuery.mockResolvedValue({ rows: [] });

    const result = await handleRetrievePackage(id, headers);

    expect(result.statusCode).toBe(404);
    expect(mockedSendResponse).toHaveBeenCalledWith(404, { message: 'Package does not exist.' });
  });

  it('should return 500 if S3 retrieval fails', async () => {
    const id = 'valid-id';
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: ['download'] });
    mockedPoolQuery.mockResolvedValue({ rows: [{ id: 'valid-id', name: 'test-package', version: '1.0.0', content: null }] });
    mockedGetPackageContent.mockRejectedValue(new Error('S3 Retrieval Error'));

    const result = await handleRetrievePackage(id, headers);

    expect(result.statusCode).toBe(500);
    expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Failed to retrieve package content.' });
  });

  it('should return 200 if package retrieval is successful', async () => {
    const id = 'valid-id';
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: ['download'], sub: 'user-id' });
    mockedPoolQuery.mockResolvedValue({ rows: [{ id: 'valid-id', name: 'test-package', version: '1.0.0', content: 'package-content', js_program: 'console.log("test");' }] });

    const result = await handleRetrievePackage(id, headers);

    expect(result.statusCode).toBe(200);
    expect(mockedSendResponse).toHaveBeenCalledWith(200, {
      metadata: {
        Name: 'test-package',
        Version: '1.0.0',
        ID: 'valid-id',
      },
      data: {
        Content: 'package-content',
        JSProgram: 'console.log("test");',
      },
    });
  });
});