import { useQuery, useMutation } from '@apollo/client';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';

import Auth from '../utils/auth';
import { removeBookId } from '../utils/localStorage';
import type { Book } from '../models/Book';
import { REMOVE_BOOK } from '../mutations';
import { GET_ME } from '../queries';

const SavedBooks = () => {
  // Add this near the top of your SavedBooks.tsx component
  const isLoggedIn = Auth.loggedIn();
  console.log('Is user logged in?', isLoggedIn);
  console.log('Token:', Auth.getToken());

  // Fetch the user data with logging
  const { loading, error, data, refetch } = useQuery(GET_ME, {
    fetchPolicy: 'network-only', // Don't use cache for this query
    onCompleted: (data) => {
      console.log('User data loaded:', data);
      if (data.me && data.me.savedBooks) {
        console.log('Saved books:', data.me.savedBooks);
      }
    },
    onError: (error) => console.error('Error loading user data:', error),
  });
  
  const userData = data?.me || { savedBooks: [] }; // Default to empty array if savedBooks is missing

  // Log what we're getting
  console.log('SavedBooks data:', data);
  console.log('SavedBooks loading:', loading);
  console.log('SavedBooks error:', error);

  const [removeBook] = useMutation(REMOVE_BOOK, {
    update(cache, { data: { removeBook } }) {
      try {
        // Write back the updated data with the book removed
        cache.writeQuery({
          query: GET_ME,
          data: { me: removeBook }
        });
        
        console.log("Cache updated successfully after book removal");
      } catch (e) {
        console.error("Error updating cache after book removal:", e);
      }
    },
    onCompleted: () => {
      // Force refetch data after deletion
      refetch();
    },
    onError: (error) => {
      console.error("Remove book mutation error:", error);
    }
  });

  // Get the user data from the GraphQL query
 

  // create function that accepts the book's mongo _id value as param and deletes the book from the database
  const handleDeleteBook = async (bookId: string) => {
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      await removeBook({
        variables: { bookId }
      });

      // upon success, remove book's id from localStorage
      removeBookId(bookId);
    } catch (err) {
      console.error(err);
    }
  };

  // if data isn't here yet, say so
  if (loading) {
    return <h2>LOADING...</h2>;
  }

  return (
    <>
      <div className='text-light bg-dark p-5'>
        <Container>
          {userData.username ? (
            <h1>Viewing {userData.username}'s saved books!</h1>
          ) : (
            <h1>Viewing saved books!</h1>
          )}
        </Container>
      </div>
      <Container>
        <h2 className='pt-5'>
          {userData.savedBooks?.length
            ? `Viewing ${userData.savedBooks.length} saved ${
                userData.savedBooks.length === 1 ? 'book' : 'books'
              }:`
            : 'You have no saved books!'}
        </h2>
        <Row>
          {userData.savedBooks?.map((book: Book) => {
            return (
              <Col md='4' key={book.bookId}>
                <Card border='dark'>
                  {book.image ? (
                    <Card.Img
                      src={book.image}
                      alt={`The cover for ${book.title}`}
                      variant='top'
                    />
                  ) : null}
                  <Card.Body>
                    <Card.Title>{book.title}</Card.Title>
                    <p className='small'>Authors: {book.authors.join(', ')}</p>
                    <Card.Text>{book.description}</Card.Text>
                    <Button
                      className='btn-block btn-danger'
                      onClick={() => {
                        console.log('Deleting book with ID:', book.bookId);
                        handleDeleteBook(book.bookId);
                      }}
                    >
                      Delete this Book!
                    </Button>
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

export default SavedBooks;