import { S3Client, PutObjectCommand } from "@aws-sdk/client-s3";
import fs from "fs";
import path from "path";

// Initialize the S3 client
const s3Client = new S3Client({
  region: "us-east-1", // e.g., 'us-west-2'
  credentials: {
    accessKeyId: "AKIAWMFUPINLI3KEL6T2",
    secretAccessKey: "LSrcuT9q44HvPsVAeG5oskfE1MiDg7YdTB+gq0af",
  },
  endpoint: "https://s3.us-east-1.amazonaws.com", // Use the region-specific endpoint, e.g., 'https://s3.us-east-1.amazonaws.com'

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

// Equivalent of __dirname in ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const filePath = path.join(__dirname, "../packages/express-4.21.1.zip"); // Adjust the file path as necessary
const key = "express-4.21.1.zip"; // Name for the file in S3

uploadFileToS3(bucketName, filePath, key);
