import { Request, Response } from 'express';
import jwt from 'jsonwebtoken';

import dotenv from 'dotenv';

// Load environment variables from .env file
dotenv.config();

const JWT_SECRET = process.env.JWT_SECRET;
if (!JWT_SECRET) {
  throw new Error('JWT_SECRET is not defined in the environment variables');
}
// Function to generate a JWT token
const generateToken = (userId: string) => {
  return jwt.sign({ userId }, JWT_SECRET, { expiresIn: '1h' });
};

// Controller function for handling the PUT request to /authenticate
export const createAuthToken = (req: Request, res: Response) => {
  console.log('Request received:', req.body);

  const { User, Secret } = req.body;

  if (!User || !Secret || !User.name || !Secret.password) {
    console.log('Missing fields in the AuthenticationRequest');
    return res.status(400).json({ error: 'Missing fields in the AuthenticationRequest' });
  }

  // Replace this with your actual user validation logic
  const isValidUser = User.name === 'ece30861defaultadminuser' && Secret.password === 'correcthorsebatterystaple123';
  console.log('User validation:', isValidUser);
  console.log('User:', User.name);
  console.log('Secret:', Secret.password);
  if (!isValidUser) {
    console.log('Invalid user or password');
    return res.status(401).json({ error: 'Invalid user or password' });
  }

  const token = generateToken(User.name);

  console.log('Token generated:', `bearer ${token}`);
  return res.status(200).json({ token: `bearer ${token}` });
};