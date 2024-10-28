import { PackageId, User, PackageData } from '../types.ts';
import { S3Client } from "@aws-sdk/client-s3";
import dotenv from 'dotenv';
import crypto from 'crypto';
import pg from 'pg';
import { PutObjectCommand, DeleteObjectCommand, GetObjectCommand } from '@aws-sdk/client-s3';
import {getGithubRepoInfoFromUrl} from "../../src/processURL.ts";
import { calculateNetScore } from '../../src/metrics/netScore.ts';
import { getLogger, logTestResults } from "../../src/logger.ts";

// Load environment variables from .env file
dotenv.config();
if (process.env.AWS_ACCESS_KEY_ID === undefined || process.env.AWS_SECRET_ACCESS_KEY === undefined) {
  throw new Error('AWS_ACCESS_KEY_ID or AWS_SECRET_ACCESS_KEY is not defined in the environment variables');
}
export const s3client = new S3Client({
    region: "us-east-1", // e.g., 'us-west-2'
    credentials: {
      accessKeyId: process.env.AWS_ACCESS_KEY_ID,
      secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
    },
    endpoint: "https://s3.us-east-1.amazonaws.com", // Use the region-specific endpoint, e.g., 'https://s3.us-east-1.amazonaws.com'
  
  });

const { Pool } = pg;
  // Create a new pool instance to manage connections
export const pool = new Pool({
    host: process.env.DB_HOST,
    user:process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    port: 5432,//Number(process.env.DB_PORT),
    connectionTimeoutMillis: 10000, // 10 seconds
    ssl: {
      rejectUnauthorized: false,
    }
  });

export async function uploadToS3(bucketName: string, key: string, body: Buffer): Promise<void> {
    const s3params = {
      Bucket: bucketName,
      Key: key,
      Body: body,
    };
  
    await s3client.send(new PutObjectCommand(s3params))
      .then((response: { $metadata: unknown; }) => {
        console.log("PutObject succeeded, uploaded to S3:", response.$metadata);
      })
      .catch((error: unknown) => {
        console.error("Error storing object to S3:", error);
        throw error;
      });
  }
  
export async function deleteFromS3(bucketName: string, key: string): Promise<void> {
    const s3params = {
      Bucket: bucketName,
      Key: key,
    };
  
    await s3client.send(new DeleteObjectCommand(s3params))
      .then((response: { $metadata: unknown; }) => {
        console.log("DeleteObject succeeded, deleted from S3:", response.$metadata);
      })
      .catch((error: unknown) => {
        console.error("Error deleting object from S3:", error);
        throw error;
      });
  }
  
export async function insertIntoDatabase(pkgeId: string, pkgName: string, pkgVersion: string, url: string, userName: string): Promise<void> {
    const dbParams = {
      text: 'INSERT INTO packages(id, name, version, url) VALUES($1, $2, $3, $4)',
      values: [pkgeId, pkgName, pkgVersion, url],
    };
  
    await pool.query(dbParams)
      .then((response) => {
        console.log("Insert succeeded:", response);
      })
      .catch((error) => {
        console.error("Error storing item in PostgreSQL:", error);
        throw error;
      });
  
    const date = new Date();
    const isoDate = date.toISOString();
    const historyQuery = `
      INSERT INTO package_history (package_id, action, date, user_id)
      VALUES ($1, $2, $3, $4)
    `;
    const historyValues = [pkgeId, 'CREATE', isoDate, userName];
  
    await pool.query(historyQuery, historyValues);
  }
  
export async function updateDatabase(pkgeId: string, pkgName: string, pkgVersion: string, url: string, userName: string): Promise<void> {
    const dbParams = {
      text: 'UPDATE packages SET name = $2, version = $3, url = $4 WHERE id = $1',
      values: [pkgeId, pkgName, pkgVersion, url],
    };
  
    await pool.query(dbParams)
      .then((response) => {
        console.log("Update succeeded:", response);
      })
      .catch((error) => {
        console.error("Error updating item in PostgreSQL:", error);
        throw error;
      });
  
    const date = new Date();
    const isoDate = date.toISOString();
    const historyQuery = `
      INSERT INTO package_history (package_id, action, date, user_name)
      VALUES ($1, $2, $3, $4)
    `;
    const historyValues = [pkgeId, 'UPDATE', isoDate, userName];
  
    await pool.query(historyQuery, historyValues);
  }
  
