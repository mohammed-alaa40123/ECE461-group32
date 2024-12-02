// src/handlers/handlers.ts
import { APIGatewayProxyResult } from 'aws-lambda';
import pool, { getUserByName, insertIntoDB } from '../services/dbService';
import { uploadPackageContent, getPackageContent, deletePackageContent } from '../services/s3Service';
import { Package, PackageMetadata, PackageData } from '../models/Package';
import { PackageHistoryEntry } from '../models/PackageHistoryEntry';
import { sendResponse } from '../utils/response';
import { authenticate, AuthenticatedUser } from '../utils/auth';
import { metricCalcFromUrlUsingNetScore, convertPackageInfo, generatePackageId } from '../handlerhelper';
import { getLogger } from '../rating/logger';
import AdmZip from 'adm-zip';
import jwt from 'jsonwebtoken';
import bcrypt from 'bcrypt';
import { fetchRepoDetails } from '../handlerhelper';



const logger = getLogger();


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

// // Example usage:
// async function fetchRepoDetails(packageName: string): Promise<{ url: string, owner: string, name: string, defaultBranch: string } | null> {
//   try {
//     const repoDetailsUrl = `https://api.github.com/repos/${packageName}`;
//     const repoDetailsResponse = await fetch(repoDetailsUrl, {
//       headers: {
//         Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
//         Accept: 'application/vnd.github.v3+json',
//       },
//     });

//     if (!repoDetailsResponse.ok) {
//       console.error(`Failed to fetch repository details for ${packageName}`);
//       return null;
//     }

