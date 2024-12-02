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
// export const getPackagedatabyID = async (id: string): Promise<Package|null> => {
//   const query = 'select name,version,id,filepath,url,debloat from packages as p where p.id=$1';
  
//   const result = await pool.query(query, [id]);
//   const content="get the content of the file location";//s3 service
//   const jsprog="get the jsprog of the file location";//s3 service
//   if (result.rows.length === 0) return null;
//   const myPackage: Package = {
//     metadata: {
//         Name:  result.rows[0],      // Package name
//         Version: result.rows[1],         // Package version
//         ID: result.rows[2]     // Unique ID for the package
//     },
//     data: {
//         Content: content, // Base64-encoded content of the zip file
//         URL: result.rows[4], // URL for the package
//         debloat:result.rows[5] ,                  // Whether to remove unnecessary bloat
//         JSProgram: jsprog // JavaScript program
//     }
// };
// return myPackage;
// }

// Additional DB functions for other endpoints...
//dependencies are dependencies ids
// content is the path to the content
// export async function package_or_package_id_update_endpoint_query(id:string,name:string,version:string,content:string,url:string,debloat:boolean,upload:boolean,js_program:string,cost:number,dependencies:string[],rate:number[],created_at:Date,updated_at:Date,user_id:number): Promise<void> {
//   let query = "insert into packages(id,name,version,content,url,debloat,js_program,created_at,updated_at) values($1,$2,$3,$4,$5,$6,$7,$8,$9);";
//   await pool.query(query, [id,name,version,content,url,debloat,js_program,created_at.toISOString(),updated_at.toISOString()]);
//   for (let i = 0; i < dependencies.length; i++){
//     query = "insert into dependencies(package_id,dependency_id) values ($1,$2);";
//     await pool.query(query, [id,dependencies[i]]);
  
//   }
//   query="insert into package_ratings(package_id,bus_factor,bus_factor_latency,correctness,correctness_latency,ramp_up,ramp_up_latency,responsive_maintainer,responsive_maintainer_latency,license_score,license_score_latency,good_pinning_practice,good_pinning_practice_latency,pull_request,pull_request_latency,net_score,net_score_latency)values($1,$2,$3,$4,$5,$6,$7,$8,$9,$10,$11,$12,$13,$14,$15,$16,$17);";

//   await pool.query(query, [id,rate[0],rate[1],rate[2],rate[3],rate[4],rate[5],rate[6],rate[7],rate[8],rate[9],rate[10],rate[11],rate[12],rate[13],rate[14],rate[15]]);
//   if(upload)
//   query="insert into package_history(package_id,user_id,date,action) values($1,$2,CURRENT_TIMESTAMP,'CREATE');insert into cost(pkg_id,cost)values($1,$3);";
//   else
//   query="insert into package_history(package_id,user_id,date,action) values($1,$2,CURRENT_TIMESTAMP,'UPDATE');insert into cost(pkg_id,cost)values($1,$3);";
//   await pool.query(query, [id,user_id,cost]);
// };




// export async function reset_endpoint_query(): Promise<void> {
  
//   let query="delete from cost;delete from dependencies;delete from package_history;delete from package_ratings;delete from packages;delete from tracks;delete from user_tracks;delete from users;";

//   await pool.query(query,[]);
// };

// export async function delete_package_id_query(id:string): Promise<void> {
  
//   let query="delete from packages where id=$1;delete from cost where pkg_id=$1;delete from package_history where package_id=$1;delete from dependencies where package_id=$1;delete from package_ratings where package_id=$1;";

//   await pool.query(query,[id]);

// };

// export async function get_package_id_rate_query(user_id:string,id:string): Promise<PackageRating|null> {

//   let query="select * from package_ratings;";

//   let result = await pool.query(query,[id]);
//   if(result.rows.length==0) return null;
//   const packrat:PackageRating = {
//     RampUp: result.rows[0],
//     Correctness:result.rows[2],
//     BusFactor: result.rows[3],
//     ResponsiveMaintainer: result.rows[4],
//     LicenseScore: result.rows[5],
//     GoodPinningPractice:result.rows[6],
//     PullRequest: result.rows[7],
//     NetScore: result.rows[8],
//     RampUpLatency: result.rows[9],
//     CorrectnessLatency:result.rows[10],
//     BusFactorLatency: result.rows[11],
//     ResponsiveMaintainerLatency: result.rows[12],
//     LicenseScoreLatency: result.rows[13],
//     GoodPinningPracticeLatency: result.rows[14],
//     PullRequestLatency: result.rows[15],
//     NetScoreLatency: result.rows[16]
//   };
//   query="insert into package_history(package_id,user_id,date,action) values($1,$2,CURRENT_TIMESTAMP,'CREATE');";
//   await pool.query(query,[id,user_id]);
//   return  packrat;
// };

// export async function get_package_id_cost_query(id:string): Promise<PackageCost|null> {

//   let query="select SUM(cost) from (select  package_id as pid,dependency_id as did from dependencies as d where d.package_id=$1 ) as t , cost as c where c.pkg_id=t.did group by t.pid;";
//   let depcos= await pool.query(query,[id]);
//   query='select cost from cost where pkg_id=$1;'
//   let lonecos= await pool.query(query,[id]);
//   let allcos:number=depcos[0]+lonecos[0]
//   const pkgcost:PackageCost={
//     id:{
//       standaloneCost: lonecos[0],
//     totalCost: allcos
//     }
//   };
//   return pkgcost;
// };


// export async function get_package_by_name(id:string): Promise<PackageHistoryEntry[]|null> {

//   const query = "SELECT u.name AS username,u.is_admin, p.name AS package_name, p.version, p.id AS package_id, h.action, h.date FROM package_history AS h INNER JOIN  packages AS p ON h.package_id = p.id INNER JOIN  users AS u ON h.user_id = u.id;";

//      try {
//       const result = await pool.query(query, [id]);
      
//       // Map the result rows to the PackageHistoryEntry interface
//       const historyEntries: PackageHistoryEntry[] = result.rows.map(row => ({
//           User: {
//               name: row.username, // Assuming username corresponds to name
//               isAdmin: row.is_admin, // Assuming is_admin corresponds to isAdmin
//           },
//           Date: row.date, // Assuming date is in ISO-8601 format
//           PackageMetadata: {
//               Name: row.name, // Assuming name corresponds to the package name
//               Version: row.version, // Assuming version corresponds to the package version
//               ID: row.id, // Assuming id corresponds to the package ID
//           },
//           Action: row.action as PackageHistoryEntry['Action'], // Ensure action is one of the specified types
//       }));

//       return historyEntries;
//   } catch (error) {
//       console.error('Error executing query', error);
//       throw error; // Handle the error as needed
//   }
// };
// Additional DB functions for other endpoints...

