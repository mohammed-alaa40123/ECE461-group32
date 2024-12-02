import semver from 'semver';

import { APIGatewayProxyResult } from 'aws-lambda';
import pool, { getUserByName, insertIntoDB } from '../services/dbService';
import { sendResponse } from '../utils/response';
import { authenticate, AuthenticatedUser } from '../utils/auth';
import { getLogger } from '../rating/logger';
import bcrypt from 'bcrypt';
import { send } from 'process';



const logger = getLogger();

export const handleCreateGroup = async (
  body: string,
  headers: { [key: string]: string | undefined }
): Promise<APIGatewayProxyResult> => {
  console.log('body', body);
  console.log('headers', headers);
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  if (!user.isAdmin) {
    return sendResponse(403, { message: 'Admin privileges required to create groups.' });
  }

  const { name, permissions = [] } = JSON.parse(body);

  if (!name) {
    return sendResponse(400, { message: 'Group name is required.' });
  }

  try {
    // Start a transaction
    await pool.query('BEGIN');

    // Insert the group into the database
    const groupQuery = `
      INSERT INTO groups (name)
      VALUES ($1)
      RETURNING id
    `;
    const groupResult = await pool.query(groupQuery, [name]);
    const groupId = groupResult.rows[0].id;

    // Assign permissions to the group
    for (const permissionName of permissions) {
      const permissionQuery = `
        INSERT INTO group_permissions (group_id, permission_id)
        SELECT $1, id FROM permissions WHERE name = $2
      `;
      await pool.query(permissionQuery, [groupId, permissionName]);
    }

    // Commit the transaction
    await pool.query('COMMIT');

    return sendResponse(201, { message: 'Group created successfully!', groupId });
    //   statusCode: 201,
    //   body: JSON.stringify({ message: 'Group created successfully!', groupId }),
    //   headers: { 'Content-Type': 'application/json' },
    // };
  } catch (error: any) {
    // Roll back the transaction in case of an error
    await pool.query('ROLLBACK');
    console.error('Error creating group:', error);

    if (error.code === '23505') {
      return sendResponse(409, { message: 'Group already exists.' });
    }

    return sendResponse(500, { message: 'Internal server error.' });
  }
};
export const handleCreatePermission = async (body: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  if (!user.isAdmin) {
    return sendResponse(403, { message: 'Admin privileges required to create permissions.' });
  }

  const { name } = JSON.parse(body);

  if (!name) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Permission name is required.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    // Insert the permission into the database
    const permissionQuery = `
      INSERT INTO permissions (name)
      VALUES ($1)
      RETURNING id
    `;
    const permissionValues = [name];
    const permissionResult = await pool.query(permissionQuery, permissionValues);
    const permissionId = permissionResult.rows[0].id;

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'Permission created successfully!', permissionId }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error: any) {
    console.error('Error creating permission:', error);

    if (error.code === '23505') { // Unique violation error code
      return sendResponse(409, { message: 'Permission already exists.' });
      //   statusCode: 409,
      //   body: JSON.stringify({ message: 'Permission already exists.' }),
      //   headers: { 'Content-Type': 'application/json' },
      // };
    }

    return sendResponse(500, { message: 'Internal server error.' });
    //   statusCode: 500,
    //   body: JSON.stringify({ message: 'Internal server error.' }),
    //   headers: { 'Content-Type': 'application/json' },
    // };
  }
};

