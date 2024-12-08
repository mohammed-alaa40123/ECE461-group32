// access_handlers.test.ts
import { describe, it, expect, beforeEach, vi } from 'vitest';
import {
  handleCreateGroup,
  handleCreatePermission,
  handleRegisterUser,
  handleDeleteUser,
  handleDeleteGroup,
  handleDeletePermission,
  handleRetrieveUserGroupsAndPermissionsForUser,
  handleRetrieveUserGroupsAndPermissions,
  handleEditUserGroupsAndPermissions

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

    it('should return 401 if user is not admin', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });

      const response = await handleCreateGroup('{"name":"Admins"}', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'Admin privileges required to create groups.' });
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
  
      it('should return 401 if user is not admin', async () => {
        // Arrange
        mockedAuthenticate.mockResolvedValue({ isAdmin: false });
  
        const requestBody = '{"name":"Admins"}';
        const requestHeaders = {};
  
        // Act
        const response = await handleCreateGroup(requestBody, requestHeaders);
  
        // Assert
        expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
        expect(mockedPool).toHaveBeenCalledTimes(0); // No DB operations
        expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'Admin privileges required to create groups.' });
        expect(response).toEqual({
          statusCode: 401,
          body: JSON.stringify({ message: 'Admin privileges required to create groups.' }),
          headers: { 'Content-Type': 'application/json' },
        });
      });
  
    });

  describe('handleCreatePermission', () => {
    it('should return 401 if user is not admin', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });

      const response = await handleCreatePermission('{"name":"read"}', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'Admin privileges required to create permissions.' });
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

  describe('handleRegisterUser', () => {
    it('should return 401 if user is not admin', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });

      const response = await handleRegisterUser('{"name":"john","password":"secret"}', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'Admin privileges required to register users.' });
    });

    it('should register user successfully as admin', async () => {
      // Arrange
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedBcrypt.mockResolvedValue('hashedPassword');

      // Mock pool.query calls in the exact order they are called in the handler
      mockedPool
        // .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // INSERT user
        .mockResolvedValueOnce({}) // INSERT into user_groups
        .mockResolvedValueOnce({ rows: [{ id: 101 }, { id: 102 }] }) // SELECT permissions
        .mockResolvedValueOnce({}) // INSERT into user_permissions (id: 101)
        .mockResolvedValueOnce({}) // INSERT into user_permissions (id: 102)
        .mockResolvedValueOnce({}); // COMMIT

      const requestBody = '{"name":"John Doe","password":"secret"}';
      const requestHeaders = {};

      // Act
      const response = await handleRegisterUser(requestBody, requestHeaders);

      // Assert
      expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
      expect(mockedBcrypt).toHaveBeenCalledWith('secret', 10);
      expect(mockedPool).toHaveBeenCalledTimes(1);
      // expect(mockedPool).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockedPool).toHaveBeenNthCalledWith(1, expect.stringContaining('INSERT INTO users'), [
        'John Doe',
        'hashedPassword',
        false,
      ]);
      
      expect(mockedSendResponse).toHaveBeenCalledWith(201, { message: 'User registered successfully!' });

      expect(response).toEqual({
        statusCode: 201,
        body: JSON.stringify({ message: 'User registered successfully!' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });

  
      it('should register user successfully as non-admin', async () => {
        // Arrange
        mockedAuthenticate.mockResolvedValue({ isAdmin: true });
        mockedBcrypt.mockResolvedValue('hashedPassword');
  
        // Mock pool.query calls
        mockedPool
          // .mockResolvedValueOnce({}) // BEGIN
          .mockResolvedValueOnce({ rows: [{ id: 3 }] }) // INSERT user
          .mockResolvedValueOnce({}) // INSERT into user_groups
          .mockResolvedValueOnce({ rows: [{ permission_id: 103 }] }) // SELECT permissions
          .mockResolvedValueOnce({}) // INSERT into user_permissions (permission_id: 103)
          .mockResolvedValueOnce({}) // COMMIT
  
        const requestBody = '{"name":"Jane Smith","password":"password123","isAdmin":false}';
        const requestHeaders = {};
  
        // Act
        const response = await handleRegisterUser(requestBody, requestHeaders);
  
        // Assert
        expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
        expect(mockedBcrypt).toHaveBeenCalledWith('password123', 10);
        expect(mockedPool).toHaveBeenCalledTimes(1); // BEGIN, INSERT user, INSERT user_groups, SELECT permissions, INSERT user_permissions, COMMIT
        expect(response).toEqual({
          statusCode: 201,
          body: JSON.stringify({ message: 'User registered successfully!' }),
          headers: { 'Content-Type': 'application/json' },
        });
        expect(mockedSendResponse).toHaveBeenCalledWith(201, { message: 'User registered successfully!' });
      });
  
      it('should handle duplicate user error', async () => {
        // Arrange
        mockedAuthenticate.mockResolvedValue({ isAdmin: true });
        mockedBcrypt.mockResolvedValue('hashedPassword');
  
        mockedPool
          // .mockResolvedValueOnce({}) // BEGIN
          .mockRejectedValueOnce({ code: '23505', message: 'Duplicate user' }); // INSERT user
  
        const requestBody = '{"name":"John Doe","password":"secret"}';
        const requestHeaders = {};
  
        // Act
        const response = await handleRegisterUser(requestBody, requestHeaders);
  
        // Assert
        expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
        expect(mockedBcrypt).toHaveBeenCalledWith('secret', 10);
        expect(mockedPool).toHaveBeenCalledTimes(1); // BEGIN, INSERT user
        expect(mockedSendResponse).toHaveBeenCalledWith(409, { message: 'User already exists.' });
      });
  
      it('should handle internal server error', async () => {
        // Arrange
        mockedAuthenticate.mockResolvedValue({ isAdmin: true });
        mockedBcrypt.mockResolvedValue('hashedPassword');
  
        mockedPool
          .mockResolvedValueOnce({}) // BEGIN
          .mockRejectedValueOnce({ code: '12345', message: 'Some error' }); // INSERT user
  
        const requestBody = '{"name":"John Doe","password":"secret","groupId":1}';
        const requestHeaders = {};
  
        // Act
        const response = await handleRegisterUser(requestBody, requestHeaders);
  
        // Assert
        expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
        expect(mockedBcrypt).toHaveBeenCalledWith('secret', 10);
        expect(mockedPool).toHaveBeenCalledTimes(1); // BEGIN, INSERT user
        expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Internal server error.' });
      });
  
      it('should return 401 if user is not admin', async () => {
        // Arrange
        mockedAuthenticate.mockResolvedValue({ isAdmin: false });
  
        const requestBody = '{"name":"John Doe","password":"secret","groupId":1}';
        const requestHeaders = {};
  
        // Act
        const response = await handleRegisterUser(requestBody, requestHeaders);
  
        // Assert
        expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
        expect(mockedPool).toHaveBeenCalledTimes(0); // No DB operations
        expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'Admin privileges required to register users.' });
      });
  
      it('should return 400 if name or password is missing', async () => {
        // Arrange
        mockedAuthenticate.mockResolvedValue({ isAdmin: true });
  
        const requestBody = '{"name":"","password":""}';
        const requestHeaders = {};
  
        // Act
        const response = await handleRegisterUser(requestBody, requestHeaders);
  
        // Assert
        expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
        expect(mockedPool).toHaveBeenCalledTimes(0); // No DB operations
        expect(mockedSendResponse).toHaveBeenCalledWith(400, { message: 'Name and password are required.' });
      });
    });
  

  describe('handleDeleteUser', () => {
    it('should return 401 if user is not admin', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });

      const response = await handleDeleteUser('1', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'Admin privileges required to delete users.' });
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
    it('should return 401 if user is not admin', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });

      const response = await handleDeleteGroup('1', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'Admin privileges required to delete groups.' });
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

    describe('handleRetrieveUserGroupsAndPermissionsForUser', () => {
    it('should retrieve user groups and permissions as admin', async () => {
      // Arrange
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPool
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Admins' }] }) // SELECT user groups
        .mockResolvedValueOnce({ rows: [{ id: 101, name: 'Read' }] }); // SELECT user permissions
  
      const targetUserId = '1';
      const requestHeaders = {};
  
      // Act
      const response = await handleRetrieveUserGroupsAndPermissionsForUser(targetUserId, requestHeaders);
  
      // Assert
      expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
      expect(mockedPool).toHaveBeenCalledTimes(2);
      expect(mockedPool).toHaveBeenNthCalledWith(1, `SELECT g.id, g.name FROM user_groups ug JOIN groups g ON ug.group_id = g.id WHERE ug.user_id = $1`, [1]);
  
      expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({
          groups: [{ id: 1, name: 'Admins' }],
          permissions: [{ id: 101, name: 'Read' }],
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  
    it('should return 401 if user is not admin', async () => {
      // Arrange
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });
  
      const targetUserId = '1';
      const requestHeaders = {};
  
      // Act
      const response = await handleRetrieveUserGroupsAndPermissionsForUser(targetUserId, requestHeaders);
  
      // Assert
      expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
      expect(mockedPool).not.toHaveBeenCalled();
      expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'Admin privileges required to retrieve user groups and permissions.' });
      expect(response).toEqual({
        statusCode: 401,
        body: JSON.stringify({ message: 'Admin privileges required to retrieve user groups and permissions.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  
    it('should return 500 on internal server error', async () => {
      // Arrange
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPool
        .mockRejectedValueOnce(new Error('Database error')); // Error during first query
  
      const targetUserId = '1';
      const requestHeaders = {};
  
      // Act
      const response = await handleRetrieveUserGroupsAndPermissionsForUser(targetUserId, requestHeaders);
  
      // Assert
      expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
      expect(mockedPool).toHaveBeenCalledWith(`SELECT g.id, g.name FROM user_groups ug JOIN groups g ON ug.group_id = g.id WHERE ug.user_id = $1`, [1]);
      // expect(mockedPool).toHaveBeenCalledWith(`SELECT p.id, p.name FROM user_permissions up JOIN permissions p ON up.permission_id = p.id WHERE up.user_id = $1`, [1]);
      expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Internal server error.' });
      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal server error.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  
    it('should handle invalid userId format', async () => {
      // Arrange
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
  
      const targetUserId = 'invalid-id';
      const requestHeaders = {};
  
      // Act
      const response = await handleRetrieveUserGroupsAndPermissionsForUser(targetUserId, requestHeaders);
  
      // Assert
      expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
      expect(mockedPool).toHaveBeenCalledWith(`SELECT g.id, g.name FROM user_groups ug JOIN groups g ON ug.group_id = g.id WHERE ug.user_id = $1`, [NaN]); // parseInt('invalid-id') results in NaN
      // expect(mockedPool).toHaveBeenCalledWith(`SELECT p.id, p.name FROM user_permissions up JOIN permissions p ON up.permission_id = p.id WHERE up.user_id = $1`, [NaN]);
      expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Internal server error.' });
      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal server error.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  
    it('should return empty groups and permissions if user has none', async () => {
      // Arrange
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPool
        .mockResolvedValueOnce({ rows: [] }) // SELECT user groups
        .mockResolvedValueOnce({ rows: [] }); // SELECT user permissions
  
      const targetUserId = '2';
      const requestHeaders = {};
  
      // Act
      const response = await handleRetrieveUserGroupsAndPermissionsForUser(targetUserId, requestHeaders);
  
      // Assert
      expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
      expect(mockedPool).toHaveBeenCalledTimes(2);
      expect(mockedPool).toHaveBeenNthCalledWith(1, `SELECT g.id, g.name FROM user_groups ug JOIN groups g ON ug.group_id = g.id WHERE ug.user_id = $1`, [2]);
      expect(mockedPool).toHaveBeenNthCalledWith(2, `SELECT p.id, p.name FROM user_permissions up JOIN permissions p ON up.permission_id = p.id WHERE up.user_id = $1`, [2]);
  
      expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({
          groups: [],
          permissions: [],
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });
    describe('handleRetrieveUserGroupsAndPermissions', () => {
    it('should retrieve all user groups and permissions as admin', async () => {
      // Arrange
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPool
        .mockResolvedValueOnce({ rows: [{ id: 1, name: 'Admins' }, { id: 2, name: 'Users' }] }) // SELECT groups
        .mockResolvedValueOnce({ rows: [{ id: 101, name: 'Read' }, { id: 102, name: 'Write' }] }); // SELECT permissions
  
      const requestHeaders = {};
  
      // Act
      const response = await handleRetrieveUserGroupsAndPermissions(requestHeaders);
  
      // Assert
      expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
      expect(mockedPool).toHaveBeenCalledTimes(2);
      expect(mockedPool).toHaveBeenNthCalledWith(1, 'SELECT id, name FROM groups');
      expect(mockedPool).toHaveBeenNthCalledWith(2, 'SELECT id, name FROM permissions');
  
      expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({
          groups: [
            { id: 1, name: 'Admins' },
            { id: 2, name: 'Users' },
          ],
          permissions: [
            { id: 101, name: 'Read' },
            { id: 102, name: 'Write' },
          ],
        }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  
    it('should return 401 if user is not admin', async () => {
      // Arrange
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });
  
      const requestHeaders = {};
  
      // Act
      const response = await handleRetrieveUserGroupsAndPermissions(requestHeaders);
  
      // Assert
      expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
      expect(mockedPool).not.toHaveBeenCalled();
      expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'Admin privileges required to retrieve user groups and permissions.' });
      expect(response).toEqual({
        statusCode: 401,
        body: JSON.stringify({ message: 'Admin privileges required to retrieve user groups and permissions.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  
    it('should handle internal server error', async () => {
      // Arrange
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPool.mockRejectedValueOnce(new Error('Database error'));
  
      const requestHeaders = {};
  
      // Act
      const response = await handleRetrieveUserGroupsAndPermissions(requestHeaders);
  
      // Assert
      expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
      expect(mockedPool).toHaveBeenCalledWith('SELECT id, name FROM groups');
      // expect(mockedPool).toHaveBeenCalledWith('SELECT id, name FROM permissions');
      expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Internal server error.' });
      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal server error.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  
    it('should handle authentication error', async () => {
      // Arrange
      mockedAuthenticate.mockRejectedValueOnce({ statusCode: 401, message: 'Unauthorized' });
  
      const requestHeaders = {};
  
      // Act
      const response = await handleRetrieveUserGroupsAndPermissions(requestHeaders);
  
      // Assert
      expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
      expect(mockedPool).not.toHaveBeenCalled();
      expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'Unauthorized' });
      expect(response).toEqual({
        statusCode: 401,
        body: JSON.stringify({ message: 'Unauthorized' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });
  describe('handleDeletePermission', () => {
    it('should return 401 if user is not admin', async () => {
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });

      const response = await handleDeletePermission('1', {});

      expect(mockedSendResponse).toHaveBeenCalledWith(401, { message: 'Admin privileges required to delete permissions.' });
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

    describe('handleEditUserGroupsAndPermissions', () => {
    it('should successfully edit user groups and permissions as admin', async () => {
      // Arrange
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPool
        .mockResolvedValueOnce({}) // BEGIN
        .mockResolvedValueOnce({}) // DELETE FROM user_groups
        .mockResolvedValueOnce({}) // DELETE FROM user_permissions
        .mockResolvedValueOnce({ rows: [{ id: 1 }] }) // SELECT id FROM groups WHERE name = 'Admins'
        .mockResolvedValueOnce({}) // INSERT INTO user_groups
        .mockResolvedValueOnce({ rows: [{ permission_id: 101 }, { permission_id: 102 }] }) // SELECT permission_id FROM group_permissions
        .mockResolvedValueOnce({}) // INSERT INTO user_permissions (101)
        .mockResolvedValueOnce({}) // INSERT INTO user_permissions (102)
        .mockResolvedValueOnce({ rows: [{ id: 201, name: 'Read' }] }) // SELECT id FROM permissions WHERE name = 'Read'
        .mockResolvedValueOnce({}) // INSERT INTO user_permissions
        .mockResolvedValueOnce({}) // COMMIT
  
      const requestBody = '{"groups":["Admins"],"permissions":["Read"]}';
      const requestHeaders = {};
      const userId = 1;
  
      // Act
      const response = await handleEditUserGroupsAndPermissions(requestBody, requestHeaders, userId);
  
      // Assert
      expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
      expect(mockedPool).toHaveBeenCalledTimes(10);
      expect(mockedPool).toHaveBeenNthCalledWith(1, 'BEGIN');
      expect(mockedPool).toHaveBeenNthCalledWith(2, 'DELETE FROM user_groups WHERE user_id = $1', [userId]);
      expect(mockedPool).toHaveBeenNthCalledWith(3, 'DELETE FROM user_permissions WHERE user_id = $1', [userId]);
      expect(mockedPool).toHaveBeenNthCalledWith(4, 'SELECT id FROM groups WHERE name = $1', ['Admins']);
      expect(mockedPool).toHaveBeenNthCalledWith(5, 'INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2)', [userId, 1]);
      expect(mockedPool).toHaveBeenNthCalledWith(6, 'SELECT permission_id FROM group_permissions WHERE group_id = $1', [1]);
      expect(mockedPool).toHaveBeenNthCalledWith(7, 'INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, 101]);
      expect(mockedPool).toHaveBeenNthCalledWith(8, 'INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING', [userId, 102]);
      // expect(mockedPool).toHaveBeenNthCalledWith(9, 'SELECT id FROM permissions WHERE name = $1', ['Read']);
      // expect(mockedPool).toHaveBeenNthCalledWith(10, `
      //         INSERT INTO user_permissions (user_id, permission_id)
      //         SELECT $1, id FROM permissions WHERE name = $2
      //         `, [userId, 'Read']);
      expect(mockedPool).toHaveBeenNthCalledWith(10, 'COMMIT');
  
      expect(mockedSendResponse).toHaveBeenCalledWith(200, { message: 'User groups and permissions updated successfully.' });
      expect(response).toEqual({
        statusCode: 200,
        body: JSON.stringify({ message: 'User groups and permissions updated successfully.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  
    it('should return 401 if user is not admin', async () => {
      // Arrange
      mockedAuthenticate.mockResolvedValue({ isAdmin: false });
  
      const requestBody = '{"groups":["Admins"],"permissions":["upload"]}';
      const requestHeaders = {};
      const userId = 1;
  
      // Act
      const response = await handleEditUserGroupsAndPermissions(requestBody, requestHeaders, userId);
  
      // Assert
      expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
      expect(mockedPool).not.toHaveBeenCalled();
      expect(mockedSendResponse).toHaveBeenCalledWith(401, {
        message: 'Admin privileges required to edit user groups and permissions.',
      });
      expect(response).toEqual({
        statusCode: 401,
        body: JSON.stringify({ message: 'Admin privileges required to edit user groups and permissions.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  
    it('should return 400 if userId is missing', async () => {
      // Arrange
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
  
      const requestBody = JSON.stringify({
        groups: ['Admins'],
        permissions: ['Read']
      });
      const requestHeaders = {};
      const userId = 0; // Invalid userId
  
      // Act
      const response = await handleEditUserGroupsAndPermissions(requestBody, requestHeaders, userId);
  
      // Assert
      expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
      expect(mockedPool).not.toHaveBeenCalled();
      expect(mockedSendResponse).toHaveBeenCalledWith(400, { message: 'User ID is required.' });
      expect(response).toEqual({
        statusCode: 400,
        body: JSON.stringify({ message: 'User ID is required.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  
    // it('should handle invalid JSON format', async () => {
    //   // Arrange
    //   mockedAuthenticate.mockResolvedValue({ isAdmin: true });
  
    //   const requestBody = 'Invalid JSON';
    //   const requestHeaders = {};
    //   const userId = 1;
  
    //   // Act
    //   const response = await handleEditUserGroupsAndPermissions(requestBody, requestHeaders, userId);
  
    //   // Assert
    //   expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
    //   expect(mockedPool).not.toHaveBeenCalled();
    //   expect(mockedSendResponse).toHaveBeenCalledWith(400, { message: 'Unexpected token I in JSON at position 0' });
    //   expect(response).toEqual({
    //     statusCode: 400,
    //     body: JSON.stringify({ message: 'Unexpected token I in JSON at position 0' }),
    //     headers: { 'Content-Type': 'application/json' },
    //   });
    // });
  
    it('should handle internal server error during transaction', async () => {
      // Arrange
      mockedAuthenticate.mockResolvedValue({ isAdmin: true });
      mockedPool
        .mockResolvedValueOnce({}) // BEGIN
        .mockRejectedValueOnce(new Error('Database error')); // DELETE FROM user_groups
  
      const requestBody = JSON.stringify({
        groups: ['Admins'],
        permissions: ['Read']
      });
      const requestHeaders = {};
      const userId = 1;
  
      // Act
      const response = await handleEditUserGroupsAndPermissions(requestBody, requestHeaders, userId);
  
      // Assert
      expect(mockedAuthenticate).toHaveBeenCalledWith(requestHeaders);
      expect(mockedPool).toHaveBeenCalledWith('BEGIN');
      expect(mockedPool).toHaveBeenCalledWith('DELETE FROM user_groups WHERE user_id = $1', [userId]);
      expect(mockedPool).toHaveBeenCalledWith('ROLLBACK');
      expect(mockedSendResponse).toHaveBeenCalledWith(500, { message: 'Internal server error.' });
      expect(response).toEqual({
        statusCode: 500,
        body: JSON.stringify({ message: 'Internal server error.' }),
        headers: { 'Content-Type': 'application/json' },
      });
    });
  });
});