// handlers_handleCreatePackage.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleCreatePackage } from '../../handlers/handlers';
import { authenticate } from '../../utils/auth';
import { sendResponse } from '../../utils/response';
import AdmZip from 'adm-zip';

// Mock dependencies
vi.mock('../../utils/auth');
vi.mock('../../utils/response');
vi.mock('adm-zip');

const mockedAuthenticate = authenticate as unknown as any;
const mockedSendResponse = sendResponse as unknown as any;
const mockedAdmZip = AdmZip as unknown as any;

describe('handleCreatePackage', () => {
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
    const body = JSON.stringify({
      "Content": "UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t.........fQFQAoADBkODIwZWY3MjkyY2RlYzI4ZGQ4YjVkNTY1OTIxYjgxMDBjYTMzOTc=\n",
      "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n",
      "debloat": false,
      "Name": "cool-package"
    });
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: [] });

    const result = await handleCreatePackage(body, headers);

    expect(result.statusCode).toBe(403);
    expect(mockedSendResponse).toHaveBeenCalledWith(403, { message: 'You do not have permission to upload packages.' });
  });

  it('should return 500 if authentication fails', async () => {
    const body = JSON.stringify({
      "Content": "UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t.........fQFQAoADBkODIwZWY3MjkyY2RlYzI4ZGQ4YjVkNTY1OTIxYjgxMDBjYTMzOTc=\n",
      "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n",
      "debloat": false,
      "Name": "cool-package"
    });
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockRejectedValue({ statusCode: 500, message: 'Authentication failed' });

    const result = await handleCreatePackage(body, headers);

    expect(result.statusCode).toBe(500);
    expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Authentication failed' });
  });

  it('should return 200 if package creation is successful', async () => {
    const body = JSON.stringify({
      "Content": "UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t.........fQFQAoADBkODIwZWY3MjkyY2RlYzI4ZGQ4YjVkNTY1OTIxYjgxMDBjYTMzOTc=\n",
      "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n",
      "debloat": false,
      "Name": "cool-package"
    });
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: ['upload'] });

    const result = await handleCreatePackage(body, headers);

    expect(result.statusCode).toBe(200);
    expect(mockedSendResponse).toHaveBeenCalledWith(200, expect.any(Object));
  });

  it('should return 200 if package creation is successful with URL', async () => {
    const body = JSON.stringify({
      "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n",
      "URL": "https://github.com/jashkenas/underscore"
    });
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: ['upload'] });

    const result = await handleCreatePackage(body, headers);

    expect(result.statusCode).toBe(200);
    expect(mockedSendResponse).toHaveBeenCalledWith(200, expect.any(Object));
  });

  it('should return 400 if no package.json is found in zip', async () => {
    const body = JSON.stringify({
      "Content": "UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t.........fQFQAoADBkODIwZWY3MjkyY2RlYzI4ZGQ4YjVkNTY1OTIxYjgxMDBjYTMzOTc=\n",
      "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n",
      "debloat": false,
      "Name": "cool-package"
    });
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: ['upload'] });

    const zipMock = {
      getEntries: vi.fn().mockReturnValue([
        { entryName: 'readme.txt', getData: vi.fn().mockReturnValue(Buffer.from('Readme content')) }
      ])
    };
    mockedAdmZip.mockImplementation(() => zipMock);

    const result = await handleCreatePackage(body, headers);

    expect(result.statusCode).toBe(400);
    expect(mockedSendResponse).toHaveBeenCalledWith(400, { message: 'No package.json found in zip' });
  });

  it('should return 400 if both URL and Content are set in the body', async () => {
    const body = JSON.stringify({
      "Content": "UEsDBAoAAAAAACAfUFkAAAAAAAAAAAAAAAASAAkAdW5kZXJzY29yZS1t.........fQFQAoADBkODIwZWY3MjkyY2RlYzI4ZGQ4YjVkNTY1OTIxYjgxMDBjYTMzOTc=\n",
      "JSProgram": "if (process.argv.length === 7) {\nconsole.log('Success')\nprocess.exit(0)\n} else {\nconsole.log('Failed')\nprocess.exit(1)\n}\n",
      "URL": "https://github.com/jashkenas/underscore",
      "debloat": false,
      "Name": "cool-package"
    });
    const headers = { 'X-Authorization': 'Bearer mockToken' };

    mockedAuthenticate.mockResolvedValue({ permissions: ['upload'] });

    const result = await handleCreatePackage(body, headers);

    expect(result.statusCode).toBe(400);
    expect(mockedSendResponse).toHaveBeenCalledWith(400, { message: 'Either Content or URL must be set, but not both.' });
  });

  // Add more tests for other scenarios as needed
});