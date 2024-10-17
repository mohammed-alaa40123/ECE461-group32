import express, { Request, Response } from 'express';
import bodyParser from 'body-parser';
import multer from 'multer';
import path from 'path';
import fs from 'fs-extra';
import unzipper from 'unzipper';
import path from 'path';
import { initializeDB } from './db'; // SQLite setup

// Setup
const app = express();
const port = 3000;

// Middleware to parse JSON bodies
app.use(bodyParser.json());

// Multer to handle file uploads
const upload = multer({ dest: 'uploads/' });

// Package data structure
interface PackageItem {
  id: number;
  name: string;
  version: string;
  author: string;
  filePath: string;
}

// Mock in-memory package storage
let packages: PackageItem[] = [];

// Upload a package
app.post('/package', upload.single('file'), async (req: Request, res: Response) => {
    const db = await initializeDB(); // Initialize the database
    const { file } = req;
  
    if (!file) {
      return res.status(400).json({ message: 'No file uploaded' });
    }
  
    const uploadedFilePath = file.path; // The uploaded file path (ZIP file)
  
    try {
      // Unzip the uploaded package
      const extractionDir = path.join(__dirname, 'extracted', path.basename(uploadedFilePath, '.zip'));
      await fs.mkdirp(extractionDir); // Create directory to extract
  
      // Extract the package to a specific directory
      console.log(`Extracting package to: ${extractionDir}`);
      await fs.createReadStream(uploadedFilePath)
        .pipe(unzipper.Extract({ path: extractionDir }))
        .promise();
  
      // Read package.json from the extracted directory
      const packageJsonPath = path.join(extractionDir, 'package.json');
      if (await fs.pathExists(packageJsonPath)) {
        console.log('package.json found!');
        const packageJson = await fs.readJson(packageJsonPath);
        
        const { name, version, author } = packageJson;
  
        // Log the package info
        console.log(`Extracted package info: Name: ${name}, Version: ${version}, Author: ${author}`);
  
        // Insert package data into SQLite database
        await db.run(
          `INSERT INTO packages (name, version, author, filePath) VALUES (?, ?, ?, ?)`,
          name, version, author, uploadedFilePath
        );
  
        res.status(201).json({
          message: 'Package uploaded and info stored successfully!',
          packageInfo: { name, version, author, filePath: uploadedFilePath }
        });
      } else {
        console.log('package.json not found in the uploaded package.');
        res.status(400).json({ message: 'package.json not found in the uploaded package.' });
      }
    } catch (error) {
      console.error('Error processing package:', error);  // Log the error
      res.status(500).json({ message: 'Internal server error', error });
    }
  });
  

// Update a package by ID
app.put('/package/:id', upload.single('file'), async (req: Request, res: Response) => {
    const db = await initializeDB();  // Initialize the database connection
    const packageId = parseInt(req.params.id);
    const { version, author } = req.body;
  
    // Find the package in the database
    const packageToUpdate = await db.get('SELECT * FROM packages WHERE id = ?', packageId);
  
    if (!packageToUpdate) {
      return res.status(404).json({ message: 'Package not found' });
    }
  
    // Update the package data
    const updatedVersion = version || packageToUpdate.version;
    const updatedAuthor = author || packageToUpdate.author;
    let updatedFilePath = packageToUpdate.filePath;
  
    if (req.file) {
      updatedFilePath = req.file.path;  // Update the file path if a new file is uploaded
    }
  
    // Update the record in the database
    await db.run(
      'UPDATE packages SET version = ?, author = ?, filePath = ? WHERE id = ?',
      updatedVersion, updatedAuthor, updatedFilePath, packageId
    );
  
    res.status(200).json({
      message: 'Package updated successfully!',
      packageInfo: { id: packageId, version: updatedVersion, author: updatedAuthor, filePath: updatedFilePath }
    });
  });
  

// Search for packages by name or version
app.get('/packages', async (req: Request, res: Response) => {
    const db = await initializeDB();
    const { name, version } = req.query;
  
    let query = 'SELECT * FROM packages WHERE 1=1';
    const params: (string | number)[] = [];
  
    // Filter by name if provided
    if (name) {
      query += ' AND name LIKE ?';
      params.push(`%${name}%`);
    }
  
    // Filter by version if provided
    if (version) {
      query += ' AND version = ?';
      params.push(version as string);
    }
  
    // Execute the query and return results
    const filteredPackages = await db.all(query, ...params);
    res.status(200).json(filteredPackages);
  });
  
// Get a package by ID
app.get('/package/:id', async (req: Request, res: Response) => {
    const db = await initializeDB();
    const packageId = parseInt(req.params.id);
  
    // Retrieve the package from the database
    const packageItem = await db.get('SELECT * FROM packages WHERE id = ?', packageId);
  
    if (!packageItem) {
      return res.status(404).json({ message: 'Package not found' });
    }
  
    res.status(200).json(packageItem);
  });
  

// Serve the uploaded file
app.get('/package/:id/file', async (req: Request, res: Response) => {
    const db = await initializeDB();
    const packageId = parseInt(req.params.id);
  
    // Retrieve the package from the database
    const packageItem = await db.get('SELECT * FROM packages WHERE id = ?', packageId);
  
    if (!packageItem) {
      return res.status(404).json({ message: 'Package not found' });
    }
  
    res.sendFile(path.resolve(packageItem.filePath));
  });
  
// Start the server
app.listen(port, () => {
  console.log(`Server is running on port ${port}`);
});