export const handleRegisterUser = async (
  body: string,
  headers: { [key: string]: string | undefined }
): Promise<APIGatewayProxyResult> => {
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
    console.log('User authenticated:', user);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  if (!user.isAdmin) {
    return sendResponse(403, { message: 'Admin privileges required to register users.' });
  }

  const { name, password, isAdmin = false, groups = [], permissions = [] } = JSON.parse(body);

  if (!name || !password) {
    return sendResponse(400, { message: 'Name and password are required.' });
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user into the database
    const userQuery = `
      INSERT INTO users (name, password_hash, is_admin)
      VALUES ($1, $2, $3)
      RETURNING id
    `;
    const userValues = [name, hashedPassword, isAdmin];
    const userResult = await pool.query(userQuery, userValues);
    const userId = userResult.rows[0].id;

    // Assign all permissions if the user is an admin
    if (isAdmin) {
      const allPermissionsQuery = 'SELECT id FROM permissions';
      const allPermissionsResult = await pool.query(allPermissionsQuery);
      const allPermissions = allPermissionsResult.rows.map((row) => row.id);

      // Assign all permissions to the user
      for (const permissionId of allPermissions) {
        const permissionQuery = `
          INSERT INTO user_permissions (user_id, permission_id)
          VALUES ($1, $2)
        `;
        await pool.query(permissionQuery, [userId, permissionId]);
      }

      // Add the user to the "admins" group
      const adminGroupQuery = `
        INSERT INTO user_groups (user_id, group_id)
        SELECT $1, id FROM groups WHERE name = 'admins'
      `;
      await pool.query(adminGroupQuery, [userId]);
    } else {
      // Insert user groups and assign group permissions
      for (const groupName of groups) {
        const groupResult = await pool.query('SELECT id FROM groups WHERE name = $1', [groupName]);
        if (groupResult.rows.length > 0) {
          const groupId = groupResult.rows[0].id;

          // Insert into user_groups
          const groupQuery = `
            INSERT INTO user_groups (user_id, group_id)
            VALUES ($1, $2)
          `;
          await pool.query(groupQuery, [userId, groupId]);

          // Fetch permissions associated with the group
          const groupPermissionsResult = await pool.query(
            'SELECT permission_id FROM group_permissions WHERE group_id = $1',
            [groupId]
          );
          const groupPermissionIds = groupPermissionsResult.rows.map((row) => row.permission_id);

          // Assign group permissions to the user
          for (const permissionId of groupPermissionIds) {
            const userPermissionQuery = `
              INSERT INTO user_permissions (user_id, permission_id)
              VALUES ($1, $2)
              ON CONFLICT DO NOTHING
            `;
            await pool.query(userPermissionQuery, [userId, permissionId]);
          }
        } else {
          console.warn(`Group "${groupName}" does not exist.`);
        }
      }

      // Insert user permissions
      for (const permissionName of permissions) {
        const permissionResult = await pool.query('SELECT id FROM permissions WHERE name = $1', [permissionName]);
        if (permissionResult.rows.length > 0) {
          const permissionId = permissionResult.rows[0].id;

          const permissionQuery = `
            INSERT INTO user_permissions (user_id, permission_id)
            VALUES ($1, $2)
            ON CONFLICT DO NOTHING
          `;
          await pool.query(permissionQuery, [userId, permissionId]);
        } else {
          console.warn(`Permission "${permissionName}" does not exist.`);
        }
      }
    }

    return sendResponse(201, { message: 'User registered successfully!' });
  } catch (error: any) {
    console.error('Error registering user:', error);

    if (error.code === '23505') {
      return sendResponse(409, { message: 'User already exists.' });
    }

    return sendResponse(500, { message: 'Internal server error.' });
  }
};    
  export const handleDeleteUser = async (id: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
    let user: AuthenticatedUser;
    try {
      user = await authenticate(headers);
    } catch (err: any) {
      return sendResponse(err.statusCode, { message: err.message });
    }
  
    if (!user.isAdmin) {
      return sendResponse(403, { message: 'Admin privileges required to delete users.' });
    }
  
    try {
      const deleteUserQuery = 'DELETE FROM users WHERE id = $1 RETURNING *';
      const res = await pool.query(deleteUserQuery, [id]);
  
      if (res.rows.length === 0) {
        return sendResponse(404, { message: 'User does not exist.' });
      }
  
      return sendResponse(200, { message: 'User deleted successfully.' });
    } catch (error: any) {
      console.error('Error deleting user:', error);
      return sendResponse(500, { message: 'Internal server error.' });
    }
  };
  
  export const handleDeleteGroup = async (id: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
    let user: AuthenticatedUser;
    try {
      user = await authenticate(headers);
    } catch (err: any) {
      return sendResponse(err.statusCode, { message: err.message });
    }
  
    if (!user.isAdmin) {
      return sendResponse(403, { message: 'Admin privileges required to delete groups.' });
    }
  
    try {
      const deleteGroupQuery = 'DELETE FROM groups WHERE id = $1 RETURNING *';
      const res = await pool.query(deleteGroupQuery, [id]);
  
      if (res.rows.length === 0) {
        return sendResponse(404, { message: 'Group does not exist.' });
      }
  
      return sendResponse(200, { message: 'Group deleted successfully.' });
    } catch (error: any) {
      console.error('Error deleting group:', error);
      return sendResponse(500, { message: 'Internal server error.' });
    }
  };
  
  export const handleDeletePermission = async (id: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
    let user: AuthenticatedUser;
    try {
      user = await authenticate(headers);
    } catch (err: any) {
      return sendResponse(err.statusCode, { message: err.message });
    }
  
    if (!user.isAdmin) {
      return sendResponse(403, { message: 'Admin privileges required to delete permissions.' });
    }
  
    try {
      const deletePermissionQuery = 'DELETE FROM permissions WHERE id = $1 RETURNING *';
      const res = await pool.query(deletePermissionQuery, [id]);
  
      if (res.rows.length === 0) {
        return sendResponse(404, { message: 'Permission does not exist.' });
      }
  
      return sendResponse(200, { message: 'Permission deleted successfully.' });
    } catch (error: any) {
      console.error('Error deleting permission:', error);
      return sendResponse(500, { message: 'Internal server error.' });
    }
  };
  
  
