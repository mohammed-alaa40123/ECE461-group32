// src/services/dbService.ts
import  dotenv from 'dotenv';

import { Pool } from 'pg';
import { Package, PackageMetadata, PackageData } from '../models/Package';
import { User } from '../models/User';
import { PackageHistoryEntry } from '../models/PackageHistoryEntry';
import { PackageRating } from '../models/PackageRating';
dotenv.config();

// Initialize PostgreSQL connection pool
const pool = new Pool({
  host: process.env.RDS_HOST,
  user: process.env.RDS_USER,
  password: process.env.RDS_PASSWORD,
  database: process.env.RDS_DATABASE,
  port: parseInt(process.env.RDS_PORT || '5432'),
  max: 20, // Adjust based on expected concurrency
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: {
    rejectUnauthorized: false // This line will fix new error
  }
});

// Export pool for use in other modules
export default pool;

// DB Service Functions

export const getUserByName = async (name: string): Promise<User | null> => {
  const query = 'SELECT * FROM users WHERE name = $1';
  const result = await pool.query(query, [name]);
  if (result.rows.length === 0) return null;
  return result.rows[0];
};

export const createPackage = async (metadata: PackageMetadata, data: PackageData): Promise<Package> => {
  const insertText = `
    INSERT INTO packages (id, name, version, content, url, debloat, js_program)
    VALUES ($1, $2, $3, $4, $5, $6, $7)
    RETURNING *;
  `;
  const insertValues = [
    metadata.ID,
    metadata.Name,
    metadata.Version,
    data.Content || null,
    data.URL || null,
    data.debloat || false,
    data.JSProgram || null,
  ];
  const res = await pool.query(insertText, insertValues);
  return res.rows[0];
};
export const getPackagedatabyID = async (id: string): Promise<Package|null> => {
  const query = 'select id,name,version,content from packages as p where p.id=$1';
  const result = await pool.query(query, [id]);
  if (result.rows.length === 0) return null;
  return result.rows[0];
};
// Additional DB functions for other endpoints...

