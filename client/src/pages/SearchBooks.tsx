import { useState, useEffect } from 'react';
import { useMutation } from '@apollo/client';
import { SAVE_BOOK } from '../mutations';
import { GET_ME } from '../queries';
import type { FormEvent } from 'react';
import { Container, Col, Form, Button, Card, Row } from 'react-bootstrap';

import Auth from '../utils/auth';
import { searchGoogleBooks } from '../utils/API';
import { saveBookIds, getSavedBookIds } from '../utils/localStorage';
import type { Book } from '../models/Book';
import type { GoogleAPIBook } from '../models/GoogleAPIBook';

const SearchBooks = () => {
  const [searchedBooks, setSearchedBooks] = useState<Book[]>([]);
  const [searchInput, setSearchInput] = useState('');
  const [savedBookIds, setSavedBookIds] = useState(getSavedBookIds());

  // Set up mutation
  const [saveBook] = useMutation(SAVE_BOOK, {
    update(cache, { data: { saveBook } }) {
      try {
        const { me } = cache.readQuery<{ me: { savedBooks: Book[] } }>({ query: GET_ME }) || { me: { savedBooks: [] } };
        
        if (me) {
          cache.writeQuery({
            query: GET_ME,
            data: { me: { ...me, savedBooks: [...me.savedBooks, saveBook] } },
          });
        }
      } catch (e) {
        console.error(e);
      }
    }
  });

  // Set up effect hook to save `savedBookIds` list to localStorage
  useEffect(() => {
    return () => saveBookIds(savedBookIds);
  }, [savedBookIds]);

  // Create method to search for books and set state
  const handleFormSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (!searchInput) {
      return false;
    }

    try {
      const response = await searchGoogleBooks(searchInput);

      if (!response.ok) {
        throw new Error('something went wrong!');
      }

      const { items } = await response.json();

      const bookData = items.map((book: GoogleAPIBook) => ({
        bookId: book.id,
        authors: book.volumeInfo.authors || ['No author to display'],
        title: book.volumeInfo.title,
        description: book.volumeInfo.description,
        image: book.volumeInfo.imageLinks?.thumbnail || '',
        link: book.volumeInfo.infoLink || book.volumeInfo.canonicalVolumeLink || '',
      }));

      setSearchedBooks(bookData);
      setSearchInput('');
    } catch (err) {
      console.error(err);
    }
  };

  // Function to handle saving a book to the database
  const handleSaveBook = async (bookId: string) => {
    // Find the book in the searchedBooks array
    const bookToSave = searchedBooks.find((book) => book.bookId === bookId);
    
    // Get token
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token || !bookToSave) {
      console.log("Missing token or book not found");
      return false;
    }

    try {
      // Add the link field if it's missing
      const bookWithLink = {
        ...bookToSave,
        link: bookToSave.link || '' // Ensure link has at least empty string
      };
      
      console.log('Saving book with link:', bookWithLink);
      
      const { data, errors } = await saveBook({
        variables: { bookData: bookWithLink },
      });

      console.log('Save book response:', data);
      
      // Log any GraphQL errors
      if (errors) {
        console.error('GraphQL errors:', errors);
      }

      if (data && data.saveBook) {
        // If book successfully saves to user's account, save bookId to state
        setSavedBookIds([...savedBookIds, bookToSave.bookId]);
        console.log('Book saved successfully to state');
      } else {
        console.error('Failed to save book - no data returned');
      }
    } catch (err) {
      console.error('Error saving book:', err);
      
      // Add more detailed error logging
      if (err instanceof Error) {
        console.error('Error message:', err.message);
        console.error('Error stack:', err.stack);
        
        // Apollo Error specific properties
        const apolloError = err as any;
        if (apolloError.graphQLErrors?.length) {
          console.error('GraphQL Errors:', apolloError.graphQLErrors);
        }
        if (apolloError.networkError) {
          console.error('Network Error:', apolloError.networkError);
          if (apolloError.networkError.result) {
            console.error('Network Error Details:', apolloError.networkError.result);
          }
        }
      }
    }
  };

  return (
    <>
      <div className="text-light bg-dark p-5">
        <Container>
          <h1>Search for Books!</h1>
          <Form onSubmit={handleFormSubmit}>
            <Row>
              <Col xs={12} md={8}>
                <Form.Control
                  name='searchInput'
                  value={searchInput}
                  onChange={(e) => setSearchInput(e.target.value)}
                  type='text'
                  size='lg'
                  placeholder='Search for a book'
                />
              </Col>
              <Col xs={12} md={4}>
                <Button type='submit' variant='success' size='lg'>
                  Submit Search
                </Button>
              </Col>
            </Row>
          </Form>
        </Container>
      </div>

      <Container>
        <h2 className='pt-5'>
          {searchedBooks.length
            ? `Viewing ${searchedBooks.length} results:`
            : 'Search for a book to begin'}
        </h2>
        <Row>
          {searchedBooks.map((book) => {
            return (
              <Col md="4" key={book.bookId}>
                <Card border='dark'>
                  {book.image ? (
                    <Card.Img src={book.image} alt={`The cover for ${book.title}`} variant='top' />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className='small'>Authors: {book.authors.join(', ')}</p>
                    <Card.Text>{book.description}</Card.Text>
                    {Auth.loggedIn() && (
                      <Button
                        disabled={savedBookIds?.some((savedBookId: string) => savedBookId === book.bookId)}
                        className='btn-block btn-info'
                        onClick={() => handleSaveBook(book.bookId)}>
                        {savedBookIds?.some((savedBookId: string) => savedBookId === book.bookId)
                          ? 'This book has already been saved!'
                          : 'Save this Book!'}
                      </Button>
                    )}
                  </Card.Body>
                </Card>
              </Col>
            );
          })}
        </Row>
      </Container>
    </>
  );
};

export default SearchBooks;