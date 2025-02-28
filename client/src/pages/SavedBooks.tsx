
import { useQuery, useMutation } from '@apollo/client';
import { GET_ME } from '../queries'; // Asegúrate de que la ruta sea correcta
import { REMOVE_BOOK } from '../mutations'; // Asegúrate de que la ruta sea correcta
import Auth from '../utils/auth';
import { Container, Card, Button, Row, Col } from 'react-bootstrap';

// Define the SavedBook type
interface SavedBook {
  bookId: string;
  title: string;
  authors?: string[];
  description?: string;
  image?: string;
}

const SavedBooks = () => {
  // Logs para depuración
  console.log('Is user logged in?', Auth.loggedIn());
  console.log('Token:', Auth.getToken());
  
  // Usar useQuery para cargar los datos
  const { loading, error, data, refetch } = useQuery(GET_ME, {
    fetchPolicy: 'network-only',
    onCompleted: (data) => console.log('Query completed:', data),
    onError: (error) => console.error('Query error:', error)
  });
  
  console.log('SavedBooks data:', data);
  console.log('SavedBooks loading:', loading);
  console.log('SavedBooks error:', error);
  
  // Configurar la mutación para eliminar libros
  const [removeBook] = useMutation(REMOVE_BOOK);

  // Crear una función para eliminar un libro
  const handleDeleteBook = async (bookId: string): Promise<boolean> => {
    const token = Auth.loggedIn() ? Auth.getToken() : null;

    if (!token) {
      return false;
    }

    try {
      await removeBook({
        variables: { bookId },
      });

      // Refrescar los datos después de eliminar
      refetch();
      return true;
    } catch (err) {
      console.error(err);
      return false;
    }
  };

  // Si está cargando, mostrar mensaje
  if (loading) {
    return <h2>Cargando...</h2>;
  }
  
  // Si hay error, mostrar mensaje
  if (error) {
    console.error('Error fetching saved books:', error);
    return (
      <Container>
        <h2>Error al cargar los libros guardados</h2>
        <p>Error: {error.message}</p>
        <p>Por favor, intenta cerrar sesión y volver a iniciarla.</p>
        <Button onClick={() => Auth.logout()}>Cerrar sesión</Button>
      </Container>
    );
  }
  
  // Verificar si hay datos
  if (!data || !data.me) {
    console.log('User data loaded:', data);
    
    // Si no hay datos pero el usuario está autenticado
    if (Auth.loggedIn()) {
      return (
        <Container>
          <h2>No se pudieron cargar tus libros guardados</h2>
          <p>Tu token de autenticación parece ser válido, pero no pudimos encontrar tus datos.</p>
          <p>Esto puede ocurrir si:</p>
          <ul>
            <li>Tu cuenta fue eliminada del servidor</li>
            <li>Hay un problema con la autenticación en el servidor</li>
            <li>El servidor no puede acceder a la base de datos</li>
          </ul>
          <Button variant="warning" onClick={() => Auth.logout()}>Cerrar sesión e intentar de nuevo</Button>
        </Container>
      );
    }
    
    // Si el usuario no está autenticado
    return (
      <Container>
        <h2>Por favor inicia sesión</h2>
        <p>Debes iniciar sesión para ver tus libros guardados.</p>
        <Button variant="primary" onClick={() => window.location.href = '/login'}>Ir a iniciar sesión</Button>
      </Container>
    );
  }

  const userData = data.me;
  const savedBooks = userData.savedBooks || [];
  
  console.log('User data:', userData);
  console.log('Saved books:', savedBooks);
  
  return (
    <Container>
      <h2>{userData.username}'s libros guardados</h2>
      <p>
        {savedBooks.length
          ? `Viendo ${savedBooks.length} libro(s) guardado(s):`
          : 'Todavía no has guardado ningún libro!'}
      </p>
      
      <Row>
        {savedBooks.map((book: SavedBook) => {
          return (
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
          );
        })}
      </Row>
    </Container>
  );
};

export default SavedBooks;