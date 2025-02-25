import { GOOGLE_BOOKS_API_KEY } from "../config.js";

export const searchGoogleBooks = async (query: string) => {
  if (!GOOGLE_BOOKS_API_KEY) {
    console.error("❌ Missing Google Books API Key. Set VITE_GOOGLE_BOOKS_API_KEY in your environment variables.");
    return null;
  }

  try {
    const response = await fetch(
      `https://www.googleapis.com/books/v1/volumes?q=${encodeURIComponent(query)}&key=${GOOGLE_BOOKS_API_KEY}`
    );

    if (!response.ok) {
      throw new Error(`Google Books API request failed: ${response.statusText}`);
    }

    return await response.json();
  } catch (error) {
    console.error("❌ Google Books API Error:", error);
    return null;
  }
};
