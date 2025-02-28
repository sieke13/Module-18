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
        console.log('Fetching books with token:', token ? 'token exists' : 'no token');
        
        const response = await fetch(`${window.location.origin}/api/user-books`, {
          headers: {
            'Authorization': `Bearer ${token}`,
            'Accept': 'application/json'
          }
        });
        
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
          const textResponse = await response.text();
          console.error('Response is not JSON:', textResponse.substring(0, 200));
          throw new Error(`Respuesta inesperada del servidor (${response.status}): No es JSON`);
        }
        
        if (!response.ok) {
          const errorData = await response.json();
          throw new Error(errorData.message || `Error del servidor: ${response.status}`);
        }
        
        const data = await response.json();
        console.log('API Books response:', data);
        
        if (data.success && data.user) {
          console.log('Setting user data from API');
          setUserData(data.user);
        } else {
          console.error('API returned success=false or no user:', data);
          throw new Error(data.message || 'Error loading user data');
        }
      } catch (err) {
        console.error('Error fetching books via REST:', err);
        setError(err instanceof Error ? err : new Error(String(err)));
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
      <Button 
        variant="outline-info"
        onClick={() => {
          const profile = Auth.getProfile() as { data?: { email: string } } | null;
          if (profile && profile.data && profile.data.email) {
            const debugUrl = `/debug-user/${profile.data.email}`;
            window.open(debugUrl, '_blank');
          } else {
            console.error('No se pudo obtener el email del perfil');
          }
        }}
      >
        Ver datos de usuario
      </Button>
      <Button 
        variant="outline-primary"
        className="mt-3"
        onClick={() => {
          const profile = Auth.getProfile() as { data?: { email: string } } | null;
          if (profile?.data?.email) {
            const debugUrl = `${window.location.origin}/debug-user/${profile.data.email}`;
            // Abrir en la misma ventana para que regresar a la aplicación sea más fácil
            window.location.href = debugUrl;
          } else {
            alert('No se pudo obtener el email del perfil');
          }
        }}
      >
        Verificar datos de usuario
      </Button>
      <Button 
        variant="success" 
        className="mt-3 ml-2"
        onClick={() => {
          // Forzar una recarga completa ignorando la caché
          window.location.reload();
        }}
      >
        Recargar página (forzar)
      </Button>
    </Container>
  );
};

export default SavedBooks;