//     const repoDetails = await repoDetailsResponse.json() as unknown as any;
//     return {
//       url: repoDetails.html_url,
//       owner: repoDetails.owner.login,
//       name: repoDetails.name,
//       defaultBranch: repoDetails.default_branch,
//     };
//   } catch (error) {
//     console.error(`Error fetching repository details for ${packageName}:`, error);
//     return null;
//   }
// }


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
        const LCname = entry.entryName.toLowerCase();
        if (entry.entryName.endsWith('package.json')) {
          packageJSON = entry.getData().toString('utf8');
        }
        if (LCname.endsWith('readme.txt') || LCname.endsWith('readme.md'))
          data.readme = entry.getData().toString('utf8');
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
      const readmef = await fetch(`https://api.github.com/repos/${info.OWNER}/${info.NAME}/zipball/HEAD`, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      const readmecontent = await readmef.arrayBuffer();
      data.readme = readmecontent.toString();
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
      zipEntries.forEach(entry => {
        const LCname = entry.entryName.toLowerCase();
        LCname.endsWith('readme.md')
        if (LCname.endsWith('readme.txt') || LCname.endsWith('readme.md'))
          data.readme = entry.getData().toString('utf8');
      });

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
      const readmef = await fetch(`https://api.github.com/repos/${info.OWNER}/${info.NAME}/zipball/HEAD`, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });
      const readmecontent = await readmef.arrayBuffer();
      data.readme = readmecontent.toString();
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
    // const deleteText = 'DELETE FROM packages WHERE id = $1 RETURNING *';
    const historyInsert = `
    INSERT INTO package_history (package_id, user_id, action)
    VALUES ($1, $2, $3)
  `;
    await pool.query(historyInsert, [id, user.sub, 'DELETE']);

    // const res = await pool.query(deleteText, [id]);

    // if (res.rows.length === 0) {
    //   return sendResponse(404, { message: 'Package does not exist.' });
    // }

    // const deletedPackage: Package = res.rows[0];

    // // Delete from S3 if Content is present
    // if (deletedPackage) {
    await deletePackageContent(id);
    // }

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
      if (!Name || !Version) {
        return sendResponse(400, { message: 'There is missing field(s) in the PackageQuery or it is formed improperly, or is invalid.' });
      }
      let sql = "";
      let values: any[] = [];
      // Build SQL query based on PackageQuery
      if (Name != '*') {
        sql = 'SELECT version,name,id FROM packages WHERE name ILIKE $1 ';
        values = [`%${Name}%`];
      }
      else sql = 'SELECT version,name,id FROM packages ';

      // Execute SQL query to fetch packages matching the name


      // Debugging: Log the fetched packages


      // Filter results based on the Version using semver
      let [type, versionRange] = Version.split(' ');
      let match = [];
      let wanted = '';
      console.log("Before going in ");
      switch (type) {
        case 'Exact':
          match = versionRange.match(/\(([^)]+)\)/);
          wanted = match[1];
          if (Name != '*')
            sql += 'and version=$2';

          else sql += 'where version=$1';

          values.push(wanted);
          break;
        case 'Bounded':
          match = versionRange.match(/\(([^)]+)\)/);
          wanted = match[1];
          let [bound1, bound2] = wanted.split('-');
          if (Name != '*')
            sql += 'and version>=$2 and version <= $3';

          else sql += 'where version>=$1 and version <=$2';

          values.push(bound1);
          values.push(bound2);
          break;
        case 'Tilde':
          match = versionRange.match(/\(([^)]+)\)/);
          let wantedb: string = match[1];

          let [none, wanted2] = wantedb.split('~');
          let [non1, wanted3, non2] = wanted2.split('.');
          let boun1 = wanted2;
          let num = parseInt(wanted3);
          let boun2 = `${non1}.${num + 1}.0`;
          if (Name != '*')
            sql += 'and version>=$2 and version <= $3';

          else sql += 'where version>=$1 and version <=$2';

          values.push(boun1);
          values.push(boun2);
          console.log(boun2);
          break;
        case 'Carat':
          match = versionRange.match(/\(([^)]+)\)/);
          let wantedeb: string = match[1];

          let [nonee, wantede2] = wantedeb.split('^');
          let [wantede3, nonee1, nonee2] = wantede2.split('.');
          let bou1 = wantede2;
          let nume = parseInt(wantede3);
          let bou2 = `${nume + 1}.0.0`;
          if (Name != '*')
            sql += 'and version>=$2 and version <= $3';

          else sql += 'where version>=$1 and version <=$2';

          values.push(bou1);
          values.push(bou2);
          console.log(bou2);
          break;
      }
      // Debugging: Log the filtered packages
      console.log("EXEC");
      console.log(sql, values);
      const filteredPackages = await pool.query(sql, values);
      console.log(`Filtered packages for Name "${Name}" and Version "${Version}":`, filteredPackages);

      results.push(...filteredPackages.rows);
    }
    if (results.length > 100)
      return sendResponse(413, { message: 'Too many packages returned.' });
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
      WHERE name ~* $1 or readme  ~* $1
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
function extractPackageOwnerFromUrl(url: string): string | null {
  const match = url.match(/github\.com[:\/]([^\/]+)\/([^\/]+)(\.git)?$/i);
  if (match) {
    return match[1]; // The package owner
  } else {
    return null; // Unable to extract owner
  }
}


