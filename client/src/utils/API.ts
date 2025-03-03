import type { Book } from "../models/Book";

// Search for books with the Google Books API
export const searchGoogleBooks = async (query: string) => {
  try {
    // You can use the Google Books API without a key for basic searches
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}`
    );

    if (!response.ok) {
      throw new Error(`Google Books API request failed: ${response.statusText}`);
    }

    return response;
  } catch (error) {
    console.error("❌ Google Books API Error:", error);
    throw error;
  }
};

// These REST API functions may not be needed if you're fully using GraphQL
// but keeping them here for backward compatibility

// Get current user data
export const getMe = (token: string) => {
  return fetch('/api/users/me', {
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    },
  });
};

// Delete a book from a user's saved books
export const deleteBook = (bookId: string, token: string) => {
  return fetch(`/api/users/books/${bookId}`, {
    method: 'DELETE',
    headers: {
      authorization: `Bearer ${token}`,
    },
  });
};

// Save a book to the user's saved books
export const saveBook = (bookData: Book, token: string) => {
  return fetch('/api/users/books', {
    method: 'PUT',
    headers: {
      'Content-Type': 'application/json',
      authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(bookData),
  });
};
