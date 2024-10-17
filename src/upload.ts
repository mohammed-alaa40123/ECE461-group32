import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import pkg from 'pg';
import * as dotenv from 'dotenv';
import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
// Setup
const app = express();
const port = 4000;
dotenv.config();

// Initialize the S3 client
const s3Client = new S3Client({
  region: "us-east-1", // e.g., 'us-west-2'
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID || "",
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY || "",
  },
  endpoint: "https://s3.us-east-1.amazonaws.com/", // Use the region-specific endpoint, e.g., 'https://s3.us-east-1.amazonaws.com/'

});

// Function to upload a file to S3
const uploadFileToS3 = async (bucketName: string, filePath: string, key: string) => {
  try {
    // Read file content
    const fileContent = fs.readFileSync(filePath);

    // Create the command for S3 upload
    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,  // Key is the object name (file name in S3)
      Body: fileContent,
    });

    // Upload the file
    const response = await s3Client.send(command);
    console.log("File uploaded successfully:", response);
  } catch (error) {
    console.error("Error uploading file:", error);
  }
};

// Example usage
const bucketName = "s3packteam32";
import { fileURLToPath } from 'url';

// Equivalent of dirname in ES modules
const filename = fileURLToPath(import.meta.url);
const dirname = path.dirname(filename);

const filePath = path.join(dirname, "../packages/express-4.21.1.zip"); // Adjust the file path as necessary
const key = "express-4.21.1.zip"; // Name for the file in S3

//uploadFileToS3(bucketName, filePath, key);

//prerequisites for using aws S3
//npm install aws-sdk
//Install a SQL database client: Install a SQL client like pg for PostgreSQL or mysql2 for MySQL.
//PostgreSQL
//npm install pg

//MySQL
//npm install mysql2


// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Multer to handle file uploads
const upload = multer({ dest: 'packages/' });


//Set up PostgreSQL connection
const { Pool } = pkg;
const db = new Pool({
  host: process.env.DB_HOST,
  user:process.env.DB_USER,
  password: process.env.DB_PASSWORD,
  database: process.env.DB_NAME,
  port: 5432,//Number(process.env.DB_PORT),
})

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

// Upload a package
app.post('/package', upload.single('file'), async (req: Request, res: Response) => {
  const { originalname: name } = req.file!;
  const { version, author } = req.body;
  const filePath = req.file!.path;

  const newPackage: Package = {
    id: packages.length + 1,
    name,
    version,
    author,
    filePath: req.file!.path
  };

  try {
    // Insert metadata into the database
    packages.push(newPackage);
    const result = await db.query(
      'INSERT INTO packages (name, version, author, filePath) VALUES ($1, $2, $3, $4) RETURNING id',
      [name, version, author, filePath]
    );

    const newPackageId = result.rows[0].id;
    
    res.status(201).json({
      message: 'Package uploaded successfully!',
      newPackage: { id: newPackageId, name, version, author, filePath },
    });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: 'Error uploading package', error: err });
  }

  //packages.push(newPackage);
  // This line is redundant and should be removed
  // res.status(201).json({ message: 'Package uploaded successfully!', newPackage });
});

// Update a package by ID
app.put('/package/:id', upload.single('file'), (req: Request, res: Response): void => {
  const packageId = parseInt(req.params.id);
  const { version, author } = req.body;
  const packageToUpdate = packages.find((pkg) => pkg.id === packageId);

  if (!packageToUpdate) {
    res.status(404).json({ message: 'Package not found' });
    return;
  }

  // Update the package data
  packageToUpdate.version = version || packageToUpdate.version;
  packageToUpdate.author = author || packageToUpdate.author;

  if (req.file) {
    packageToUpdate.filePath = req.file.path;
  }

  res.status(200).json({ message: 'Package updated successfully!', packageToUpdate });
});

// Search for packages by name or version
app.get('/packages', (req: Request, res: Response) => {
  const { name, version } = req.query;

  let filteredPackages = packages;

  if (name) {
    filteredPackages = filteredPackages.filter((pkg) => pkg.name.includes(name as string));
  }
  if (version) {
    filteredPackages = filteredPackages.filter((pkg) => pkg.version === version);
  }

  res.status(200).json(filteredPackages);
});

// Get a package by ID
app.get('/package/:id', (req: Request, res: Response) => {
  const packageId = parseInt(req.params.id);
  const package_ = packages.find((pkg) => pkg.id === packageId);

  if (!package_) {
    return res.status(404).json({ message: 'Package not found' });
  }

  res.status(200).json(package_);
});

// Serve the uploaded file
app.get('/package/:id/file', (req: Request, res: Response) => {
  const packageId = parseInt(req.params.id);
  const package_ = packages.find((pkg) => pkg.id === packageId);

  if (!package_) {
    return res.status(404).json({ message: 'Package not found' });
  }

  res.sendFile(path.resolve(package_.filePath));
});

// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
