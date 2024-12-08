// src/services/dbService.ts
import  dotenv from 'dotenv';

import { Pool } from 'pg';
import { Package, PackageMetadata, PackageData } from '../models/Package';
import { User } from '../models/User';

dotenv.config();

// Initialize PostgreSQL connection pool
const pool = new Pool({
  host: process.env.RDS_HOST || 'localhost',
  user: process.env.RDS_USER||'postgres',
  password: process.env.RDS_PASSWORD||'password',
  database: process.env.RDS_DATABASE||'postgres',
  port: parseInt(process.env.RDS_PORT || '5432'),
  max: 20, // Adjust based on expected concurrency
  idleTimeoutMillis: 30000,
  connectionTimeoutMillis: 2000,
  ssl: process.env.USE_SSL === 'true' ? { rejectUnauthorized: false } : false

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

export const insertIntoDB = async (metadata: PackageMetadata, data: PackageData): Promise<Package> => {
  const insertText = `
    INSERT INTO packages (id, name,owner, version, url, debloat, js_program,readme)
    VALUES ($1, $2, $3, $4, $5, $6, $7,$8)
    RETURNING *;
  `;
  const insertValues = [
    metadata.ID,
    metadata.Name,
    metadata.Owner,
    metadata.Version,
    data.URL || null,
    data.debloat || false,
    data.JSProgram || null,
    data.readme || null
  ];
  const res = await pool.query(insertText, insertValues);
  return res.rows[0];
};
