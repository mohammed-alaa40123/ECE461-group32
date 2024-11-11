// src/index.ts
import dotenv from 'dotenv';
dotenv.config();

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
  handleRegisterUser,
} from './handlers/handlers';

export const handler = async (event: APIGatewayProxyEvent): Promise<APIGatewayProxyResult> => {
  const { httpMethod, path, pathParameters, queryStringParameters, headers, body } = event;
  // console.log(`Received event: ${JSON.stringify(event)}`)
  try {
    // Routing logic based on path and method
    if (path === '/register' && httpMethod === 'POST') {
      return await handleRegisterUser(body || '{}');
    } else if (path === '/authenticate' && httpMethod === 'PUT') {
      return await handleAuthenticate(body || '{}');
    } else if (path === '/packages' && httpMethod === 'POST') {
      return await handleListPackages(body || '[]', headers, queryStringParameters || {});
    } else if (path === '/reset' && httpMethod === 'DELETE') {
      return await handleResetRegistry(headers);
    } else if (path === '/package/byRegEx' && httpMethod === 'POST') {
      return await handleSearchPackagesByRegEx(body || '{}', headers);
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
    }

    // If no route matched
    return {
      statusCode: 404,
      body: JSON.stringify({ message: 'Endpoint not found.' }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  } catch (error: any) {
    console.error('Lambda Handler Error:', error);
    if (error.statusCode && error.message) {
      return {
        statusCode: error.statusCode,
        body: JSON.stringify({ message: error.message }),
        headers: {
          'Content-Type': 'application/json',
        },
      };
    }
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error.' }),
      headers: {
        'Content-Type': 'application/json',
      },
    };
  }
};
