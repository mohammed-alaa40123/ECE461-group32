// src/index.ts
/**
 * @file index.ts
 * @description
 * Entry point for the AWS Lambda functions managing package-related operations.
 * 
 * This file initializes environment variables, imports utility functions and AWS Lambda handler functions,
 * and exports them for deployment. It serves as the main orchestrator, directing incoming API Gateway events
 * to the appropriate handler functions based on the requested operation.
 *
 * @imports
 * - `dotenv`: Loads environment variables from a `.env` file into `process.env` for configuration management.
 * - `sendResponse`: Utility function for formatting and sending HTTP responses.
 * - AWS Lambda types (`APIGatewayProxyEvent`, `APIGatewayProxyResult`): Provides TypeScript types for Lambda event handling.
 * - Handler functions (`handleAuthenticate`, `handleCreatePackage`, `handleRetrievePackage`, `handleUpdatePackage`, 
 *   `handleDeletePackage`, `handleListPackages`, `handleResetRegistry`, `handleGetPackageHistoryByName`, 
 *   `handleSearchPackagesByRegEx`, `handleGetPackageRating`, `handleGetPackageCost`, `handleGetTracks`, 
 *   `handleExecuteSQL`): Various handlers managing different API endpoints related to package operations.
 *
 * @exports
 * - `authenticate`: Handles user authentication requests.
 * - `createPackage`: Manages the creation of new packages.
 * - `retrievePackage`: Retrieves details of a specific package by ID.
 * - `updatePackage`: Updates information of an existing package.
 * - `deletePackage`: Deletes a package by its ID.
 * - `listPackages`: Lists packages based on query parameters with pagination support.
 * - `resetRegistry`: Resets the package registry to its default state.
 * - `getPackageHistoryByName`: Retrieves the history of a package by its name.
 * - `searchPackagesByRegEx`: Searches for packages matching a provided regular expression.
 * - `getPackageRating`: Retrieves the rating of a specific package.
 * - `getPackageCost`: Retrieves the cost associated with a specific package.
 * - `getTracks`: Retrieves tracking information for packages.
 * - `executeSQL`: Executes arbitrary SQL commands for advanced database operations.
 *
 * @example
 * Exporting a handler function to AWS Lambda:
 * ```typescript
 * import { handleCreatePackage } from './handlers/handlers';
 * 
 * export const createPackage = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
 *   return await handleCreatePackage(event);
 * };
 * ```
 *
 * @dependencies
 * - `dotenv`: For environment variable management.
 * - `aws-lambda`: AWS Lambda event and response types.
 * - `./utils/response`: Utility functions for formatting responses.
 * - `./handlers/handlers`: Collection of handler functions for various API endpoints.
 *
 * @author
 * Mohamed Ahmed
 * @date
 * 2024-12-7
 */
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
  const { httpMethod, path, queryStringParameters, headers, body } = event;
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