export const handleEditUserGroupsAndPermissions = async (
  body: string,
  headers: { [key: string]: string | undefined },
  userId: number
): Promise<APIGatewayProxyResult> => {
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  if (!user.isAdmin) {
    return sendResponse(403, {
      message: 'Admin privileges required to edit user groups and permissions.',
    });
  }

  const { groups = [], permissions = [] } = JSON.parse(body);

  if (!userId) {
    return sendResponse(400, { message: 'User ID is required.' });
  }

  try {
    // Start a transaction
    await pool.query('BEGIN');

    // Clear existing groups and permissions
    await pool.query('DELETE FROM user_groups WHERE user_id = $1', [userId]);
    await pool.query('DELETE FROM user_permissions WHERE user_id = $1', [userId]);

    // Assign new groups
    for (const groupName of groups) {
      const groupResult = await pool.query('SELECT id FROM groups WHERE name = $1', [groupName]);
      if (groupResult.rows.length > 0) {
        const groupId = groupResult.rows[0].id;
        await pool.query('INSERT INTO user_groups (user_id, group_id) VALUES ($1, $2)', [userId, groupId]);

        // Optionally assign the group's permissions to the user
        const permissionsResult = await pool.query(
          'SELECT permission_id FROM group_permissions WHERE group_id = $1',
          [groupId]
        );
        const permissionIds = permissionsResult.rows.map((row) => row.permission_id);

        for (const permissionId of permissionIds) {
          await pool.query(
            'INSERT INTO user_permissions (user_id, permission_id) VALUES ($1, $2) ON CONFLICT DO NOTHING',
            [userId, permissionId]
          );
        }
      }
    }

    // Assign new permissions
    for (const permissionName of permissions) {
      await pool.query(
        `
        INSERT INTO user_permissions (user_id, permission_id)
        SELECT $1, id FROM permissions WHERE name = $2
        `,
        [userId, permissionName]
      );
    }

    // Commit the transaction
    await pool.query('COMMIT');

    return sendResponse(200, { message: 'User groups and permissions updated successfully.' });
  } catch (error: any) {
    // Roll back the transaction in case of an error
    await pool.query('ROLLBACK');
    console.error('Error updating user groups and permissions:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

export const handleRetrieveUserGroupsAndPermissions = async (headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  if (!user.isAdmin) {
    return sendResponse(403, { message: 'Admin privileges required to retrieve user groups and permissions.' });
  }

  try {
    // Fetch all groups
    const groupsQuery = 'SELECT id, name FROM groups';
    const groupsResult = await pool.query(groupsQuery);
    const groups = groupsResult.rows;

    // Fetch all permissions
    const permissionsQuery = 'SELECT id, name FROM permissions';
    const permissionsResult = await pool.query(permissionsQuery);
    const permissions = permissionsResult.rows;

    return {
      statusCode: 200,
      body: JSON.stringify({ groups, permissions }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error: any) {
    console.error('Error retrieving user groups and permissions:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};


export const handleRetrieveUserGroupsAndPermissionsForUser = async (userId: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  if (!user.isAdmin) {
    return sendResponse(403, { message: 'Admin privileges required to retrieve user groups and permissions.' });
  }
  const userIdINT= parseInt(userId);
  try {
    // Fetch groups for the user
    const userGroupsQuery = `SELECT g.id, g.name FROM user_groups ug JOIN groups g ON ug.group_id = g.id WHERE ug.user_id = $1`;
    const userGroupsResult = await pool.query(userGroupsQuery, [userIdINT]);
    const userGroups = userGroupsResult.rows;

    // Fetch permissions for the user
    const userPermissionsQuery = `SELECT p.id, p.name FROM user_permissions up JOIN permissions p ON up.permission_id = p.id WHERE up.user_id = $1`;
    const userPermissionsResult = await pool.query(userPermissionsQuery, [userIdINT]);
    const userPermissions = userPermissionsResult.rows;

    return {
      statusCode: 200,
      body: JSON.stringify({ userGroups, userPermissions }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error: any) {
    console.error('Error retrieving user groups and permissions:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};