// src/index.ts
import dotenv from 'dotenv';
dotenv.config();
import { sendResponse } from './utils/response';
import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import {
  handleAuthenticate,
  handleCreatePackage,
  handleRetrievePackage,
  handleUpdatePackage,
  handleDeletePackage,
  handleListPackages,
  handleResetRegistry,
  handleGetPackageHistoryByName,
  handleSearchPackagesByRegEx,
  handleGetPackageRating,
  handleGetPackageCost,
  handleGetTracks,
  handleExecuteSQL,
} from './handlers/handlers';

import {
  handleRegisterUser,
  handleCreateGroup,
  handleCreatePermission,
  handleDeleteUser,
  handleDeleteGroup,
  handleDeletePermission,
  handleEditUserGroupsAndPermissions,
  handleRetrieveUserGroupsAndPermissions,
  handleRetrieveUserGroupsAndPermissionsForUser
} from './handlers/access_handlers';


export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path, pathParameters, queryStringParameters, headers, body } = event;
  // console.log(`Received event: ${JSON.stringify(event)}`)
  try {
    // Routing logic based on path and method
    if (path === '/register' && httpMethod === 'POST') {
      return await handleRegisterUser(body || '{}', headers);
    } else if (path === '/sql' && httpMethod === 'POST') {
      return await handleExecuteSQL(body || '{}', headers);
    } else if (path === '/authenticate' && httpMethod === 'PUT') {
      return await handleAuthenticate(body || '{}');
    } else if (path === '/authenticate2' && httpMethod === 'PUT') {
      return await handleAuthenticate(body || '{}');
    }
    else if (path === '/tracks' && httpMethod === 'GET') {
      return await handleGetTracks(body || '{}');
    } else if (path === '/packages' && httpMethod === 'POST') {
      return await handleListPackages(body || '[]', headers, queryStringParameters || {});
    } else if (path === '/reset' && httpMethod === 'DELETE') {
      return await handleResetRegistry(headers);
    } else if (path === '/package/byRegEx' && httpMethod === 'POST') {
      try{
      return await handleSearchPackagesByRegEx(body || '{}', headers);}
      catch{
        return sendResponse(200, []);
      }
    } else if (path && path.startsWith('/package/byName/') && httpMethod === 'GET') {
      const name = path.split('/').pop() || '';
      return await handleGetPackageHistoryByName(name, headers);
    } else if (path === '/package' && httpMethod === 'POST') {
      return await handleCreatePackage(body || '{}', headers);
    } else if (path && path.startsWith('/package/') && path.endsWith('/rate') && httpMethod === 'GET') {
      const id = path.split('/')[2];
      return await handleGetPackageRating(id, headers);
    } else if (path && path.startsWith('/package/') && path.endsWith('/cost') && httpMethod === 'GET') {
      const id = path.split('/')[2];
      return await handleGetPackageCost(id, headers, queryStringParameters || {});
    } else if (path && path.startsWith('/package/') && httpMethod === 'GET') {
      const id = path.split('/')[2];
      return await handleRetrievePackage(id, headers);
    } else if (path && path.startsWith('/package/') && httpMethod === 'POST') {
      const id = path.split('/')[2];
      return await handleUpdatePackage(id, body || '{}', headers);
    } else if (path && path.startsWith('/package/') && httpMethod === 'DELETE') {
      const id = path.split('/')[2];
      return await handleDeletePackage(id, headers);
    } else if (path === '/tracks' && httpMethod === 'GET') {
      return await handleGetTracks(headers);
    } else if (path === '/groups' && httpMethod === 'POST') {
      return await handleCreateGroup(body || '{}', headers);
    } else if (path === '/permissions' && httpMethod === 'POST') {
      return await handleCreatePermission(body || '{}', headers);
    } else if (path && path.startsWith('/users/') && path.endsWith('/edit') && httpMethod === 'PUT') {
      const userId = path.split('/')[2];
      const userIDINT = parseInt(userId);
      return await handleEditUserGroupsAndPermissions(body || '{}', headers,userIDINT);
    } else if (path === '/users/groups-permissions' && httpMethod === 'GET') {
      return await handleRetrieveUserGroupsAndPermissions(headers);
    } else if (path && path.startsWith('/users/') && path.endsWith('/groups-permissions') && httpMethod === 'GET') {
      const userId = path.split('/')[2];
      return await handleRetrieveUserGroupsAndPermissionsForUser(userId, headers);
    } else if (path && path.startsWith('/users/') && httpMethod === 'DELETE') {
      const userId = path.split('/')[2];
      return await handleDeleteUser(userId, headers);
    } else if (path && path.startsWith('/groups/') && httpMethod === 'DELETE') {
      const groupId = path.split('/')[2];
      return await handleDeleteGroup(groupId, headers);
    } else if (path && path.startsWith('/permissions/') && httpMethod === 'DELETE') {
      const permissionId = path.split('/')[2];
      return await handleDeletePermission(permissionId, headers);
    } else {
      return {
        statusCode: 404,
        body: JSON.stringify({ message: 'Not Found' }),
        headers: { 'Content-Type': 'application/json' },
      };
    }
  } catch (error) {
    console.error('Error handling request:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }
};