import { useState } from 'react';
import { useQuery, useMutation } from '@apollo/client';
import { GET_ME } from '../queries';
import { REMOVE_BOOK } from '../mutations';
import Auth from '../utils/auth';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';

interface Book {
  bookId: string;
  image?: string;
  title: string;
  authors?: string[];
  description: string;
}

const SavedBooks = () => {
  const [, setError] = useState<Error | null>(null);

  // Usar solo GraphQL para obtener datos
  const { data, loading, error: graphqlError, refetch } = useQuery(GET_ME, {
    fetchPolicy: 'network-only', // Asegura datos frescos
    errorPolicy: 'all' // Permite continuar con errores
  });
  
  const [removeBook] = useMutation(REMOVE_BOOK, {
    onCompleted: () => {
      // Refrescar datos después de eliminar un libro
      refetch();
    }
  });

  const handleDeleteBook = async (bookId: string) => {
    try {
      await removeBook({
        variables: { bookId }
      });
      // No es necesario actualizar manualmente el estado
      // ya que refetch() lo hará
    } catch (err) {
      console.error('Error al eliminar libro:', err);
      setError(err instanceof Error ? err : new Error('Error desconocido al eliminar libro'));
    }
  };
  
  // Función para recargar datos manualmente
  const handleRefresh = () => {
    refetch();
  };

  if (loading) {
    return <h2>CARGANDO...</h2>;
  }

  // Si hay error o no hay datos, mostrar mensaje apropiado
  if (graphqlError || !data || !data.me) {
    return (
      <Container>
        <h2>No se pudieron cargar tus libros guardados</h2>
        {graphqlError && <p>Error: {graphqlError.message}</p>}
        <div className="d-flex flex-wrap gap-2 mt-3">
          <Button variant="warning" onClick={() => Auth.logout()}>
            Cerrar sesión e intentar de nuevo
          </Button>
          <Button variant="primary" onClick={handleRefresh}>
            Recargar datos
          </Button>
          <Button 
            variant="outline-info"
            onClick={() => {
              const profile = Auth.getProfile() as { data?: { email: string } } | null;
              if (profile?.data?.email) {
                const debugUrl = `${window.location.origin}/debug-user/${profile.data.email}`;
                window.location.href = debugUrl;
              } else {
                alert('No se pudo obtener el email del perfil');
              }
            }}
          >
            Ver datos de usuario
          </Button>
        </div>
      </Container>
    );
  }

  const userData = data.me;

  return (
    <Container>
      <Row>
        {userData.savedBooks && userData.savedBooks.length > 0 ? (
          userData.savedBooks.map((book: Book) => (
            <Col md="4" key={book.bookId} className="mb-4">
              <Card border='dark' className="h-100">
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
          ))
        ) : (
          <Col>
            <p>No tienes libros guardados.</p>
          </Col>
        )}
      </Row>
      
      <div className="mt-4 d-flex flex-wrap gap-2">
        <Button 
          variant="outline-info"
          onClick={() => {
            const profile = Auth.getProfile() as { data?: { email: string } } | null;
            if (profile?.data?.email) {
              const debugUrl = `${window.location.origin}/debug-user/${profile.data.email}`;
              window.open(debugUrl, '_blank');
            } else {
              console.error('No se pudo obtener el email del perfil');
            }
          }}
        >
          Ver datos de usuario
        </Button>
        
        <Button 
          variant="success" 
          onClick={() => {
            window.location.reload();
          }}
        >
          Recargar página
        </Button>
      </div>
    </Container>
  );
};

export default SavedBooks;