export async function deleteFromDatabase(pkgeId: string, userName: string): Promise<void> {
    const dbParams = {
      text: 'DELETE FROM packages WHERE id = $1',
      values: [pkgeId],
    };
  
    await pool.query(dbParams)
      .then((response) => {
        console.log("Delete succeeded:", response);
      })
      .catch((error) => {
        console.error("Error deleting item from PostgreSQL:", error);
        throw error;
      });
  
    const date = new Date();
    const isoDate = date.toISOString();
    const historyQuery = `
      INSERT INTO package_history (package_id, action, date, user_name)
      VALUES ($1, $2, $3, $4)
    `;
    const historyValues = [pkgeId, 'DELETE', isoDate, userName];
  
    await pool.query(historyQuery, historyValues);
  }











  
export type PackageInfo = {
	ID: string;
	NAME: string;
	OWNER: string;
	VERSION: string;
	URL: string;
	NET_SCORE: number;
	RAMP_UP_SCORE: number;
	CORRECTNESS_SCORE: number;
	BUS_FACTOR_SCORE: number;
	RESPONSIVE_MAINTAINER_SCORE: number;
	LICENSE_SCORE: number;
	PULL_REQUESTS_SCORE: number;
	PINNED_DEPENDENCIES_SCORE: number;
};

export const defaultUser: User = {
	isAdmin: true,
	name: 'admin',
}; 

export const generatePackageId = (name: string, version: string): string => {
    console.log(`Generating id for ${name}@${version}`);
    
    // Generate a random 63-bit integer to ensure it fits within the positive range of BIGINT
    const randomBytes = crypto.randomBytes(8); // 8 bytes = 64 bits
    let id = BigInt(`0x${randomBytes.toString('hex')}`);
    
    // Ensure the ID is within the positive range of BIGINT
    const maxBigInt = BigInt('9223372');
    id = id % maxBigInt;
    
    console.log(`Generated package id ${id.toString()} for ${name}@${version}`);
    return id.toString();
};


const logger = getLogger();
export async function metricCalcFromUrlUsingNetScore(url: string): Promise<PackageInfo | null> {
  const repoInfo = await getGithubRepoInfoFromUrl(url);
  logger.info("repoInfo:", repoInfo);
  if (repoInfo == null) {
    return null;
  }

  // Calculate Net Score
  const netScoreJSON = await calculateNetScore(undefined,repoInfo);
  if (!netScoreJSON) {
    return null;
  }

  const NetScore = netScoreJSON.NetScore;
  const RampUp = netScoreJSON.RampUp;
  const Correctness = netScoreJSON.Correctness;
  const BusFactor = netScoreJSON.BusFactor;
  const ResponsiveMaintainer = netScoreJSON.ResponsiveMaintainer;
  const License = netScoreJSON.License;
  
  

  // Placeholder values for Pull Requests Score and Pinned Dependencies Score
  const pullRequestsScore = 1; // Placeholder value
  const pinnedDependenciesScore = 1; // Placeholder value

  const currentRepoInfoScores: PackageInfo = {
    ID: "",
    NAME: repoInfo.repo,
    OWNER: repoInfo.owner,
    VERSION: "1.0.0",
    URL: repoInfo.url,
    NET_SCORE: NetScore,
    RAMP_UP_SCORE: RampUp,
    CORRECTNESS_SCORE: Correctness,
    BUS_FACTOR_SCORE: BusFactor,
    RESPONSIVE_MAINTAINER_SCORE: ResponsiveMaintainer,
    LICENSE_SCORE: License,
    PULL_REQUESTS_SCORE: pullRequestsScore,
    PINNED_DEPENDENCIES_SCORE: pinnedDependenciesScore,
  };

  return currentRepoInfoScores;
}

