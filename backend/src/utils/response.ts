// src/utils/response.ts

export const sendResponse = (statusCode: number, body: any) => {
    return {
      statusCode,
      headers: {
        'Content-Type': 'application/json',
        'Access-Control-Allow-Origin': 'https://ece-461group32-frontend.vercel.app',
        'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
      },
      body: JSON.stringify(body),
    };
  };
  