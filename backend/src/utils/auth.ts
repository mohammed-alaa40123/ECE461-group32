// src/utils/auth.ts

import jwt from 'jsonwebtoken';
import pool from '../services/dbService';

export interface AuthenticatedUser {
  sub: number;
  name: string;
  isAdmin: boolean;
  permissions: string[];
  groups: string[];
  iat: number;
  exp: number;
}

export const authenticate = async (headers: { [key: string]: string | undefined }): Promise<AuthenticatedUser> => {
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

    const adminQuery = 'SELECT is_admin FROM users WHERE id = $1';
    const adminResult = await pool.query(adminQuery, [decoded.sub]);
    decoded.isAdmin = adminResult.rows[0].is_admin;
    
    // Fetch user groups and permissions
    const groupsQuery = `
      SELECT g.name
      FROM user_groups ug
      JOIN groups g ON ug.group_id = g.id
      WHERE ug.user_id = $1
    `;
    const groupsResult = await pool.query(groupsQuery, [decoded.sub]);
    decoded.groups = groupsResult.rows.map(row => row.name);

    const permissionsQuery = `
      SELECT p.name
      FROM user_permissions up
      JOIN permissions p ON up.permission_id = p.id
      WHERE up.user_id = $1
    `;
    const permissionsResult = await pool.query(permissionsQuery, [decoded.sub]);
    decoded.permissions = permissionsResult.rows.map(row => row.name);

    return decoded;
  } catch (err) {
    throw { statusCode: 403, message: 'Invalid Authentication Token' };
  }
};