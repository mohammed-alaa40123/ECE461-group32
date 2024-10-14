import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import pkg from 'pg';
import * as dotenv from 'dotenv';
import { S3Client, DeleteObjectCommand } from "@aws-sdk/client-s3"; // Import DeleteObjectCommand
import fs from "fs";

// Setup
const app = express();
const port = 3000;

// Initialize the S3 client
const s3Client = new S3Client({
  region: "us-east-1",
  credentials: {
    accessKeyId: "AKIAWMFUPINLI3KEL6T2",
    secretAccessKey: "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",
  },
  endpoint: "https://s3.us-east-1.amazonaws.com/",
});

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Multer to handle file uploads
const upload = multer({ dest: 'uploads/' });

// Set up PostgreSQL connection
const { Pool } = pkg;
const db = new Pool({
  host: 'packagesdb.ctgsmc6cetjm.us-east-1.rds.amazonaws.com',
  user: "postgres",
  password: "MbnRHpRAxvsTEaGD54rY",
  database: 'packagesdb',
  port: 5432,
});

// Package data structure
interface Package {
  id: number;
  name: string;
  version: string;
  author: string;
  filePath: string;
}

// Mock in-memory package storage
let packages: Package[] = [];

// Function to delete a file from S3
const deleteFileFromS3 = async (key: string) => {
  try {
    const command = new DeleteObjectCommand({
      Bucket: 's3packteam32', // Replace with your bucket name
      Key: key,
    });

    await s3Client.send(command);
    console.log(`File deleted successfully from S3: ${key}`);
  } catch (error) {
    console.error("Error deleting file from S3:", error);
    throw new Error("S3 deletion failed");
  }
};

// Delete a package by ID
app.delete('/package/:id', async (req: Request, res: Response) => {
  const packageId = parseInt(req.params.id);

  // Check if the package exists in the mock storage
  const packageIndex = packages.findIndex((pkg) => pkg.id === packageId);

  if (packageIndex === -1) {
    return res.status(404).json({ message: 'Package not found' });
  }

  // Remove the package from the mock storage
  const deletedPackage = packages.splice(packageIndex, 1)[0];

  try {
    // Delete metadata from the database
    await db.query('DELETE FROM packages WHERE id = $1', [packageId]);

    // Delete the associated file from S3
    await deleteFileFromS3(deletedPackage.filePath);

    res.status(200).json({ message: 'Package deleted successfully', deletedPackage });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error deleting package', error: err });
  }
});

// ... (other existing routes like PUT, GET remain unchanged)

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
