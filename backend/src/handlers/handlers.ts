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
import { metricCalcFromUrlUsingNetScore, PackageInfo, generatePackageId } from '../handlerhelper';
import { getLogger, logTestResults } from '../rating/logger';
import AdmZip, { IZipEntry } from 'adm-zip';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { send } from 'process';



const logger = getLogger();


// src/handlers/handlers.ts

export const handleRegisterUser = async (body: string): Promise<APIGatewayProxyResult> => {
  const { name, password, isAdmin = false } = JSON.parse(body);

  if (!name || !password) {
    return {
      statusCode: 400,
      body: JSON.stringify({ message: 'Name and password are required.' }),
      headers: { 'Content-Type': 'application/json' },
    };
  }

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user into the database
    const query = `
      INSERT INTO users (name, password_hash, is_admin)
      VALUES ($1, $2, $3)
    `;
    const values = [name, hashedPassword, isAdmin];
    await pool.query(query, values);

    return {
      statusCode: 201,
      body: JSON.stringify({ message: 'User registered successfully!' }),
      headers: { 'Content-Type': 'application/json' },
    };
  } catch (error) {
    console.error('Error registering user:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: 'Internal server error.' }),
      headers: { 'Content-Type': 'application/json' },
    };
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
      { expiresIn: process.env.JWT_EXPIRES_IN || '1h' }
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
    user = authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode, { message: err.message });
  }

  const packageData = JSON.parse(body);
  const { Content, JSProgram, URL, debloat } = packageData;
  console.log("packageData", packageData);

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

    let contentBase64 :string;
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

// Helper function to fetch repo ZIP from GitHub
const fetchRepoZipFromGitHub = async (OWNER: string, NAME: string): Promise<Buffer> => {
  const response = await fetch(`https://api.github.com/repos/${OWNER}/${NAME}/zipball/HEAD`, {
    headers: {
      Authorization: process.env.GITHUB_TOKEN || "",
      Accept: 'application/vnd.github.v3+json',
    },
  });
  console.log("response", response);
  if (!response.ok) throw new Error('Failed to download GitHub repo zip');
  return Buffer.from(await response.arrayBuffer());
};

// Handler for /package/{id} - GET (Retrieve Package)
export const handleRetrievePackage = async (id: string, headers: { [key: string]: string | undefined }): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  console.log("id", id);
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

    const packageData: any = res.rows[0];
    console.log(res.rows[0]);
    // If Content is null and URL is null, retrieve from S3
    if (!packageData.id && !packageData.url) {
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
      updateFields.push(`JSProgram = $${idx++}`);
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
    let newquery = "select name ,version from packages where name =$1 and version =$2;"
    let result = await pool.query(newquery, [metadata.ID, metadata.Version]);
    if (data.Content) {
      const contentBuffer = Buffer.from(data.Content, 'base64');

      if (result.rows.length == 0)
        await uploadPackageContent(metadata.ID, contentBuffer);
      else return sendResponse(409, { message: 'Package exists already.' });

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
    // if (deletedPackage.data.Content) {
    //   await deletePackageContent(id);
    // }

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

export const handleListPackages = async (
  body: string,
  headers: { [key: string]: string | undefined },
  queryStringParameters: { [key: string]: string | undefined }
): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: any; // Using 'any' for AuthenticatedUser
  try {
    user = authenticate(headers);
  } catch (err: any) {
    return sendResponse(err.statusCode || 403, { message: err.message || 'Authentication failed.' });
  }

  let queries: any[];
  try {
    queries = JSON.parse(body);
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
    return sendResponse(403, { message: "Authentication failed due to invalid or missing AuthenticationToken" });
  }

  // Validate package ID
  if (!id) {
    return sendResponse(400, { message: "Missing field(s) in PackageID." });
  }

  try {
    const ratingQuery = 'SELECT * FROM package_ratings WHERE package_id = $1';
    const res = await pool.query(ratingQuery, [id]);

    if (res.rows.length === 0) {
      return sendResponse(500, { message: 'The package rating system choked on at least one of the metrics.' });
    }

    const rating: PackageRating = res.rows[0];
    const responsePayload = {
      BusFactor: rating.BusFactor,
      BusFactorLatency: rating.BusFactorLatency,
      Correctness: rating.Correctness,
      CorrectnessLatency: rating.CorrectnessLatency,
      RampUp: rating.RampUp,
      RampUpLatency: rating.RampUpLatency,
      ResponsiveMaintainer: rating.ResponsiveMaintainer,
      ResponsiveMaintainerLatency: rating.ResponsiveMaintainerLatency,
      LicenseScore: rating.LicenseScore,
      LicenseScoreLatency: rating.LicenseScoreLatency,
      GoodPinningPractice: rating.GoodPinningPractice,
      GoodPinningPracticeLatency: rating.GoodPinningPracticeLatency,
      PullRequest: rating.PullRequest,
      PullRequestLatency: rating.PullRequestLatency,
      NetScore: rating.NetScore,
      NetScoreLatency: rating.NetScoreLatency
    };
    return sendResponse(200, responsePayload);
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