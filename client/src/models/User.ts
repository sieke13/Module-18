import type { Book } from './Book.js';

export interface User {
  username: string;
  email: string;
  password: string;
  savedBooks: Book[];
}

// Add a mock user for testing
export const createMockUser = (userData?: Partial<User>): User => {
  return {
    username: userData?.username || 'mockUser',
    email: userData?.email || 'mock@example.com',
    password: userData?.password || 'mockPassword',
    savedBooks: userData?.savedBooks || []
  };
};
