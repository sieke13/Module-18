import { useState, useEffect } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ME } from '../queries';
import { REMOVE_BOOK } from '../mutations';
import Auth from '../utils/auth';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';

const SavedBooks = () => {
  const [userData, setUserData] = useState<UserData | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  
  const { data, loading: graphqlLoading, error: graphqlError } = useQuery(GET_ME, {
    fetchPolicy: 'network-only', // Esto asegura que siempre obtengamos datos frescos
    errorPolicy: 'all' // Esto permite continuar incluso con errores
  });
  
  const [removeBook] = useMutation(REMOVE_BOOK);
  
  // Fallback a REST API si GraphQL falla
  useEffect(() => {
    // Si GraphQL fue exitoso, usamos esos datos
    if (data && data.me) {
      setUserData(data.me);
      setLoading(false);
      return;
    }
    
    // Si GraphQL está cargando, esperamos
    if (graphqlLoading) {
      return;
    }
    
    // Si no hay datos o hubo un error en GraphQL, intentamos con la API REST
    const fetchBooks = async () => {
      try {
        if (!Auth.loggedIn()) {
          setLoading(false);
          setError(new Error('User not logged in'));
          return;
        }
        
        const token = Auth.getToken();
        const response = await fetch('/api/user-books', {
          headers: {
            'Authorization': `Bearer ${token}`
          }
        });
        
        if (!response.ok) {
          throw new Error('Failed to fetch books');
        }
        
        const data = await response.json();
        
        if (data.success && data.user) {
          setUserData(data.user);
        } else {
          throw new Error(data.message || 'Error loading user data');
        }
      } catch (err) {
        console.error('Error fetching books via REST:', err);
        setError(err as Error);
      } finally {
        setLoading(false);
      }
    };
    
    fetchBooks();
  }, [data, graphqlLoading, graphqlError]);

  interface Book {
    bookId: string;
    image?: string;
    title: string;
    authors?: string[];
    description?: string;
  }

  interface UserData {
    savedBooks: Book[];
  }

  const handleDeleteBook = async (bookId: string) => {
    try {
      await removeBook({
        variables: { bookId }
      });
      
      // Actualizar el estado local después de eliminar
      setUserData((prev) => {
        if (!prev) return prev;
        return {
          ...prev,
          savedBooks: prev.savedBooks.filter((book) => book.bookId !== bookId)
        };
      });
    } catch (err) {
      console.error(err);
    }
  };

  if (loading) {
    return <h2>CARGANDO...</h2>;
  }

  if (error) {
    return (
      <Container>
        <h2>Error cargando libros guardados</h2>
        <p>Error: {error.message}</p>
        <Button onClick={() => Auth.logout()}>Cerrar sesión e intentar de nuevo</Button>
        <Button onClick={() => window.location.reload()}>Recargar libros</Button>
      </Container>
    );
  }

  if (!userData) {
    return (
      <Container>
        <h2>No se pudieron cargar tus libros guardados</h2>
        <Button onClick={() => Auth.logout()}>Cerrar sesión e intentar de nuevo</Button>
        <Button onClick={() => window.location.reload()}>Recargar libros</Button>
      </Container>
    );
  }

  return (
    <Container>
      <h2>
        {userData.savedBooks && userData.savedBooks.length
          ? `Viendo ${userData.savedBooks.length} libros guardados:`
          : 'Todavía no has guardado ningún libro'}
      </h2>
      <Row>
        {userData.savedBooks && userData.savedBooks.map((book) => (
          <Col md="4" key={book.bookId}>
            <Card border='dark'>
              {book.image && <Card.Img src={book.image} alt={`La portada para ${book.title}`} variant='top' />}
              <Card.Body>
                <Card.Title>{book.title}</Card.Title>
                <p className='small'>Autores: {book.authors?.join(', ') || 'N/A'}</p>
                <Card.Text>{book.description}</Card.Text>
                <Button
                  className='btn-block btn-danger'
                  onClick={() => handleDeleteBook(book.bookId)}>
                  Eliminar este libro
                </Button>
              </Card.Body>
            </Card>
          </Col>
        ))}
      </Row>
    </Container>
  );
};

export default SavedBooks;