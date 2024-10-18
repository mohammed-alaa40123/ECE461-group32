// src/utils/auth.ts

import jwt from 'jsonwebtoken';

export interface AuthenticatedUser {
  sub: number;
  name: string;
  isAdmin: boolean;
  iat: number;
  exp: number;
}

export const authenticate = (headers: { [key: string]: string | undefined }): AuthenticatedUser => {
  const authHeader = headers['X-Authorization'] || headers['x-authorization'];
  if (!authHeader) {
    throw { statusCode: 403, message: 'Missing Authentication Token' };
  }

  const tokenParts = authHeader.split(' ');
  if (tokenParts.length !== 2 || tokenParts[0].toLowerCase() !== 'bearer') {
    throw { statusCode: 403, message: 'Invalid Authentication Token' };
  }

  const token = tokenParts[1];
  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as unknown as AuthenticatedUser;
    return decoded;
  } catch (err) {
    throw { statusCode: 403, message: 'Invalid Authentication Token' };
  }
};