export const handleGetPackageCost = async (
  id: string,
  headers: { [key: string]: string | undefined },
  queryStringParameters: { [key: string]: string | undefined }
): Promise<APIGatewayProxyResult> => {
  // Authenticate the request
  let user: AuthenticatedUser;
  try {
    user = await authenticate(headers);
  } catch (err: any) {
    return sendResponse(403, { message: "Authentication failed due to invalid or missing AuthenticationToken" });
  }

  // Fetch package details
  const packageQuery = `
    SELECT p.id, p.name, p.version, p.url, p.owner
    FROM packages p
    WHERE p.id = $1
  `;
  const packageResult = await pool.query(packageQuery, [id]);

  if (packageResult.rows.length === 0) {
    return sendResponse(404, { message: 'Package does not exist.' });
  }

  const pkg = packageResult.rows[0];
  const packageName = pkg.name;
  const packageVersion = pkg.version;
  const packageUrl = pkg.url;
  const packageId = pkg.id;
  const packageOwner = extractPackageOwnerFromUrl(packageUrl);

  const includeDependencies = queryStringParameters && queryStringParameters.dependency === 'true';
  const MAX_DEPTH = 5;
  const packageCostsCache: { [key: string]: { standaloneCost: number, totalCost: number } } = {};
  let packageCosts = {};
  try {
    const calculateCosts = async (
      packageName: string,
      packageVersion: string,
      parentPackageName: string | null = null,
      parentPackageVersion: string | null = null,
      pkgOwner: string,
      currentDepth: number = 0
    ): Promise<{ standaloneCost: number, totalCost: number }> => {
      if (currentDepth > MAX_DEPTH) {
        return { standaloneCost: 0, totalCost: 0 };
      }
      const packageQuery = `
      SELECT p.id, p.name, p.version, p.url, p.owner
      FROM packages p
      WHERE p.name = $1 and  p.owner = $2 and  p.version = $3
    `;
      const packageResult = await pool.query(packageQuery, [packageName, pkgOwner, packageVersion]);
      let packageKey = "";
      if (packageResult.rows.length === 0) {
        packageKey = generatePackageId();
      }
      else {
        packageKey = `${packageResult.rows[0].id}`;
      }
      if (packageCostsCache[packageKey] !== undefined) {
        return packageCostsCache[packageKey];
      }

      // Fetch the repository details to get the default branch
      const repoDetailsUrl = `https://api.github.com/repos/${pkgOwner}/${packageName}`;
      const repoDetailsResponse = await fetch(repoDetailsUrl, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!repoDetailsResponse.ok) {
        throw new Error(`Failed to fetch repository details from GitHub for /${pkgOwner}/${packageName}`);
      }

      const repoDetails = await repoDetailsResponse.json() as any;
      const defaultBranch = repoDetails.default_branch;

      // Fetch the package.json file from the default branch
      const packageJsonUrl = `https://raw.githubusercontent.com/${pkgOwner}/${packageName}/${defaultBranch}/package.json`;
      const packageJsonResponse = await fetch(packageJsonUrl, {
        headers: {
          Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!packageJsonResponse.ok) {
        throw new Error('Failed to fetch package.json from GitHub');
      }

      const packageJson = await packageJsonResponse.json() as any;
      const dependencies = packageJson.dependencies ? Object.keys(packageJson.dependencies) : [];
      console.log(`Dependencies for ${pkgOwner}/${packageName}:`, dependencies);

      // Calculate the standalone cost (size of the package)
      const standaloneCost = await fetchPackageSize(pkgOwner, packageName, defaultBranch);
      let totalCost = standaloneCost;

      packageCostsCache[packageKey] = { standaloneCost, totalCost };

      // Store the package in the database
      const insertPackageQuery = `
        INSERT INTO dependencies (package_name, package_version, standalone_cost, total_cost, dependencies, parent_package_name, parent_package_version)
        VALUES ($1, $2, $3, $4, $5, $6, $7)
        ON CONFLICT (package_name, package_version) DO UPDATE
        SET standalone_cost = EXCLUDED.standalone_cost,
            total_cost = EXCLUDED.total_cost,
            dependencies = EXCLUDED.dependencies,
            parent_package_name = EXCLUDED.parent_package_name,
            parent_package_version = EXCLUDED.parent_package_version
      `;
      await pool.query(insertPackageQuery, [
        packageName,
        packageVersion,
        standaloneCost,
        totalCost,
        JSON.stringify({}),
        parentPackageName,
        parentPackageVersion
      ]);

      if (includeDependencies && dependencies.length > 0) {
        const dependencyPromises = dependencies.map(async (dependency) => {
          try {
            // Fetch repository details for the dependency
            const depRepoDetails = await fetchRepoDetails(dependency);
            if (depRepoDetails) {
              const depCost = await calculateCosts(
                depRepoDetails.name,
                depRepoDetails.version,
                packageName,
                packageVersion,
                depRepoDetails.owner,
                currentDepth + 1
              );
              totalCost += depCost.standaloneCost;

              // Insert the dependency into the database
              const insertDependencyQuery = `
                INSERT INTO dependencies (package_name, package_version, standalone_cost, total_cost, dependencies, parent_package_name, parent_package_version)
                VALUES ($1, $2, $3, $4, $5, $6, $7)
                ON CONFLICT (package_name, package_version) DO UPDATE
                SET standalone_cost = EXCLUDED.standalone_cost,
                    total_cost = EXCLUDED.total_cost,
                    dependencies = EXCLUDED.dependencies,
                    parent_package_name = EXCLUDED.parent_package_name,
                    parent_package_version = EXCLUDED.parent_package_version
              `;
              await pool.query(insertDependencyQuery, [
                dependency,
                depRepoDetails.version,
                depCost.standaloneCost,
                depCost.totalCost,
                JSON.stringify({}),
                packageName,
                packageVersion
              ]);
            }
          } catch (error) {
            console.error(`Error processing dependency ${dependency}:`, error);
          }
        });

        await Promise.all(dependencyPromises);

        // Update the package with the total cost including dependencies
        const updatePackageQuery = `
          UPDATE dependencies
          SET total_cost = $1,
              dependencies = $2
          WHERE package_name = $3 AND package_version = $4
        `;
        await pool.query(updatePackageQuery, [
          totalCost,
          JSON.stringify(packagesToDependencies(dependencies)),
          packageName,
          packageVersion
        ]);

        packageCostsCache[packageKey] = { standaloneCost, totalCost };
      }

      return { standaloneCost, totalCost };
    };

    // Helper function to map dependencies
    const packagesToDependencies = (dependencies: string[]): { [key: string]: { standaloneCost: number, totalCost: number } } => {
      const depMap: { [key: string]: { standaloneCost: number, totalCost: number } } = {};
      dependencies.forEach(dep => {
        depMap[dep] = packageCostsCache[`${dep}`] || 0;
      });
      return depMap;
    };

    await calculateCosts(packageName, packageVersion, null, null, packageOwner!);

    if (includeDependencies) {
      const sortedPackages = Object.entries(packageCostsCache)
        .sort((a, b) => b[1].totalCost - a[1].totalCost);
      for (const [pkgId, costs] of Object.entries(sortedPackages)) {
        packageCosts[costs[0]] = {
          standaloneCost: costs[1].standaloneCost,
          totalCost: costs[1].totalCost
        };
      }
    } else {
      packageCosts[packageId] = {
        totalCost: packageCostsCache[`${packageId}`].totalCost,
      };
    }

    return sendResponse(200, packageCosts);
  } catch (error) {
    console.error('Get Package Cost Error:', error);
    return sendResponse(500, { message: 'The package rating system choked on at least one of the metrics.' });
  }
};

// Helper function to fetch package size
async function fetchPackageSize(pkgOwner: string, pkgName: string, defaultBranch: string): Promise<number> {
  try {
    const zipUrl = `https://codeload.github.com/${pkgOwner}/${pkgName}/zip/refs/heads/${defaultBranch}`;
    const response = await fetch(zipUrl, {
      headers: {
        Authorization: `Bearer ${process.env.GITHUB_TOKEN}`,
        Accept: 'application/vnd.github.v3+json',
      },
    });

    if (!response.ok) {
      throw new Error('Failed to fetch package size from GitHub');
    }

    const arrayBuffer = await response.arrayBuffer();
    console.log("Array Buffer", arrayBuffer);
    const sizeInMB = arrayBuffer.byteLength / (1024 * 1024); // Convert bytes to MB
    return sizeInMB;
  } catch (error) {
    console.error('Error fetching package size:', error);
    throw error;
  }
}
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
