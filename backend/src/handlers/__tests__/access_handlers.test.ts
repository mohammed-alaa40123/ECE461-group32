// access_handlers.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleCreateGroup,
  handleCreatePermission,
  handleRegisterUser,
  handleDeleteUser,
  handleDeleteGroup,
  handleDeletePermission,
} from '../access_handlers';
import { authenticate } from '../../utils/auth';
import { sendResponse } from '../../utils/response';
import  pool  from '../../services/dbService';
import bcrypt from 'bcrypt';

// Mock dependencies
vi.mock('../../utils/auth');
vi.mock('../../utils/response');
vi.mock('../../services/dbService');
vi.mock('bcrypt');

const mockedAuthenticate = authenticate as unknown as any;
const mockedSendResponse = sendResponse as unknown as any;
const mockedPool = pool.query as unknown as any;
const mockedBcrypt = bcrypt.hash as unknown as any;

describe('Access Handlers', () => {
    beforeEach(() => {
        vi.resetAllMocks();
        
        // Mock sendResponse to return the response object
        mockedSendResponse.mockImplementation((statusCode, body) => ({
          statusCode,
          body: JSON.stringify(body),
          headers: { 'Content-Type': 'application/json' },
        }));
      });
    
  describe('handleCreateGroup', () => {
    it('should return 401 if authentication fails', async () => {
      mockedAuthenticate.mockRejectedValue({ statusCode: 401, message: 'Unauthorized' });

      const response = await handleCreateGroup('{"name":"Admins"}', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'Unauthorized' });
    });

    it('should return 403 if user is not admin', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });

      const response = await handleCreateGroup('{"name":"Admins"}', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(403, { message: 'Admin privileges required to create groups.' });
    });

    it('should return 400 if group name is missing', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });

      const response = await handleCreateGroup('{"permissions":["read"]}', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(400, { message: 'Group name is required.' });
    });

    it('should create group successfully', async () => {
        // Arrange
        mockedAuthenticate.mockResolvedValue({ isAdmin: true });
  
        // Mock pool.query calls in the exact order they are called in the handler
        mockedPool
          .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT group
          .mockResolvedValueOnce({}) // Assign 'upload' permission
          .mockResolvedValueOnce({}) // Assign 'update' permission
          .mockResolvedValueOnce({}); // COMMIT
  
        const requestBody = '{"name":"Admin3s","permissions":["upload","update"]}';
        const requestHeaders = {};
  
        // Act
        const response = await handleCreateGroup(requestBody, requestHeaders);
  
        // Assert
        expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
        expect(mockedPool).toHaveBeenCalledTimes(5); // BEGIN, INSERT group, assign upload, assign update, COMMIT
        expect(response).toEqual({
          statusCode: 201,
          body: JSON.stringify({ message: 'Group created successfully!', groupId: 1 }),
          headers: { 'Content-Type': 'application/json' },
        });
        expect(mockedSendResponse).toHaveBeenCalledWith(201, { message: 'Group created successfully!', groupId: 1 });
      });
      it('should handle duplicate group error', async () => {
        // Arrange
        mockedAuthenticate.mockResolvedValue({ isAdmin: true });
  
        // Mock pool.query for BEGIN and INSERT group with duplicate error
        mockedPool
          .mockResolvedValueOnce({}) // BEGIN
          .mockRejectedValueOnce({ code: '23505', message: 'Duplicate group' }); // INSERT group
  
        const requestBody = '{"name":"Admins"}';
        const requestHeaders = {};
  
        // Act
        const response = await handleCreateGroup(requestBody, requestHeaders);
  
        // Assert
        expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
        expect(mockedPool).toHaveBeenCalledTimes(3);
        expect(mockedPool).toHaveBeenNthCalledWith(1, 'BEGIN');
        expect(mockedPool).toHaveBeenNthCalledWith(
          2,
          expect.stringContaining('INSERT INTO groups'),
          ['Admins']
        );
  
        expect(mockedPool).toHaveBeenNthCalledWith(2, expect.anything(),['Admins']); // Ensure the second call was made
        expect(mockedSendResponse).toHaveBeenCalledWith(409, { message: 'Group already exists.' });
        expect(response).toEqual({
          statusCode: 409,
          body: JSON.stringify({ message: 'Group already exists.' }),
          headers: { 'Content-Type': 'application/json' },
        });
      });
  
      it('should handle internal server error', async () => {
        // Arrange
        mockedAuthenticate.mockResolvedValue({ isAdmin: true });
  
        // Mock pool.query for BEGIN and INSERT group with generic error
        mockedPool
          .mockResolvedValueOnce({}) // BEGIN
          .mockRejectedValueOnce({ code: '12345', message: 'Some error' }); // INSERT group
  
        const requestBody = '{"name":"Admins"}';
        const requestHeaders = {};
  
        // Act
        const response = await handleCreateGroup(requestBody, requestHeaders);
  
        // Assert
        expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
        expect(mockedPool).toHaveBeenCalledTimes(3);
        expect(mockedPool).toHaveBeenNthCalledWith(1, 'BEGIN');
        expect(mockedPool).toHaveBeenNthCalledWith(
          2,
          expect.stringContaining('INSERT INTO groups'),
          ['Admins']
        );
  
        expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Internal server error.' });
        expect(response).toEqual({
          statusCode: 500,
          body: JSON.stringify({ message: 'Internal server error.' }),
          headers: { 'Content-Type': 'application/json' },
        });
      });
  
      it('should return 403 if user is not admin', async () => {
        // Arrange
        mockedAuthenticate.mockResolvedValue({ isAdmin: false });
  
        const requestBody = '{"name":"Admins"}';
        const requestHeaders = {};
  
        // Act
        const response = await handleCreateGroup(requestBody, requestHeaders);
  
        // Assert
        expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
        expect(mockedPool).toHaveBeenCalledTimes(0); // No DB operations
        expect(mockedSendResponse).toHaveBeenCalledWith(403, { message: 'Admin privileges required to create groups.' });
        expect(response).toEqual({
          statusCode: 403,
          body: JSON.stringify({ message: 'Admin privileges required to create groups.' }),
          headers: { 'Content-Type': 'application/json' },
        });
      });
  
    });

  describe('handleCreatePermission', () => {
    it('should return 403 if user is not admin', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });

      const response = await handleCreatePermission('{"name":"read"}', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(403, { message: 'Admin privileges required to create permissions.' });
    });

    it('should return 400 if permission name is missing', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });

      const response = await handleCreatePermission('{}', {});

      expect(response).toEqual({
        statusCode: 400,
        body: JSON.stringify({ message: 'Permission name is required.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

    it('should create permission successfully', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPool.mockResolvedValueOnce({ rows: [{ id: 1 }] });

      const response = await handleCreatePermission('{"name":"read"}', {});

      expect(mockedPool).toHaveBeenCalledWith(expect.any(String), ['read']);
      expect(response).toEqual({
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Permission created successfully!', permissionId: 1 }),
        statusCode: 201,
    });
    });

    it('should handle duplicate permission error', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      const error = { code: '23505', message: 'Duplicate permission' };
      mockedPool.mockRejectedValue(error);

      const response = await handleCreatePermission('{"name":"read"}', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(409, { message: 'Permission already exists.' });
    });

    it('should handle internal server error', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      const error = { code: '12345', message: 'Some error' };
      mockedPool.mockRejectedValue(error);

      const response = await handleCreatePermission('{"name":"read"}', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Internal server error.' });
    });
  });

  // describe('handleRegisterUser', () => {
  //   it('should return 403 if user is not admin', async () => {
  //     mockedAuthenticate.mockResolvedValue({ isAdmin: false });

  //     const response = await handleRegisterUser('{"name":"john","password":"secret"}', {});

  //     expect(mockedSendResponse).toHaveBeenCalledWith(403, { message: 'Admin privileges required to register users.' });
  //   });

  //   it('should register user successfully as admin', async () => {
  //       // Arrange
  //       mockedAuthenticate.mockResolvedValue({ isAdmin: true });
  //       mockedBcrypt.mockResolvedValue('hashedPassword');
  
  //       // Mock pool.query calls in the exact order they are called in the handler
  //       mockedPool
  //         .mockResolvedValueOnce({}) // BEGIN
  //         .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT user
  //         .mockResolvedValueOnce({}) // INSERT into user_groups
  //         .mockResolvedValueOnce({ rows: [{ id: 101 }, { id: 102 }] }) // SELECT permissions
  //         .mockResolvedValueOnce({}) // INSERT into user_permissions (id: 101)
  //         .mockResolvedValueOnce({}) // INSERT into user_permissions (id: 102)
  //         .mockResolvedValueOnce({}); // COMMIT
  
  //       const requestBody = '{"name":"John Doe","password":"secret","groupId":1}';
  //       const requestHeaders = {};
  
  //       // Act
  //       const response = await handleRegisterUser(requestBody, requestHeaders);
  
  //       // Assert
  //       expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
  //       expect(mockedBcrypt).toHaveBeenCalledWith('secret', 10);
  //       expect(mockedPool).toHaveBeenCalledTimes(1);
  //       // expect(mockedPool).toHaveBeenNthCalledWith(1, 'BEGIN');
  //       // expect(mockedPool).toHaveBeenNthCalledWith(2, expect.stringContaining('INSERT INTO users'), [
  //       //   'John Doe',
  //       //   'hashedPassword',
  //       //   true,
  //       // ]);
  //       // expect(mockedPool).toHaveBeenNthCalledWith(3, expect.stringContaining('INSERT INTO user_groups'), [
  //       //   1,
  //       //   1,
  //       // ]);
  //       // expect(mockedPool).toHaveBeenNthCalledWith(
  //       //   4,
  //       //   expect.stringContaining('SELECT id FROM permissions'),
  //       //   [1]
  //       // );
  //       // expect(mockedPool).toHaveBeenNthCalledWith(5, expect.stringContaining('INSERT INTO user_permissions'), [
  //       //   1,
  //       //   101,
  //       // ]);
  //       // expect(mockedPool).toHaveBeenNthCalledWith(6, expect.stringContaining('INSERT INTO user_permissions'), [
  //       //   1,
  //       //   102,
  //       // ]);
  //       // expect(mockedPool).toHaveBeenNthCalledWith(7, 'COMMIT');
  
  //       expect(response).toEqual({
  //         statusCode: 201,
  //         body: JSON.stringify({ message: 'User registered successfully!', userId: 1 }),
  //         headers: { 'Content-Type': 'application/json' },
  //       });
  //       expect(mockedSendResponse).toHaveBeenCalledWith(201, { message: 'User registered successfully!', userId: 1 });
  //     });
  
  //     it('should register user successfully as non-admin', async () => {
  //       // Arrange
  //       mockedAuthenticate.mockResolvedValue({ isAdmin: false });
  //       mockedBcrypt.mockResolvedValue('hashedPassword');
  
  //       // Mock pool.query calls
  //       mockedPool
  //         .mockResolvedValueOnce({}) // BEGIN
  //         .mockResolvedValueOnce({ rows: [{ id: 2 }] }) // INSERT user
  //         .mockResolvedValueOnce({}) // INSERT into user_groups
  //         .mockResolvedValueOnce({ rows: [{ permission_id: 103 }] }) // SELECT permissions
  //         .mockResolvedValueOnce({}) // INSERT into user_permissions (permission_id: 103)
  //         .mockResolvedValueOnce({}) // COMMIT
  
  //       const requestBody = '{"name":"Jane Smith","password":"password123","groupId":2}';
  //       const requestHeaders = {};
  
  //       // Act
  //       const response = await handleRegisterUser(requestBody, requestHeaders);
  
  //       // Assert
  //       expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
  //       expect(mockedBcrypt).toHaveBeenCalledWith('password123', 10);
  //       expect(mockedPool).toHaveBeenCalledTimes(6); // BEGIN, INSERT user, INSERT user_groups, SELECT permissions, INSERT user_permissions, COMMIT
  //       expect(response).toEqual({
  //         statusCode: 201,
  //         body: JSON.stringify({ message: 'User registered successfully!', userId: 2 }),
  //         headers: { 'Content-Type': 'application/json' },
  //       });
  //       expect(mockedSendResponse).toHaveBeenCalledWith(201, { message: 'User registered successfully!', userId: 2 });
  //     });
  
  //     it('should handle duplicate user error', async () => {
  //       // Arrange
  //       mockedAuthenticate.mockResolvedValue({ isAdmin: true });
  //       mockedBcrypt.mockResolvedValue('hashedPassword');
  
  //       mockedPool
  //         .mockResolvedValueOnce({}) // BEGIN
  //         .mockRejectedValueOnce({ code: '23505', message: 'Duplicate user' }); // INSERT user
  
  //       const requestBody = '{"name":"John Doe","password":"secret","groupId":1}';
  //       const requestHeaders = {};
  
  //       // Act
  //       const response = await handleRegisterUser(requestBody, requestHeaders);
  
  //       // Assert
  //       expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
  //       expect(mockedBcrypt).toHaveBeenCalledWith('secret', 10);
  //       expect(mockedPool).toHaveBeenCalledTimes(1); // BEGIN, INSERT user
  //       expect(mockedSendResponse).toHaveBeenCalledWith(409, { message: 'User already exists.' });
  //     });
  
  //     it('should handle internal server error', async () => {
  //       // Arrange
  //       mockedAuthenticate.mockResolvedValue({ isAdmin: true });
  //       mockedBcrypt.mockResolvedValue('hashedPassword');
  
  //       mockedPool
  //         .mockResolvedValueOnce({}) // BEGIN
  //         .mockRejectedValueOnce({ code: '12345', message: 'Some error' }); // INSERT user
  
  //       const requestBody = '{"name":"John Doe","password":"secret","groupId":1}';
  //       const requestHeaders = {};
  
  //       // Act
  //       const response = await handleRegisterUser(requestBody, requestHeaders);
  
  //       // Assert
  //       expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
  //       expect(mockedBcrypt).toHaveBeenCalledWith('secret', 10);
  //       expect(mockedPool).toHaveBeenCalledTimes(1); // BEGIN, INSERT user
  //       expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Internal server error.' });
  //     });
  
  //     it('should return 403 if user is not admin', async () => {
  //       // Arrange
  //       mockedAuthenticate.mockResolvedValue({ isAdmin: false });
  
  //       const requestBody = '{"name":"John Doe","password":"secret","groupId":1}';
  //       const requestHeaders = {};
  
  //       // Act
  //       const response = await handleRegisterUser(requestBody, requestHeaders);
  
  //       // Assert
  //       expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
  //       expect(mockedPool).toHaveBeenCalledTimes(0); // No DB operations
  //       expect(mockedSendResponse).toHaveBeenCalledWith(403, { message: 'Admin privileges required to register users.' });
  //     });
  
  //     it('should return 400 if name or password is missing', async () => {
  //       // Arrange
  //       mockedAuthenticate.mockResolvedValue({ isAdmin: true });
  
  //       const requestBody = '{"name":"","password":""}';
  //       const requestHeaders = {};
  
  //       // Act
  //       const response = await handleRegisterUser(requestBody, requestHeaders);
  
  //       // Assert
  //       expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
  //       expect(mockedPool).toHaveBeenCalledTimes(0); // No DB operations
  //       expect(mockedSendResponse).toHaveBeenCalledWith(400, { message: 'Name and password are required.' });
  //     });
  //   });
  

  describe('handleDeleteUser', () => {
    it('should return 403 if user is not admin', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });

      const response = await handleDeleteUser('1', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(403, { message: 'Admin privileges required to delete users.' });
    });

    it('should return 404 if user does not exist', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPool.mockResolvedValue({ rows: [] });

      const response = await handleDeleteUser('999', {});

      expect(mockedPool).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1 RETURNING *', ['999']);
      expect(mockedSendResponse).toHaveBeenCalledWith(404, { message: 'User does not exist.' });
    });

    it('should delete user successfully', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPool.mockResolvedValue({ rows: [{ id: 1, name: 'john' }] });

      const response = await handleDeleteUser('1', {});

      expect(mockedPool).toHaveBeenCalledWith('DELETE FROM users WHERE id = $1 RETURNING *', ['1']);
      expect(mockedSendResponse).toHaveBeenCalledWith(200, { message: 'User deleted successfully.' });
    });

    it('should handle internal server error', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      const error = { code: '12345', message: 'Some error' };
      mockedPool.mockRejectedValue(error);

      const response = await handleDeleteUser('1', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Internal server error.' });
    });
  });

  describe('handleDeleteGroup', () => {
    it('should return 403 if user is not admin', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });

      const response = await handleDeleteGroup('1', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(403, { message: 'Admin privileges required to delete groups.' });
    });

    it('should return 404 if group does not exist', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPool.mockResolvedValue({ rows: [] });

      const response = await handleDeleteGroup('999', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(404, { message: 'Group does not exist.' });
    });

    it('should delete group successfully', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPool.mockResolvedValue({ rows: [{ id: 1, name: 'Admins' }] });

      const response = await handleDeleteGroup('1', {});

      expect(mockedPool).toHaveBeenCalledWith('DELETE FROM groups WHERE id = $1 RETURNING *', ['1']);
      expect(mockedSendResponse).toHaveBeenCalledWith(200, { message: 'Group deleted successfully.' });
    });

    it('should handle internal server error', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      const error = { code: '12345', message: 'Some error' };
      mockedPool.mockRejectedValue(error);

      const response = await handleDeleteGroup('1', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Internal server error.' });
    });
  });

  describe('handleDeletePermission', () => {
    it('should return 403 if user is not admin', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });

      const response = await handleDeletePermission('1', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(403, { message: 'Admin privileges required to delete permissions.' });
    });

    it('should return 404 if permission does not exist', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPool.mockResolvedValue({ rows: [] });

      const response = await handleDeletePermission('999', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(404, { message: 'Permission does not exist.' });
    });

    it('should delete permission successfully', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPool.mockResolvedValue({ rows: [{ id: 1, name: 'read' }] });

      const response = await handleDeletePermission('1', {});

      expect(mockedPool).toHaveBeenCalledWith('DELETE FROM permissions WHERE id = $1 RETURNING *', ['1']);
      expect(mockedSendResponse).toHaveBeenCalledWith(200, { message: 'Permission deleted successfully.' });
    });

    it('should handle internal server error', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      const error = { code: '12345', message: 'Some error' };
      mockedPool.mockRejectedValue(error);

      const response = await handleDeletePermission('1', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Internal server error.' });
    });
  });
});