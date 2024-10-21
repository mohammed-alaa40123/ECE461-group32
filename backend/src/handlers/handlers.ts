// src/handlers/handlers.ts

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import pool, { getUserByName, createPackage } from '../services/dbService';
import { uploadPackageContent, getPackageContent, deletePackageContent } from '../services/s3Service';
import { Package, PackageMetadata, PackageData } from '../models/Package';
import { PackageHistoryEntry } from '../models/PackageHistoryEntry';
import { PackageRating } from '../models/PackageRating';
import { sendResponse } from '../utils/response';
import { authenticate, AuthenticatedUser } from '../utils/auth';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';




// Handler for /authenticate - PUT
export const handleAuthenticate = async (body: string): Promise<APIGatewayProxyResult> => {
  const { User, Secret } = JSON.parse(body);
  const { name, isAdmin } = User;
  const { password } = Secret;

  if (!name || typeof isAdmin !== 'boolean' || !password) {
    return sendResponse(400, { message: 'Missing fields in AuthenticationRequest' });
  }

  try {
    // Fetch user from DB
    const user = await getUserByName(name);
    if (!user) {
      return sendResponse(401, { message: 'Invalid user or password.' });
    }

    // Compare password
    const isMatch = await bcrypt.compare(password, user.password_hash);
    if (!isMatch) {
      return sendResponse(401, { message: 'Invalid user or password.' });
    }
    // Generate JWT
    const token = jwt.sign(
      { sub: user.id, name: user.name, isAdmin: user.isAdmin },
      process.env.JWT_SECRET!,
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
    );

    return sendResponse(200, { token: `bearer ${token}` });
  } catch (error) {
    console.error('Authentication Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

// Handler for /package - POST (Create Package)
export const handleCreatePackage = async (body: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser = {
    sub: 5445,
    name: "admin",
    isAdmin: true,
    iat: 545,
    exp: 45
  };
  // try {
  //   user = authenticate(headers);
  // } catch (err: any) {
  //   return sendResponse(err.statusCode, { message: err.message });
  // }
  const packageData: Package = JSON.parse(body);
  const { metadata, data } = packageData;

  // Validate required fields
  if (!metadata || !metadata.Name || !metadata.Version || !metadata.ID) {
    return sendResponse(400, { message: 'Missing required package metadata fields.' });
  }

  // Validate PackageData union type
  if ((data.Content && data.URL) || (!data.Content && !data.URL)) {
    return sendResponse(400, { message: 'Either Content or URL must be set, but not both.' });
  }

  try {
    // Insert package into PostgreSQL
    const createdPackage = await createPackage(metadata, data);

    // If Content is provided, upload to S3
    if (data.Content) {
      await uploadPackageContent(metadata.ID, data.Content);
    }

    // Log the creation in package_history
    const historyInsert = `
      INSERT INTO package_history (package_id, user_id, action)
      VALUES ($1, $2, $3)
    `;
    await pool.query(historyInsert, [metadata.ID, user.sub, 'CREATE']);

    return sendResponse(201, createdPackage);
  } catch (error: any) {
    console.error('Create Package Error:', error);
    if (error.code === '23505') { // Unique violation
      return sendResponse(409, { message: 'Package exists already.' });
    }
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

// Handler for /package/{id} - GET (Retrieve Package)
export const handleRetrievePackage = async (id: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  try {
    const queryText = 'SELECT * FROM packages WHERE id = $1';
    const res = await pool.query(queryText, [id]);

    if (res.rows.length === 0) {
      return sendResponse(404, { message: 'Package does not exist.' });
    }
    
    const packageData: Package = res.rows[0];
    console.log(res.rows[0]);
    // If Content is null and URL is null, retrieve from S3
    if (!packageData.data.Content && !packageData.data.URL) {
      try {
        const content = await getPackageContent(id);
        packageData.data.Content = content;
      } catch (s3Error) {
        console.error('S3 Retrieval Error:', s3Error);
        return sendResponse(500, { message: 'Failed to retrieve package content.' });
      }
    }

    // Log the retrieval in package_history
    const historyInsert = `
      INSERT INTO package_history (package_id, user_id, action)
      VALUES ($1, $2, $3)
    `;
    await pool.query(historyInsert, [id, user.sub, 'DOWNLOAD']);

    return sendResponse(200, packageData);
  } catch (error) {
    console.error('Retrieve Package Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

// Handler for /package/{id} - PUT (Update Package)
export const handleUpdatePackage = async (id: string, body: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  const updatedPackage: Package = JSON.parse(body);
  const { metadata, data } = updatedPackage;

  // Ensure the name, version, and ID match
  if (metadata.ID !== id) {
    return sendResponse(400, { message: 'Metadata ID does not match the path ID.' });
  }

  try {
    // Update package data in PostgreSQL
    const updateFields: string[] = [];
    const updateValues: any[] = [];
    let idx = 1;

    if (data.Content) {
      updateFields.push(`content = $${idx++}`);
      updateValues.push(data.Content);
    } else if (data.URL) {
      updateFields.push(`url = $${idx++}`);
      updateValues.push(data.URL);
    }

    updateFields.push(`debloat = $${idx++}`);
    updateValues.push(data.debloat || false);

    if (data.JSProgram) {
      updateFields.push(`js_program = $${idx++}`);
      updateValues.push(data.JSProgram);
    }

    updateFields.push(`updated_at = NOW()`);

    const updateText = `UPDATE packages SET ${updateFields.join(', ')} WHERE id = $${idx} RETURNING *`;
    updateValues.push(id);

    const res = await pool.query(updateText, updateValues);

    if (res.rows.length === 0) {
      return sendResponse(404, { message: 'Package does not exist.' });
    }

    const updatedPkg = res.rows[0];

    // If Content is provided, upload to S3
    if (data.Content) {
      await uploadPackageContent(id, data.Content);
    }

    // Log the update in package_history
    const historyInsert = `
      INSERT INTO package_history (package_id, user_id, action)
      VALUES ($1, $2, $3)
    `;
    await pool.query(historyInsert, [id, user.sub, 'UPDATE']);

    return sendResponse(200, updatedPkg);
  } catch (error) {
    console.error('Update Package Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

// Handler for /package/{id} - DELETE (Delete Package)
export const handleDeletePackage = async (id: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  try {
    const deleteText = 'DELETE FROM packages WHERE id = $1 RETURNING *';
    const res = await pool.query(deleteText, [id]);

    if (res.rows.length === 0) {
      return sendResponse(404, { message: 'Package does not exist.' });
    }

    const deletedPackage: Package = res.rows[0];

    // Delete from S3 if Content is present
    if (deletedPackage.data.Content) {
      await deletePackageContent(id);
    }

    // Log the deletion in package_history
    const historyInsert = `
      INSERT INTO package_history (package_id, user_id, action)
      VALUES ($1, $2, $3)
    `;
    await pool.query(historyInsert, [id, user.sub, 'DELETE']);

    return sendResponse(200, { message: 'Package is deleted.' });
  } catch (error) {
    console.error('Delete Package Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

// Handler for /packages - GET (List Packages)
export const handleListPackages = async (body: string, headers: { [key: string]: string | undefined }, queryStringParameters: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
let user: AuthenticatedUser = {
    sub: 5445,
    name: "admin",
    isAdmin: true,
    iat: 545,
    exp: 45
  };
  // try {
  //   user = authenticate(headers);
  // } catch (err: any) {
  //   return sendResponse(err.statusCode, { message: err.message });
  // }

  const queries = JSON.parse(body); // Array of PackageQuery
  const offset = queryStringParameters && queryStringParameters.offset ? parseInt(queryStringParameters.offset) : 0;
  const limit = 10; // Define your page size

  if (!Array.isArray(queries)) {
    return sendResponse(400, { message: 'Request body must be an array of PackageQuery.' });
  }

  try {
    const results: Package[] = [];
    for (const query of queries) {
      const { Name, Version } = query;

      // Validate PackageQuery
      if (!Name) {
        return sendResponse(400, { message: 'PackageQuery must include Name.' });
      }

      // Build SQL query based on PackageQuery
      let sql = 'SELECT * FROM packages WHERE name ILIKE $1';
      const values = [`%${Name}%`];

      if (Version) {
        sql += ' AND version = $2';
        values.push(Version);
      }

      const packageResult = await pool.query(sql, values);
      results.push(...packageResult.rows);
    }

    // Pagination
    const paginatedResults = results.slice(offset, offset + limit);
    const nextOffset = offset + limit < results.length ? offset + limit : null;

    const responseHeaders: { [key: string]: string } = {};
    if (nextOffset !== null) {
      responseHeaders['offset'] = nextOffset.toString();
    }

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(paginatedResults),
    };
  } catch (error: any) {
    console.error('List Packages Error:', error);
    if (error.message.includes('too many')) { // Example condition
      return sendResponse(413, { message: 'Too many packages returned.' });
    }
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

// Handler for /reset - DELETE
export const handleResetRegistry = async (headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = authenticate(headers);
    if (!user.isAdmin) {
      return sendResponse(403, { message: 'Admin privileges required.' });
    }
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  try {
    // Reset the registry to default state
    await pool.query('TRUNCATE TABLE packages CASCADE;');
    await pool.query('TRUNCATE TABLE package_history CASCADE;');
    // Insert default data as needed

    return sendResponse(200, { message: 'Registry is reset.' });
  } catch (error: any) {
    console.error('Reset Registry Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

// Handler for /package/byName/{name} - GET (Package History by Name)
export const handleGetPackageHistoryByName = async (name: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  try {
    const historyQuery = `
      SELECT ph.*, u.name as user_name, u.is_admin
      FROM package_history ph
      JOIN packages p ON ph.package_id = p.id
      JOIN users u ON ph.user_id = u.id
      WHERE p.name ILIKE $1
      ORDER BY ph.date DESC
    `;
    const historyResult = await pool.query(historyQuery, [`%${name}%`]);

    if (historyResult.rows.length === 0) {
      return sendResponse(404, { message: 'No such package.' });
    }

    // Format the response as per PackageHistoryEntry
    const historyEntries: PackageHistoryEntry[] = historyResult.rows.map(entry => ({
      User: {
        name: entry.user_name,
        isAdmin: entry.is_admin,
      },
      Date: entry.date.toISOString(),
      PackageMetadata: {
        Name: entry.name,
        Version: entry.version,
        ID: entry.package_id,
      },
      Action: entry.action,
    }));

    return sendResponse(200, historyEntries);
  } catch (error) {
    console.error('Get Package History Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

// Handler for /package/byRegEx - POST (Search Packages by RegEx)
export const handleSearchPackagesByRegEx = async (body: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  const { RegEx } = JSON.parse(body);

  if (!RegEx) {
    return sendResponse(400, { message: 'Missing RegEx field in PackageRegEx.' });
  }

  try {
    // Use PostgreSQL regex matching on name and README (assuming README is a field)
    const searchQuery = `
      SELECT * FROM packages
      WHERE name ~* $1 OR readme ~* $1
    `;
    const res = await pool.query(searchQuery, [RegEx]);

    if (res.rows.length === 0) {
      return sendResponse(404, { message: 'No package found under this regex.' });
    }

    const packages = res.rows.map(pkg => ({
      Version: pkg.version,
      Name: pkg.name,
      ID: pkg.id,
    }));

    return sendResponse(200, packages);
  } catch (error) {
    console.error('Search Packages Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

// Handler for /package/{id}/rate - GET (Get Package Rating)
export const handleGetPackageRating = async (id: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  try {
    const ratingQuery = 'SELECT * FROM package_ratings WHERE package_id = $1';
    const res = await pool.query(ratingQuery, [id]);

    if (res.rows.length === 0) {
      return sendResponse(500, { message: 'The package rating system choked on at least one of the metrics.' });
    }

    const rating: PackageRating = res.rows[0];
    return sendResponse(200, rating);
  } catch (error) {
    console.error('Get Package Rating Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

// Handler for /package/{id}/cost - GET (Get Package Cost)
export const handleGetPackageCost = async (id: string, headers: { [key: string]: string | undefined }, queryStringParameters: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  const dependency = queryStringParameters && queryStringParameters.dependency === 'true';

  try {
    // Fetch package and its dependencies
    const costQuery = `
      SELECT p.id, p.name, p.version, p.size_mb
      FROM packages p
      WHERE p.id = $1
    `;
    const costResult = await pool.query(costQuery, [id]);

    if (costResult.rows.length === 0) {
      return sendResponse(404, { message: 'Package does not exist.' });
    }

    const packageCosts: { [key: string]: { standaloneCost?: number; totalCost: number } } = {};
    let totalCost = 0;

    const stack = [id];
    const visited = new Set<string>();

    while (stack.length > 0) {
      const currentId = stack.pop()!;
      if (visited.has(currentId)) continue;
      visited.add(currentId);

      const pkgQuery = 'SELECT * FROM packages WHERE id = $1';
      const pkgResult = await pool.query(pkgQuery, [currentId]);

      if (pkgResult.rows.length === 0) continue;

      const pkg = pkgResult.rows[0];
      packageCosts[pkg.id] = {
        standaloneCost: pkg.size_mb,
        totalCost: pkg.size_mb, // Will be updated if dependencies are included
      };
      totalCost += pkg.size_mb;

      if (dependency) {
        // Fetch dependencies from a hypothetical 'dependencies' table
        const depQuery = 'SELECT dependency_id FROM dependencies WHERE package_id = $1';
        const depResult = await pool.query(depQuery, [currentId]);
        depResult.rows.forEach(dep => {
          if (!visited.has(dep.dependency_id)) {
            stack.push(dep.dependency_id);
            totalCost += dep.size_mb; // Assuming size_mb is available
          }
        });
      }
    }

    if (dependency) {
      // Sum up total costs including dependencies
      let cumulativeCost = 0;
      for (const pkgId in packageCosts) {
        cumulativeCost += packageCosts[pkgId].standaloneCost || 0;
        packageCosts[pkgId].totalCost = cumulativeCost;
      }
    } else {
      // Total cost is standalone
      packageCosts[id].totalCost = packageCosts[id].standaloneCost || 0;
    }

    return sendResponse(200, packageCosts);
  } catch (error) {
    console.error('Get Package Cost Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

// Handler for /tracks - GET (Get Planned Tracks)
export const handleGetTracks = async (headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  try {
    // Fetch planned tracks for the user
    // Assuming a 'user_tracks' table mapping user_id to tracks
    const tracksQuery = `
      SELECT t.track_name
      FROM user_tracks ut
      JOIN tracks t ON ut.track_id = t.id
      WHERE ut.user_id = $1
    `;
    const res = await pool.query(tracksQuery, [user.sub]);

    const plannedTracks: string[] = res.rows.map(row => row.track_name);

    return sendResponse(200, { plannedTracks });
  } catch (error) {
    console.error('Get Tracks Error:', error);
    return sendResponse(500, { message: 'The system encountered an error while retrieving the student\'s track information.' });
  }
};
