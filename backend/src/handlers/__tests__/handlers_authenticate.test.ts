// handlers_authenticate.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import { handleAuthenticate } from '../handlers';
import { sendResponse } from '../../utils/response';
import { getUserByName } from '../../services/dbService';
import bcrypt from 'bcrypt';
import { json } from 'stream/consumers';
import jwt from 'jsonwebtoken';

// Mock dependencies
vi.mock('../../utils/response');
vi.mock('../../services/dbService');
vi.mock('bcrypt');
vi.mock('jsonwebtoken');

const mockedSendResponse = sendResponse as unknown as any;
const mockedGetUserByName = getUserByName as unknown as any;
const mockedBcryptCompare = bcrypt.compare as unknown as any;

describe('handleAuthenticate', () => {
  beforeEach(() => {
    vi.resetAllMocks();

    // Mock sendResponse to return the response object
    mockedSendResponse.mockImplementation((statusCode, body) => ({
      statusCode,
      body: JSON.stringify(body),
      headers: { 'Content-Type': 'application/json' },
    }));
  });

  it('should return 400 if fields are missing', async () => {
    const body = JSON.stringify({ User: { name: 'test' }, Secret: {} });

    const result = await handleAuthenticate(body);

    expect(result.statusCode).toBe(400);
    expect(mockedSendResponse).toHaveBeenCalledWith(400, { message: 'Missing fields in AuthenticationRequest' });
  });

  it('should return 500 if there is an error fetching user', async () => {
    const body = JSON.stringify({ User: { name: 'test', isAdmin: false }, Secret: { password: 'password' } });

    mockedGetUserByName.mockRejectedValue(new Error('DB Error'));

    const result = await handleAuthenticate(body);

    expect(result.statusCode).toBe(500);
    expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Internal server error.' });
  });

  it('should return 401 if password does not match', async () => {
    const body = JSON.stringify({ User: { name: 'test', isAdmin: false }, Secret: { password: 'password' } });

    mockedGetUserByName.mockResolvedValue({ name: 'test', passwordHash: 'hashedPassword' });
    mockedBcryptCompare.mockResolvedValue(false);

    const result = await handleAuthenticate(body);

    expect(result.statusCode).toBe(401);
    expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'Invalid user or password.' });
  });

  it('should return 200 if authentication is successful', async () => {
    const body = JSON.stringify({
      "User": {
        "name": "ece30861defaultadminuser",
        "isAdmin": true
      },
      "Secret": {
        "password": "correcthorsebatterystaple123(!__+@**(A'\"`;DROP TABLE packages;"
      }
    });
    mockedGetUserByName.mockResolvedValue({ name: 'test', passwordHash: 'hashedPassword' });
    mockedBcryptCompare.mockResolvedValue(true);

    const result = await handleAuthenticate(body);

    expect(result.statusCode).toBe(200);
  });
});