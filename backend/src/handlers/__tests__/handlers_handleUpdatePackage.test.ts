// handlers_handleUpdatePackage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleUpdatePackage } from '../../handlers/handlers';
import { authenticate } from '../../utils/auth';
import { sendResponse } from '../../utils/response';
import pool from '../../services/dbService';
import AdmZip from 'adm-zip';
import { getPackageContent, uploadPackageContent } from '../../services/s3Service';
import { generatePackageId,  metricCalcFromUrlUsingNetScore } from '../../handlerhelper';
import {insertIntoDB} from '../../services/dbService';
// Mock dependencies
vi.mock('../../utils/auth');
vi.mock('../../utils/response');
vi.mock('../../services/dbService');
vi.mock('adm-zip');
vi.mock('../../services/s3Service');
vi.mock('../../utils/helpers');

const mockedAuthenticate = authenticate as unknown as any;
const mockedSendResponse = sendResponse as unknown as any;
const mockedPoolQuery = pool.query as unknown as any;
const mockedAdmZip = AdmZip as unknown as any;
const mockedGetPackageContent = getPackageContent as unknown as any;
const mockedUploadPackageContent = uploadPackageContent as unknown as any;
const mockedGeneratePackageId = generatePackageId as unknown as any;
const mockedInsertIntoDB = insertIntoDB as unknown as any;
const mockedMetricCalcFromUrlUsingNetScore = metricCalcFromUrlUsingNetScore as unknown as any;

describe('handleUpdatePackage', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock sendResponse to return the response object
    mockedSendResponse.mockImplementation((statusCode, body) => ({
      statusCode,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  it('should return 403 if user does not have upload permission', async () => {
    const id = 'valid-id';
    const body = JSON.stringify({
      metadata: { ID: 'valid-id', Name: 'test-package', Version: '1.0.0' },
      data: { Content: 'UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t.........fQFQAoADBkODIwZWY3MjkyY2RlYzI4ZGQ4YjVkNTY1OTIxYjgxMDBjYTMzOTc=\n' }
    });
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: [] });

    const result = await handleUpdatePackage(id, body, headers);

    expect(result.statusCode).toBe(403);
    expect(mockedSendResponse).toHaveBeenCalledWith(403, { message: 'You do not have permission to update packages.' });
  });

  it('should return 400 if PackageID does not match', async () => {
    const id = 'valid-id';
    const body = JSON.stringify({
      metadata: { ID: 'invalid-id', Name: 'test-package', Version: '1.0.0' },
      data: { Content: 'UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t.........fQFQAoADBkODIwZWY3MjkyY2RlYzI4ZGQ4YjVkNTY1OTIxYjgxMDBjYTMzOTc=\n' }
    });
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: ['upload'] });

    const result = await handleUpdatePackage(id, body, headers);

    expect(result.statusCode).toBe(400);
    expect(mockedSendResponse).toHaveBeenCalledWith(400, { message: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
  });

  it('should return 404 if package does not exist', async () => {
    const id = 'valid-id';
    const body = JSON.stringify({
      metadata: { ID: 'valid-id', Name: 'test-package', Version: '1.0.0' },
      data: { Content: 'UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t.........fQFQAoADBkODIwZWY3MjkyY2RlYzI4ZGQ4YjVkNTY1OTIxYjgxMDBjYTMzOTc=\n' }
    });
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: ['upload'] });
    mockedPoolQuery.mockResolvedValue({ rows: [] });

    const result = await handleUpdatePackage(id, body, headers);

    expect(result.statusCode).toBe(404);
    expect(mockedSendResponse).toHaveBeenCalledWith(404, { message: 'Package does not exist.' });
  });

  it('should return 409 if package already exists', async () => {
    const id = 'valid-id';
    const body = JSON.stringify({
      metadata: { ID: 'valid-id', Name: 'test-package', Version: '1.0.0' },
      data: { Content: 'UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t.........fQFQAoADBkODIwZWY3MjkyY2RlYzI4ZGQ4YjVkNTY1OTIxYjgxMDBjYTMzOTc=\n' }
    });
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: ['upload'] });
    mockedPoolQuery.mockResolvedValueOnce({ rows: [{ id: 'valid-id' }] });

    const result = await handleUpdatePackage(id, body, headers);

    expect(result.statusCode).toBe(409);
    expect(mockedSendResponse).toHaveBeenCalledWith(409, { message: 'Package exists already.' });
  });

  it('should return 400 if invalid version is provided', async () => {
    const id = 'valid-id';
    const body = JSON.stringify({
      metadata: { ID: 'valid-id', Name: 'test-package', Version: '1.0.0' },
      data: { Content: 'UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t.........fQFQAoADBkODIwZWY3MjkyY2RlYzI4ZGQ4YjVkNTY1OTIxYjgxMDBjYTMzOTc=\n' }
    });
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: ['upload'] });
    mockedPoolQuery.mockResolvedValueOnce({ rows: [{ version: '1.0.1' }] });

    const result = await handleUpdatePackage(id, body, headers);

    expect(result.statusCode).toBe(400);
    expect(mockedSendResponse).toHaveBeenCalledWith(400, { message: 'Invalid Version.' });
  });

  it('should return 500 if internal server error occurs', async () => {
    const id = 'valid-id';
    const body = JSON.stringify({
      metadata: { ID: 'valid-id', Name: 'test-package', Version: '1.0.0' },
      data: { Content: 'UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t.........fQFQAoADBkODIwZWY3MjkyY2RlYzI4ZGQ4YjVkNTY1OTIxYjgxMDBjYTMzOTc=\n' }
    });
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: ['upload'] });
    mockedPoolQuery.mockRejectedValue(new Error('Internal server error'));

    const result = await handleUpdatePackage(id, body, headers);

    expect(result.statusCode).toBe(500);
    expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Internal server error.' });
  });

  it('should return 200 if package update is successful', async () => {
    const id = 'valid-id';
    const body = JSON.stringify({
      metadata: { ID: 'valid-id', Name: 'test-package', Version: '1.0.0' },
      data: { Content: 'UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t.........fQFQAoADBkODIwZWY3MjkyY2RlYzI4ZGQ4YjVkNTY1OTIxYjgxMDBjYTMzOTc=\n' }
    });
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: ['upload'], sub: 'user-id' });
    mockedPoolQuery.mockResolvedValueOnce({ rows: [{ id: 'valid-id' }] });
    mockedPoolQuery.mockResolvedValueOnce({ rows: [] });
    mockedGeneratePackageId.mockReturnValue('new-id');
    mockedInsertIntoDB.mockResolvedValue({});
    mockedUploadPackageContent.mockResolvedValue({});

    const result = await handleUpdatePackage(id, body, headers);

    expect(result.statusCode).toBe(200);
    expect(mockedSendResponse).toHaveBeenCalledWith(200, { message: 'Version is updated.' });
  });

  // Add more tests for other scenarios as needed
});