import bcrypt from 'bcrypt'
import pool, { getUserByName, createPackage } from '../services/dbService';

async function createUser() {
  const name = 'testuser2';
  const password = 'testpassword2';
  const isAdmin = false;  

  try {
    // Hash the password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Insert the user into the database
    const query = `
      INSERT INTO users (name, password_hash, is_admin)
      VALUES ($1, $2, $3)
    `;
    const values = [name, hashedPassword, isAdmin];

    await pool.query(query, values);
    console.log('User created successfully!');
  } catch (error) {
    console.error('Error creating user:', error);
  }
}

createUser();
