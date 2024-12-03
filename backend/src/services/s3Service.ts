// src/services/s3Service.ts

const AWS = require('aws-sdk');

const s3 = new AWS.S3();

// S3 Service Functions



export const uploadPackageContent = async (packageId: string, content: Buffer): Promise<void> => {
  const params = {
    Bucket: process.env.S3_BUCKET!,
    Key: `packages/${packageId}.zip`,
    Body: content,
  };
  await s3.putObject(params).promise();
};

export const getPackageContent = async (packageId: string): Promise<string> => {
  console.log('getPackageContent', packageId);
  const params = {
    Bucket: process.env.S3_BUCKET!,
    Key: `packages/${packageId}.zip`,
  };
  const data = await s3.getObject(params).promise();
  return data.Body!.toString('base64');
};

export const deletePackageContent = async (packageId: string): Promise<void> => {
  const params = {
    Bucket: process.env.S3_BUCKET!,
    Key: `packages/${packageId}.zip`,
  };
  await s3.deleteObject(params).promise();
};

// Additional S3 functions as needed...
