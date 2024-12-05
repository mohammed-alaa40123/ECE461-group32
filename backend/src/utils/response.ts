// src/utils/response.ts

export const sendResponse = (statusCode: number, body: any) => {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
        'Access-Control-Allow-Headers': 'Content-Type, X-Authorization, X-Amz-Date, X-Api-Key, X-Amz-Security-Token',
      },
      body: JSON.stringify(body),
    };
  };
  