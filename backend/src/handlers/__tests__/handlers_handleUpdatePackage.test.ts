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

    expect(result.statusCode).toBe(401);
    expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'You do not have permission to update packages.' });
  });
});