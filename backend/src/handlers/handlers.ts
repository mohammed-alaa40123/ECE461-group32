// src/handlers/handlers.ts
import semver from 'semver';

import { APIGatewayProxyEvent, APIGatewayProxyResult } from 'aws-lambda';
import pool, { getUserByName, insertIntoDB } from '../services/dbService';
import { uploadPackageContent, getPackageContent, deletePackageContent } from '../services/s3Service';
import { Package, PackageMetadata, PackageData } from '../models/Package';
import { PackageHistoryEntry } from '../models/PackageHistoryEntry';
import { PackageRating } from '../models/PackageRating';
import { sendResponse } from '../utils/response';
import { authenticate, AuthenticatedUser } from '../utils/auth';
import { metricCalcFromUrlUsingNetScore, convertPackageInfo, PackageInfo, generatePackageId } from '../handlerhelper';
import { getLogger, logTestResults } from '../rating/logger';
import AdmZip, { IZipEntry } from 'adm-zip';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { send } from 'process';



const logger = getLogger();


// src/handlers/handlers.ts
// src/handlers/handlers.ts


export const handleExecuteSQL = async (body: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers); // Await the result of authenticate
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  // Parse the request body
  const { sql, params } = JSON.parse(body);

  if (!sql || typeof sql !== 'string') {
    return sendResponse(400, { message: 'SQL script is required and must be a string.' });
  }

  try {
    // Execute the SQL script
    const res = await pool.query(sql, params);

    // Return the result
    return sendResponse(200, { result: res.rows });
  } catch (error) {
    console.error('SQL Execution Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};


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
      { expiresIn: process.env.JWT_EXPIRES_IN || '10h' }
    );

    return sendResponse(200, { token: `bearer ${token}` });
  } catch (error) {
    console.error('Authentication Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};
/**
 * Converts various Git URL formats to a normalized HTTPS URL without the .git suffix.
 * Supports multiple Git hosting services.
 * 
* @param gitUrl - The original Git repository URL.
* @returns The normalized HTTPS URL without the .git suffix.
* @throws Error if the input URL format is unrecognized.
*/
function convertGitUrlToHttpsFlexible(gitUrl: string): string {
  let httpsUrl: string | null = null;

  // Regex patterns for different Git URL formats
  const patterns: RegExp[] = [
    /^git:\/\/([^/]+)\/([^/]+)\/([^/]+)\.git$/,
    /^git@([^:]+):([^/]+)\/([^/]+)\.git$/,
    /^ssh:\/\/git@([^/]+)\/([^/]+)\/([^/]+)\.git$/,
    /^https:\/\/([^/]+)\/([^/]+)\/([^/]+)(\.git)?$/,
  ];

  for (const pattern of patterns) {
    const match = pattern.exec(gitUrl);
    if (match) {
      const host = match[1];
      const user = match[2];
      const repo = match[3];
      httpsUrl = `https://${host}/${user}/${repo}`;
      break;
    }
  }

  if (!httpsUrl) {
    throw new Error(`Unrecognized Git URL format: ${gitUrl}`);
  }

  return httpsUrl;
}

// Example usage:


// Handler for /package - POST (Create Package)

export const handleCreatePackage = async (body: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }
  if (!user.permissions.includes('upload')) {
    return sendResponse(403, { message: 'You do not have permission to upload packages.' });
  }

  const packageData = JSON.parse(body);
  const { Content, JSProgram, URL, debloat } = packageData;
  console.log("packageData", packageData);
  console.log("JSprog", JSProgram)
  // Ensure only one of Content or URL is provided
  if ((!Content && !URL) || (Content && URL)) {
    return sendResponse(400, { message: 'Either Content or URL must be set, but not both.' });
  }

  let metadata: PackageMetadata = {} as PackageMetadata;
  let data: PackageData = {} as PackageData;
  let extractedPackageJson: any;
  let contentBuffer: Buffer | null = null;
  let createdPackage: Package;
  // Generate a unique ID for the package
  metadata.ID = generatePackageId();
  data.debloat = debloat ? debloat : false;
  data.JSProgram = JSProgram ? JSProgram : null;
  try {
    if (Content) {
      // Handle Content case
      const base64Buffer = Buffer.from(Content, 'base64');
      const zip = new AdmZip(base64Buffer);
      const zipEntries = zip.getEntries();

      let packageJSON: string | null = null;
      zipEntries.forEach(entry => {
        if (entry.entryName.endsWith('package.json')) {
          packageJSON = entry.getData().toString('utf8');
        }
      });

      if (!packageJSON) {
        return sendResponse(400, { message: 'No package.json found in zip' });
      }

      extractedPackageJson = JSON.parse(packageJSON);
      metadata.Name = extractedPackageJson.name;
      metadata.Version = extractedPackageJson.version;
      metadata.Owner = extractedPackageJson.author;
      data.Content = Content;
      contentBuffer = base64Buffer;
      data.URL = extractedPackageJson.repository?.url
        ? convertGitUrlToHttpsFlexible(extractedPackageJson.repository.url)
        : `https://github.com/${extractedPackageJson.author || 'unknown-owner'}/${metadata.Name}`;

      // Handle "debloat" if true
      if (debloat) {
        contentBuffer = debloatPackageContent(contentBuffer);
      }

      // Check if a package with this name and version already exists
      const existingResult = await pool.query(
        "SELECT id FROM packages WHERE name = $1 AND version = $2;",
        [metadata.Name, metadata.Version]
      );
      if (existingResult.rows.length > 0) {
        return sendResponse(409, { message: 'Package exists already.' });
      }


      createdPackage = await insertIntoDB(metadata, data);


    } else if (URL) {
      // Handle URL case
      const repoUrlFixed = convertGitUrlToHttpsFlexible(URL);
      const info = await metricCalcFromUrlUsingNetScore(repoUrlFixed, metadata.ID);

      if (!info || info.NET_SCORE < 0.5) {
        return sendResponse(424, { message: 'Package disqualified due to low rating' });
      }

      metadata.Name = info.NAME;
      metadata.Version = info.VERSION;
      data.URL = repoUrlFixed;
      metadata.Owner = info.OWNER;

      // Check if the package already exists based on Name and Version
      const existingResult = await pool.query(
        "SELECT id FROM packages WHERE name = $1 AND version = $2;",
        [metadata.Name, metadata.Version]
      );
      if (existingResult.rows.length > 0) {
        return sendResponse(409, { message: 'Package exists already.' });
      }

      // Download package content from GitHub
      const response = await fetch(`https://api.github.com/repos/${info.OWNER}/${info.NAME}/zipball/HEAD`, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return sendResponse(400, { message: 'Could not get GitHub URL for zip package download' });
      }

      const arrayBuffer = await response.arrayBuffer();
      contentBuffer = Buffer.from(arrayBuffer);

      if (debloat) {
        contentBuffer = debloatPackageContent(contentBuffer);
      }
      createdPackage = await insertIntoDB(metadata, data);


      const query = `
        INSERT INTO package_ratings 
          (package_id, net_score, ramp_up, correctness, 
           bus_factor, responsive_maintainer, license_score, 
           pull_request, good_pinning_practice, net_score_latency, 
           ramp_up_latency, correctness_latency, bus_factor_latency, 
           responsive_maintainer_latency, license_score_latency, 
           pull_request_latency, good_pinning_practice_latency) 
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17)
      `;

      const values = [
        info.ID,
        info.NET_SCORE,
        info.RAMP_UP_SCORE,
        info.CORRECTNESS_SCORE,
        info.BUS_FACTOR_SCORE,
        info.RESPONSIVE_MAINTAINER_SCORE,
        info.LICENSE_SCORE,
        info.PULL_REQUESTS_SCORE,
        info.PINNED_DEPENDENCIES_SCORE,
        info.NET_SCORE_LATENCY,
        info.RAMP_UP_SCORE_LATENCY,
        info.CORRECTNESS_SCORE_LATENCY,
        info.BUS_FACTOR_SCORE_LATENCY,
        info.RESPONSIVE_MAINTAINER_SCORE_LATENCY,
        info.LICENSE_SCORE_LATENCY,
        info.PULL_REQUESTS_SCORE_LATENCY,
        info.PINNED_DEPENDENCIES_SCORE_LATENCY
      ];

      await pool.query(query, values);


    }
    else { createdPackage = {} as Package; }

    // Handle JSProgram execution or validation
    if (JSProgram) {
      const isProgramValid = await validateJsProgram(JSProgram);
      if (!isProgramValid) {
        return sendResponse(400, { message: 'Invalid JavaScript program' });
      }
      data.JSProgram = JSProgram;
    }

    // Insert package metadata into PostgreSQL
    // const createdPackage = await insertIntoDB(metadata, data);

    let contentBase64: string;
    // Upload package content to S3 if contentBuffer has been assigned
    if (contentBuffer) {
      contentBase64 = contentBuffer.toString('base64');

      await uploadPackageContent(metadata.ID, contentBuffer);
    } else {
      return sendResponse(500, { message: 'Package content buffer is empty, unable to upload.' });
    }


    // Log the creation in package_history
    await pool.query(
      `INSERT INTO package_history (package_id, user_id, action)
       VALUES ($1, $2, $3)`,
      [metadata.ID, user.sub, 'CREATE']
    );


    return sendResponse(201, {
      metadata: {
        Name: metadata.Name,
        Version: metadata.Version,
        ID: metadata.ID,
      },
      data: {
        Content: contentBase64 || null,
        URL: data.URL || null,
        JSProgram: data.JSProgram || null,
      },
    });
  } catch (error: any) {
    console.error('Create Package Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};


// Helper function to "debloat" package content
function debloatPackageContent(buffer: Buffer): Buffer {
  // Implement debloating logic, e.g., removing unnecessary files from the zip
  console.log('Debloating package content...');
  const zip = new AdmZip(buffer);
  zip.getEntries().forEach(entry => {
    if (shouldRemoveEntry(entry)) {
      zip.deleteFile(entry.entryName);
    }
  });
  return zip.toBuffer();
}

// Helper function to validate the JSProgram
async function validateJsProgram(jsProgram: string): Promise<boolean> {
  try {
    // Perform validation or testing logic here, e.g., running a sandboxed environment
    return true; // Return true if valid, false otherwise
  } catch (error) {
    console.error('JS Program Validation Error:', error);
    return false;
  }
}

// Helper function to decide if a file entry should be removed during debloat
function shouldRemoveEntry(entry: AdmZip.IZipEntry): boolean {
  // Define logic for unnecessary files, e.g., remove certain file types or patterns
  return entry.entryName.endsWith('.md') || entry.entryName.includes('tests/');
}


// Handler for /package/{id} - GET (Retrieve Package)

export const handleRetrievePackage = async (id: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Validate the PackageID
  if (!id || typeof id !== 'string' || id.trim() === '') {
    return sendResponse(400, { message: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
  }

  // Authenticate the request
  console.log("getting packeage with ID", id);
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  if (!user.permissions.includes('download')) {
    return sendResponse(403, { message: 'You do not have permission to download packages.' });
  }
  try {
    const queryText = 'SELECT * FROM packages WHERE id = $1';
    const res = await pool.query(queryText, [id]);

    if (res.rows.length === 0) {
      return sendResponse(404, { message: 'Package does not exist.' });
    }

    const packageData: any = res.rows[0];
    console.log(res.rows[0]);

    // If Content is null and URL is null, retrieve from S3
    if (!packageData.content) {
      try {
        const content = await getPackageContent(id);
        packageData.content = content;
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

    // Format the response
    const response = {
      metadata: {
        Name: packageData.name,
        Version: packageData.version,
        ID: packageData.id,
      },
      data: {
        Content: packageData.content,
        JSProgram: packageData.js_program, // Assuming this field exists in your database
      },
    };

    return sendResponse(200, response);
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
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }
  if (!user.permissions.includes('upload')) {
    return sendResponse(403, { message: 'You do not have permission to update packages.' });
  }

  const updatedPackage: Package = JSON.parse(body);
  const { metadata, data } = updatedPackage;

  // Ensure the name, version, and ID match
  if (metadata.ID !== id) {
    return sendResponse(400, { message: 'There is missing field(s) in the PackageID or it is formed improperly, or is invalid.' });
  }
  const result = await pool.query('select * from packages where name=$1', [updatedPackage.metadata.Name]);
  if (result.rows.length == 0) {
    return sendResponse(404, { message: 'Package does not exist.' });
  }
  const existingResult = await pool.query(
    "SELECT id FROM packages WHERE name = $1 AND version = $2;",
    [metadata.Name, metadata.Version]
  );
  if (existingResult.rows.length > 0) {
    return sendResponse(409, { message: 'Package exists already.' });
  }
  console.log("Results");
  const [latestMajorStr, latestMinorStr, latestPatchStr] = updatedPackage.metadata.Version.split('.');
  const latestMajor = parseInt(latestMajorStr, 10);
  const latestMinor = parseInt(latestMinorStr, 10);
  const latestPatch = parseInt(latestPatchStr, 10);
  console.log(latestMajor, " ", latestMinor, " ", latestPatch);
  console.log("Coming");
  for (let i = 0; i < result.rows.length; i++) {
    let [mjstr, mnstr, pstr] = result.rows[i].version.split('.');
    let mj = parseInt(mjstr, 10);
    let mn = parseInt(mnstr, 10);
    let pt = parseInt(pstr, 10);
    if (mj == latestMajor && mn == latestMinor && pt > latestPatch) {
      return sendResponse(400, { message: 'Invalid Version.' });
    }
  }

  const result1 = await pool.query('select * from packages where id=$1', [updatedPackage.metadata.ID]);
  if (result1.rows.length > 0) {
    updatedPackage.metadata.ID = generatePackageId();
    console.log("New ID");
    console.log(updatedPackage.metadata.ID);
  }
  let contentBuffer: Buffer | null = null;
  try {
    if (updatedPackage.data.Content) {
      // Handle Content case
      const base64Buffer = Buffer.from(updatedPackage.data.Content, 'base64');
      const zip = new AdmZip(base64Buffer);
      const zipEntries = zip.getEntries();



      let metadata: PackageMetadata = updatedPackage.metadata;
      let data: PackageData = updatedPackage.data;
      contentBuffer = base64Buffer;


      // Handle "debloat" if true
      if (data.debloat) {
        contentBuffer = debloatPackageContent(contentBuffer);
      }

      // Check if a package with this name and version already exists



      await insertIntoDB(metadata, data);


    } else if (updatedPackage.data.URL) {
      // Handle URL case
      const repoUrlFixed = convertGitUrlToHttpsFlexible(updatedPackage.data.URL);
      const info = await metricCalcFromUrlUsingNetScore(repoUrlFixed, metadata.ID);

      if (!info || info.NET_SCORE < 0.5) {
        return sendResponse(424, { message: 'Package disqualified due to low rating' });
      }

      metadata.Owner = info.OWNER;

      // Check if the package already exists based on Name and Version
      const existingResult = await pool.query(
        "SELECT id FROM packages WHERE name = $1 AND version = $2;",
        [metadata.Name, metadata.Version]
      );
      if (existingResult.rows.length > 0) {
        return sendResponse(409, { message: 'Package exists already.' });
      }

      // Download package content from GitHub
      const response = await fetch(`https://api.github.com/repos/${info.OWNER}/${info.NAME}/zipball/HEAD`, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return sendResponse(400, { message: 'Could not get GitHub URL for zip package download' });
      }

      const arrayBuffer = await response.arrayBuffer();
      contentBuffer = Buffer.from(arrayBuffer);

      if (updatedPackage.data.debloat) {
        contentBuffer = debloatPackageContent(contentBuffer);
      }
      await insertIntoDB(metadata, data);


      await pool.query(
        `INSERT INTO package_ratings 
    (package_id, net_score, ramp_up, correctness, 
     bus_factor, responsive_maintainer, license_score, 
     pull_request, good_pinning_practice) 
    VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)
    `,
        [
          info.ID,
          info.NET_SCORE,
          info.RAMP_UP_SCORE,
          info.CORRECTNESS_SCORE,
          info.BUS_FACTOR_SCORE,
          info.RESPONSIVE_MAINTAINER_SCORE,
          info.LICENSE_SCORE,
          info.PULL_REQUESTS_SCORE,
          info.PINNED_DEPENDENCIES_SCORE
        ]);


    }


    // Handle JSProgram execution or validation
    if (updatedPackage.data.JSProgram) {
      const isProgramValid = await validateJsProgram(updatedPackage.data.JSProgram);
      if (!isProgramValid) {
        return sendResponse(400, { message: 'Invalid JavaScript program' });
      }
      data.JSProgram = updatedPackage.data.JSProgram;
    }

    // Insert package metadata into PostgreSQL
    // const createdPackage = await insertIntoDB(metadata, data);

    let contentBase64: string;
    // Upload package content to S3 if contentBuffer has been assigned
    if (contentBuffer) {
      contentBase64 = contentBuffer.toString('base64');

      await uploadPackageContent(metadata.ID, contentBuffer);
    } else {
      return sendResponse(500, { message: 'Package content buffer is empty, unable to upload.' });
    }


    // Log the creation in package_history
    await pool.query(
      `INSERT INTO package_history (package_id, user_id, action)
       VALUES ($1, $2, $3)`,
      [metadata.ID, user.sub, 'UPDATE']
    );


    return sendResponse(200, { message: "Version is updated." });
  } catch (error: any) {
    console.error('Create Package Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

// Handler for /package/{id} - DELETE (Delete Package)
export const handleDeletePackage = async (id: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }
  if (!user.permissions.includes('upload')) {
    return sendResponse(403, { message: 'You do not have permission to upload/delete packages.' });
  }

  try {
    const deleteText = 'DELETE FROM packages WHERE id = $1 RETURNING *';
    const historyInsert = `
    INSERT INTO package_history (package_id, user_id, action)
    VALUES ($1, $2, $3)
  `;
  await pool.query(historyInsert, [id, user.sub, 'DELETE']);

    const res = await pool.query(deleteText, [id]);

    if (res.rows.length === 0) {
      return sendResponse(404, { message: 'Package does not exist.' });
    }

    const deletedPackage: Package = res.rows[0];

    // Delete from S3 if Content is present
    if (deletedPackage) {
      await deletePackageContent(id);
    }

    // Log the deletion in package_history
  
    return sendResponse(200, { message: 'Package is deleted.' });
  } catch (error) {
    console.error('Delete Package Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

export const handleListPackages = async (
  body: string,
  headers: { [key: string]: string | undefined },
  queryStringParameters: { [key: string]: string | undefined }
): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser; // Using 'any' for AuthenticatedUser
  try {
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode || 403, { message: err.message || 'Authentication failed.' });
  }
  if (!user.permissions.includes('search')) {
    return sendResponse(403, { message: 'You do not have permission to search packages.' });
  }
  let queries: any[];
  try {
    queries = JSON.parse(body);
    console.log("Queries", queries);
  } catch (err: any) {
    return sendResponse(400, { message: 'Invalid JSON format in request body.' });
  }

  const offset = queryStringParameters.offset ? parseInt(queryStringParameters.offset) : 0;
  const limit = 10; // Define your page size

  if (!Array.isArray(queries)) {
    return sendResponse(400, { message: 'Request body must be an array of PackageQuery.' });
  }

  try {
    const results: any[] = [];

    for (const query of queries) {
      const { Name, Version } = query;

      // Validate PackageQuery
      if (!Name) {
        return sendResponse(400, { message: 'PackageQuery must include Name.' });
      }

      // Build SQL query based on PackageQuery
      let sql = 'SELECT * FROM packages WHERE name ILIKE $1';
      const values: any[] = [`%${Name}%`];

      // Execute SQL query to fetch packages matching the name
      const packageResult = await pool.query(sql, values);

      // Debugging: Log the fetched packages
      console.log(`Fetched packages for Name "${Name}":`, packageResult.rows);

      // Filter results based on the Version using semver
      const filteredPackages = packageResult.rows.filter((pkg: any) => {
        if (!Version) {
          return true; // No version filter applied
        }

        // Debugging: Log the package version and the filter version
        console.log(`Filtering package version: ${pkg.version} with Version filter: ${Version}`);

        // Handle exact version match
        if (semver.valid(Version)) {
          const isEqual = semver.eq(pkg.version, Version);
          console.log(`semver.eq(${pkg.version}, ${Version}) = ${isEqual}`);
          return isEqual;
        }

        // Handle version ranges (caret, tilde, bounded)
        if (semver.validRange(Version)) {
          const isSatisfied = semver.satisfies(pkg.version, Version);
          console.log(`semver.satisfies(${pkg.version}, ${Version}) = ${isSatisfied}`);
          return isSatisfied;
        }

        // Unsupported version format
        console.log(`Unsupported version format: ${Version}`);
        return false;
      });

      // Debugging: Log the filtered packages
      console.log(`Filtered packages for Name "${Name}" and Version "${Version}":`, filteredPackages);

      results.push(...filteredPackages);
    }

    // Remove duplicate packages if multiple queries could return the same package
    const uniqueResults = Array.from(new Set(results.map(pkg => pkg.id))).map(id => results.find(pkg => pkg.id === id));

    // Debugging: Log the unique results
    console.log('Unique Results after removing duplicates:', uniqueResults);

    // Pagination
    const paginatedResults = uniqueResults.slice(offset, offset + limit);
    const nextOffset = offset + limit < uniqueResults.length ? offset + limit : null;

    const responseHeaders: { [key: string]: string } = {};
    if (nextOffset !== null) {
      responseHeaders['offset'] = nextOffset.toString();
    }

    // Debugging: Log the paginated results
    console.log('Paginated Results:', paginatedResults);

    return {
      statusCode: 200,
      headers: responseHeaders,
      body: JSON.stringify(paginatedResults),
    };
  } catch (error: any) {
    console.error('List Packages Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};




// Handler for /reset - DELETE
export const handleResetRegistry = async (headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
    if (!user.isAdmin) {
      return sendResponse(403, { message: 'Admin privileges required.' });
    }
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  try {
    // Start a transaction
    await pool.query('BEGIN');

    // Truncate all tables except the users table
    await pool.query('TRUNCATE TABLE packages CASCADE;');
    await pool.query('TRUNCATE TABLE package_history CASCADE;');
    await pool.query('TRUNCATE TABLE package_ratings CASCADE;');
    await pool.query('TRUNCATE TABLE dependencies CASCADE;');
    await pool.query('TRUNCATE TABLE tracks CASCADE;');
    await pool.query('TRUNCATE TABLE user_tracks CASCADE;');
    await pool.query('TRUNCATE TABLE cost CASCADE;');
    await pool.query('TRUNCATE TABLE userAuth CASCADE;');

    // Delete all users except the admin user with the specified name
    await pool.query('DELETE FROM users WHERE name != $1', ['ece30861defaultadminuser']);

    // Commit the transaction
    await pool.query('COMMIT');

    return sendResponse(200, { message: 'Registry is reset, only the default admin user is retained.' });
  } catch (error: any) {
    // Rollback the transaction in case of an error
    await pool.query('ROLLBACK');
    console.error('Reset Registry Error:', error);
    return sendResponse(500, { message: 'Internal server error.' });
  }
};

// Handler for /package/byName/{name} - GET (Package History by Name)
export const handleGetPackageHistoryByName = async (name: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }
  if (!user.permissions.includes('search')) {
    return sendResponse(403, { message: 'You do not have permission to search packages.' });
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
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }
  if (!user.permissions.includes('search')) {
    return sendResponse(403, { message: 'You do not have permission to search packages.' });
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
export const handleGetPackageRating = async (id: string, headers: { [key: string]: string | undefined }): Promise<any> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(403, { message: "Authentication failed due to invalid or missing AuthenticationToken" });
  }

  // Validate package ID
  if (!id) {
    return sendResponse(400, { message: "Missing field(s) in PackageID." });
  }

  try {
    const ratingQuery = 'SELECT url FROM packages WHERE id = $1';
    const res = await pool.query(ratingQuery, [id]);

    if (res.rows.length === 0) {
      return sendResponse(500, { message: 'The package rating system choked on at least one of the metrics.' });
    }

    const packageUrl = res.rows[0].url;
    const newRating = await metricCalcFromUrlUsingNetScore(packageUrl, id);

    if (!newRating) {
      return sendResponse(500, { message: 'Failed to calculate metrics for the package.' });
    }

    const checkExistingRatingQuery = 'SELECT 1 FROM package_ratings WHERE package_id = $1';
    const existingRatingRes = await pool.query(checkExistingRatingQuery, [id]);

    if (existingRatingRes.rows.length > 0) {
      // Update existing rating
      const updateRatingQuery = `
        UPDATE package_ratings
        SET 
          bus_factor = $2, 
          bus_factor_latency = $3, 
          correctness = $4, 
          correctness_latency = $5, 
          ramp_up = $6, 
          ramp_up_latency = $7, 
          responsive_maintainer = $8, 
          responsive_maintainer_latency = $9, 
          license_score = $10, 
          license_score_latency = $11, 
          good_pinning_practice = $12, 
          good_pinning_practice_latency = $13, 
          pull_request = $14, 
          pull_request_latency = $15, 
          net_score = $16, 
          net_score_latency = $17
        WHERE package_id = $1
      `;
      const updateRatingValues = [
        newRating.ID,
        newRating.BUS_FACTOR_SCORE,
        newRating.BUS_FACTOR_SCORE_LATENCY,
        newRating.CORRECTNESS_SCORE,
        newRating.CORRECTNESS_SCORE_LATENCY,
        newRating.RAMP_UP_SCORE,
        newRating.RAMP_UP_SCORE_LATENCY,
        newRating.RESPONSIVE_MAINTAINER_SCORE,
        newRating.RESPONSIVE_MAINTAINER_SCORE_LATENCY,
        newRating.LICENSE_SCORE,
        newRating.LICENSE_SCORE_LATENCY,
        newRating.PINNED_DEPENDENCIES_SCORE,
        newRating.PINNED_DEPENDENCIES_SCORE_LATENCY,
        newRating.PULL_REQUESTS_SCORE,
        newRating.PULL_REQUESTS_SCORE_LATENCY,
        newRating.NET_SCORE,
        newRating.NET_SCORE_LATENCY
      ];
      await pool.query(updateRatingQuery, updateRatingValues);
    } else {
      // Insert new rating
      const insertRatingQuery = `
        INSERT INTO package_ratings (
          package_id, 
          bus_factor, 
          bus_factor_latency, 
          correctness, 
          correctness_latency, 
          ramp_up, 
          ramp_up_latency, 
          responsive_maintainer, 
          responsive_maintainer_latency, 
          license_score, 
          license_score_latency, 
          good_pinning_practice, 
          good_pinning_practice_latency, 
          pull_request, 
          pull_request_latency, 
          net_score, 
          net_score_latency
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17
        )
      `;
      const insertRatingValues = [
        newRating.ID,
        newRating.BUS_FACTOR_SCORE,
        newRating.BUS_FACTOR_SCORE_LATENCY,
        newRating.CORRECTNESS_SCORE,
        newRating.CORRECTNESS_SCORE_LATENCY,
        newRating.RAMP_UP_SCORE,
        newRating.RAMP_UP_SCORE_LATENCY,
        newRating.RESPONSIVE_MAINTAINER_SCORE,
        newRating.RESPONSIVE_MAINTAINER_SCORE_LATENCY,
        newRating.LICENSE_SCORE,
        newRating.LICENSE_SCORE_LATENCY,
        newRating.PINNED_DEPENDENCIES_SCORE,
        newRating.PINNED_DEPENDENCIES_SCORE_LATENCY,
        newRating.PULL_REQUESTS_SCORE,
        newRating.PULL_REQUESTS_SCORE_LATENCY,
        newRating.NET_SCORE,
        newRating.NET_SCORE_LATENCY
      ];
      await pool.query(insertRatingQuery, insertRatingValues);
    }

    return sendResponse(200, convertPackageInfo(newRating));
  } catch (error) {
    console.error('Error calculating package rating:', error);
    return sendResponse(500, { message: 'An error occurred while calculating the package rating.' });
  }
};

// Handler for /package/{id}/cost - GET (Get Package Cost)
export const handleGetPackageCost = async (id: string, headers: { [key: string]: string | undefined }, queryStringParameters: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(403, { message: "Authentication failed due to invalid or missing AuthenticationToken" });
  }


  // const includeDependencies = queryStringParameters?.dependency === 'true';

  // try {
  //   // Initial query to check if the package exists and fetch basic cost data
  //   const costQuery = `
  //     SELECT id, name, version, size_mb 
  //     FROM packages 
  //     WHERE id = $1
  //   `;
  //   const costResult = await pool.query(costQuery, [id]);

  //   if (costResult.rows.length === 0) {
  //     return sendResponse(404, { message: 'Package does not exist.' });
  //   }

  //   const packageCosts: Record<string, { standaloneCost?: number; totalCost: number }> = {};
  //   let totalCost = 0;

  //   // Initialize the package cost with its standalone cost
  //   const pkg = costResult.rows[0];
  //   packageCosts[pkg.id] = {
  //     standaloneCost: pkg.size_mb,
  //     totalCost: pkg.size_mb,
  //   };
  //   totalCost += pkg.size_mb;

  //   if (includeDependencies) {
  //     const stack = [id];
  //     const visited = new Set<string>();

  //     // Iterate through dependencies using a stack
  //     while (stack.length > 0) {
  //       const currentId = stack.pop()!;
  //       if (visited.has(currentId)) continue;
  //       visited.add(currentId);

  //       // Fetch dependencies from a hypothetical 'dependencies' table
  //       const depQuery = 'SELECT dependency_id FROM dependencies WHERE package_id = $1';
  //       const depResult = await pool.query(depQuery, [currentId]);

  //       for (const dep of depResult.rows) {
  //         const depPkgQuery = 'SELECT id, size_mb FROM packages WHERE id = $1';
  //         const depPkgResult = await pool.query(depPkgQuery, [dep.dependency_id]);

  //         if (depPkgResult.rows.length > 0) {
  //           const depPkg = depPkgResult.rows[0];
  //           if (!packageCosts[depPkg.id]) {
  //             packageCosts[depPkg.id] = {
  //               standaloneCost: depPkg.size_mb,
  //               totalCost: totalCost + depPkg.size_mb,
  //             };
  //             totalCost += depPkg.size_mb;
  //             stack.push(depPkg.id);
  //           }
  //         }
  //       }
  //     }
  //   } else {
  //     // If no dependencies are included, total cost is just standalone
  //     packageCosts[id].totalCost = packageCosts[id].standaloneCost || 0;
  //   }



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
    return sendResponse(500, { message: 'The package rating system choked on at least one of the metrics.' });
  }
};

// Handler for /tracks - GET (Get Planned Tracks)
export const handleGetTracks = async (headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
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
