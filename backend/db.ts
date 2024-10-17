import pkg from 'pg';
const { Client } = pkg;

// Set up your database connection
const client = new Client({
  user: 'MoAlaa',
  host: 'database-1.ctgsmc6cetjm.us-east-1.rds.amazonaws.com',
  database: 'testDB',
  password: 'Team32ECE',
  port: 5432,
  idleTimeoutMillis: 30000, // 30 seconds
  connectionTimeoutMillis: 20000, // 2 seconds
  ssl: {
    rejectUnauthorized: false           // AWS RDS might require SSL connection
  }

});

// Function to connect to the database
export const connectDB = async () => {
  try {
    await client.connect();
    console.log('Connected to the database');
  } catch (error) {
    console.error('Failed to connect to the database', error);
  }
};

// Function to close the database connection
export const closeDB = async () => {
  try {
    await client.end();
    console.log('Disconnected from the database');
  } catch (error) {
    console.error('Failed to disconnect from the database', error);
  }
};

export const getUsers = async () => {
  try {
    const res = await client.query('SELECT 1+1 AS result');
    console.log(res.rows); // Array of user data
    return res.rows;
  } catch (error) {
    console.error('Error fetching users', error);
  }
};
