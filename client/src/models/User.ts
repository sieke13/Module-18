import type { Book } from './Book.js';

// Define User interface
export interface User {
  _id?: string;
  username: string;
  email: string;
  password: string;
  savedBooks?: Book[];
}

// Define Auth Response interface
export interface AuthResponse {
  token: string;
  user: User;
}

// Initial form state
export const INITIAL_FORM_STATE: User = {
  username: '',
  email: '',
  password: '',
  savedBooks: []
};

// Validation helpers
export const validateUserData = (userData: Partial<User>): string[] => {
  const errors: string[] = [];

  if (!userData.username || userData.username.length < 3) {
    errors.push('Username must be at least 3 characters');
  }

  if (!userData.email || !isValidEmail(userData.email)) {
    errors.push('Please enter a valid email address');
  }

  if (!userData.password || userData.password.length < 6) {
    errors.push('Password must be at least 6 characters');
  }

  return errors;
};

// Email validation
export const isValidEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};
