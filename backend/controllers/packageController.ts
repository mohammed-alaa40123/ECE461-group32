import { Request, Response } from 'express';
import { getLogger, logTestResults } from "../src/rating/logger.ts";
import { generatePackageId, PackageInfo, uploadToS3,insertIntoDatabase,updateDatabase,deleteFromDatabase,deleteFromS3, defaultUser,metricCalcFromUrlUsingNetScore } from './controllerHelpers.ts';
import AdmZip, { IZipEntry } from 'adm-zip';


const logger = getLogger();

export async function createPackage(req: Request, res: Response) {
  try {
    logger.console(`Request received: ${JSON.stringify(req.body)}`);

    const { metadata, data } = req.body;

    if (!metadata || !data || !metadata.Name || !metadata.Version) {
      console.log('Missing fields in the package creation request');
      return res.status(400).json({ error: 'Missing fields in the package creation request' });
    }

    const pkgName: string = metadata.Name;
    const pkgVersion: string = metadata.Version;
    const pkgeId: string = generatePackageId(pkgName, pkgVersion);

    if ((data.Content && data.URL) || (!(data.Content) && !(data.URL))) {
      console.log('Invalid package creation request: Bad set of Content and URL');
      return res.status(400).json({ error: 'Invalid package creation request: Bad set of Content and URL' });
    }

    let info: PackageInfo | null;

    if (data.Content) {
      logger.info("createPackage request via zip upload");
      const base64Data = data.Content;

      if (!base64Data) {
        logger.debug("Invalid base64-encoded data");
        return res.status(400).json({ error: 'Invalid base64-encoded data' });
      }

      const base64Buffer = Buffer.from(atob(base64Data), 'binary');

      // Extract package.json from zip file
      const zip = new AdmZip(base64Buffer);
      const zipEntries = zip.getEntries();
      let packageJSON: string | null = null;
      let extractedPackageJson;
      zipEntries.forEach((entry: IZipEntry) => {
        const entryPathParts = entry.entryName.split('/');
        console.log(entryPathParts);
        if (entryPathParts.length === 2 && entryPathParts[1] === 'package.json') {
          packageJSON = entry.getData().toString('utf8');
        }
      });
      if (packageJSON == null) {
        console.log('Invalid package creation request: No package.json found in zip');
        return res.status(400).json({ error: 'Invalid package creation request: No package.json found in zip' });
      } else {
        extractedPackageJson = JSON.parse(packageJSON);
        logger.console(`repo url: ${extractedPackageJson?.repository?.url}, name: ${extractedPackageJson.name}, version: ${extractedPackageJson.version}`);
        if (!extractedPackageJson?.repository?.url || !extractedPackageJson.name || !extractedPackageJson.version) {
          return res.status(400).json({ error: 'Invalid package creation request: package.json must contain repository url, package name, and version' });
        }
      }

      // Get the URL from the info in package.json
      const repoUrl = extractedPackageJson?.repository?.url;
      info = await metricCalcFromUrlUsingNetScore(repoUrl);
      console.log("info", info);
      if (!info) {
        console.error("No package info returned from URL:", repoUrl);
        return res.status(400).json({ error: 'Invalid package creation request: Could not get package info from URL' });
      }

      info.ID = pkgeId;
      info.NAME = extractedPackageJson.name;
      info.VERSION = extractedPackageJson.version;
      info.URL = repoUrl;

      if (info.NET_SCORE < 0.5) {
        logger.console('Invalid package creation request: Package cannot be uploaded due to disqualifying rating.');
        return res.status(424).json({ error: 'Invalid package creation request: Package cannot be uploaded due to disqualifying rating.' });
      }

      // Upload package content to S3
      // await uploadToS3(process.env.AWS_S3_BUCKET_NAME || "", "packages/" + pkgeId + ".zip", base64Buffer);
    } else if (data.URL) {
      logger.console(`createPackage request via public ingest: ${data.URL}`);

      info = await metricCalcFromUrlUsingNetScore(data.URL);

      if (!info) {
        console.log("info", info);
        console.error("No package info returned from URL:", data.URL);
        return res.status(400).json({ error: 'Invalid package creation request: Could not get package info from URL' });
      }

      info.ID = pkgeId;

      if (info.NET_SCORE < 0.5) {
        logger.console('Invalid package creation request: Package cannot be uploaded due to disqualifying rating.');
        return res.status(424).json({ error: 'Invalid package creation request: Package cannot be uploaded due to disqualifying rating.' });
      }

      // Download package content from GitHub using info
      const response = await fetch(`https://api.github.com/repos/${info.OWNER}/${info.NAME}/zipball/HEAD`, {
        headers: {
          Authorization: process.env.GITHUB_TOKEN || "",
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        logger.console('Invalid package creation request: Could not get GitHub url for zip package download');
        return res.status(400).json({ error: 'Invalid package creation request: Could not get GitHub url' });
      }

      const zipBuffer = Buffer.from(await response.arrayBuffer());

      // Upload package content to S3
      // await uploadToS3(process.env.AWS_S3_BUCKET_NAME || "", "packages/" + pkgeId + ".zip", zipBuffer);
    } else {
      logger.console('Invalid package creation request: Bad set of Content and URL');
      return res.status(400).json({ error: 'Invalid package creation request: Bad set of Content and URL' });
    }

    // Store package metadata in PostgreSQL
    await insertIntoDatabase(pkgeId, pkgName, pkgVersion, info.URL, defaultUser.name);

    // Respond with a success message
    logger.console('Package created successfully');
    res.status(200).json({ message: 'Package created successfully' });
  } catch (error) {
    console.error('Error handling POST /package:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function updatePackage(req: Request, res: Response) {
  try {
    const packageId: string = req.params.id;
    const { metadata, data } = req.body;

    if (!metadata || !data || !metadata.Name || !metadata.Version) {
      return res.status(400).json({ error: 'Missing fields in the package update request' });
    }

    const pkgName: string = metadata.Name;
    const pkgVersion: string = metadata.Version;

    if ((data.Content && data.URL) || (!(data.Content) && !(data.URL))) {
      return res.status(400).json({ error: 'Invalid package update request: Bad set of Content and URL' });
    }

    let info: PackageInfo | null;

    if (data.Content) {
      const base64Data = data.Content;

      if (!base64Data) {
        return res.status(400).json({ error: 'Invalid base64-encoded data' });
      }

      const base64Buffer = Buffer.from(atob(base64Data), 'binary');

      // Extract package.json from zip file
      const zip = new AdmZip(base64Buffer);
      const zipEntries = zip.getEntries();
      let packageJSON: string | null = null;
      let extractedPackageJson;
      zipEntries.forEach((entry: IZipEntry) => {
        const entryPathParts = entry.entryName.split('/');
        if (entryPathParts.length === 2 && entryPathParts[1] === 'package.json') {
          packageJSON = entry.getData().toString('utf8');
        }
      });
      if (packageJSON == null) {
        return res.status(400).json({ error: 'Invalid package update request: No package.json found in zip' });
      } else {
        extractedPackageJson = JSON.parse(packageJSON);
        if (!extractedPackageJson?.repository?.url || !extractedPackageJson.name || !extractedPackageJson.version) {
          return res.status(400).json({ error: 'Invalid package update request: package.json must contain repository url, package name, and version' });
        }
      }

      // Get the URL from the info in package.json
      const repoUrl = extractedPackageJson?.repository?.url;
      info = await metricCalcFromUrlUsingNetScore(repoUrl);

      if (!info) {
        return res.status(400).json({ error: 'Invalid package update request: Could not get package info from URL' });
      }

      info.ID = packageId;
      info.NAME = extractedPackageJson.name;
      info.VERSION = extractedPackageJson.version;
      info.URL = repoUrl;

      if (info.NET_SCORE < 0.5) {
        return res.status(424).json({ error: 'Invalid package update request: Package cannot be uploaded due to disqualifying rating.' });
      }

      // Upload package content to S3
      // await uploadToS3(process.env.AWS_S3_BUCKET_NAME || "", "packages/" + packageId + ".zip", base64Buffer);
    } else if (data.URL) {
      info = await metricCalcFromUrlUsingNetScore(data.URL);

      if (!info) {
        return res.status(400).json({ error: 'Invalid package update request: Could not get package info from URL' });
      }

      info.ID = packageId;

      if (info.NET_SCORE < 0.5) {
        return res.status(424).json({ error: 'Invalid package update request: Package cannot be uploaded due to disqualifying rating.' });
      }

      // Download package content from GitHub using info
      const response = await fetch(`https://api.github.com/repos/${info.OWNER}/${info.NAME}/zipball/HEAD`, {
        headers: {
          Authorization: process.env.GITHUB_TOKEN || "",
          Accept: 'application/vnd.github.v3+json',
        },
      });

      if (!response.ok) {
        return res.status(400).json({ error: 'Invalid package update request: Could not get GitHub url for zip package download' });
      }

      const zipBuffer = Buffer.from(await response.arrayBuffer());

      // Upload package content to S3
      // await uploadToS3(process.env.AWS_S3_BUCKET_NAME || "", "packages/" + packageId + ".zip", zipBuffer);
    } else {
      return res.status(400).json({ error: 'Invalid package update request: Bad set of Content and URL' });
    }

    // Update package metadata in PostgreSQL
    // await updateDatabase(packageId, pkgName, pkgVersion, info.URL, defaultUser.name);

    // Respond with a success message
    res.status(200).json({ message: 'Package updated successfully' });
  } catch (error) {
    console.error('Error handling PUT /package/:id:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}

export async function deletePackage(req: Request, res: Response) {
  try {
    const packageId: string = req.params.id;

    if (!packageId) {
      return res.status(400).json({ error: 'Missing package ID' });
    }

    // Delete package content from S3
    // await deleteFromS3(process.env.AWS_S3_BUCKET_NAME || "", "packages/" + packageId + ".zip");

    // Delete package metadata from PostgreSQL
    // await deleteFromDatabase(packageId, defaultUser.name);

    // Respond with a success message
    res.status(200).json({ message: 'Package deleted successfully' });
  } catch (error) {
    console.error('Error handling DELETE /package/:id:', error);
    res.status(500).json({ error: 'Internal Server Error' });
  }
}