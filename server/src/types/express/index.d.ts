import * as express from 'express';

// Define the User type
interface User {
  _id: string; // Use `string` or `ObjectId` if you're using Mongoose
  username: string;
  email: string;
  // Add any other properties you expect in the user object
}

// Extend the Express Request interface to include the user
declare global {
  namespace Express {
    interface Request {
      user?: User; // user is optional
    }
  }
}