import jwt from 'jsonwebtoken';
import { GraphQLError } from 'graphql';
import dotenv from 'dotenv';
import type { Request } from 'express';
dotenv.config();

// Extend Express Request interface to include user property
declare global {
  namespace Express {
    interface Request {
      user?: any;
    }
  }
}

// Define the AuthResponse type
interface AuthResponse {
  token: string;
  user: {
    username: string;
    email: string;
    _id: string;
  };
}

// Middleware to authenticate token
export const authenticateToken = (req: Request) => {
  // Allows token to be sent via req.body, req.query, or headers
  let token = req.body.token || req.query.token || req.headers.authorization;

  // If the token is sent in the authorization header, extract the token from the header
  if (req.headers.authorization) {
    token = token.split(' ').pop().trim();
  }

  // If no token is provided, return the request object as is
  if (!token) {
    return req;
  }

  // Try to verify the token
  try {
    const { data } = jwt.verify(token, process.env.JWT_SECRET_KEY || '', { maxAge: '24000hr' }) as { data: any };
    // If the token is valid, attach the user data to the request object
    req.user = data;
  } catch (err) {
    // If the token is invalid, log an error message
    console.log('Invalid token');
  }

  // Return the request object
  return req;
};

// Middleware to verify JWT token and add user data to the request object
export const authMiddleware = (req: Request) => {
  // Allows token to be sent via req.body, req.query, or headers
  let token = req.body.token || req.query.token || req.headers.authorization;

  // If the token is sent in the authorization header, extract the token from the header
  if (req.headers.authorization) {
    token = token.split(' ').pop().trim();
  }

  // If no token is provided, return the request object as is
  if (!token) {
    return req;
  }

  // Try to verify the token
  try {
    const { data } = jwt.verify(token, process.env.JWT_SECRET_KEY || '', { maxAge: '2hr' }) as { data: any };
    // If the token is valid, attach the user data to the request object
    req.user = data;
  } catch (err) {
    // If the token is invalid, log an error message
    console.log('Invalid token');
  }

  // Return the request object
  return req;
};

// Function to sign a JWT token for the provided user details
export const signToken = (username: string, email: string, _id: string) => {
  // Create a payload with the user information
  const payload = { username, email, _id };
  const secretKey = process.env.JWT_SECRET_KEY; // Get the secret key from environment variables
  if (!secretKey) {
    throw new Error('Missing JWT_SECRET_KEY');
  }
  // Sign the token with the payload and secret key, and set it to expire in 2 hours
  return jwt.sign({ data: payload }, secretKey, { expiresIn: '200000h' });
};

// Add this function to extract user data from a token
export const getUser = (token: string) => {
  // If no token is provided, return null
  if (!token) {
    return null;
  }

  // Remove "Bearer " if present
  const tokenValue = token.startsWith('Bearer ') 
    ? token.split(' ')[1]
    : token;

  // Try to verify the token
  try {
    const { data } = jwt.verify(
      tokenValue, 
      process.env.JWT_SECRET_KEY || ''
    ) as { data: { username: string; email: string; _id: string } };
    
    // Return the user data from the token
    return data;
  } catch (err) {
    // If the token is invalid, log an error message
    console.log('Invalid token:', err);
    return null;
  }
};

// Custom AuthenticationError class for GraphQL errors
export class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, undefined, undefined, undefined, ['UNAUTHENTICATED']);
    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });

  }
}

// Function to handle user login
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  try {
    const response = await fetch('/api/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ email, password }),
    });

    if (!response.ok) {
      throw new Error('Login failed');
    }

    const data = await response.json();
    return data;
  } catch (error) {
    console.error('Login error:', error);
    throw error;
  }
};