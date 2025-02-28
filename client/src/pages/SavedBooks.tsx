import { useQuery, useMutation } from '@apollo/client';
import { GET_ME } from '../queries'; // Asegúrate de que la ruta sea correcta
import { REMOVE_BOOK } from '../mutations'; // Asegúrate de que la ruta sea correcta
import Auth from '../utils/auth';

// Define the SavedBook type
interface SavedBook {
  bookId: string;
  title: string;
  authors?: string[];
  description?: string;
  image?: string;
}
import { Container, Card, Button, Row, Col } from 'react-bootstrap';

const SavedBooks = () => {
  // Añade logs para depuración
  console.log('SavedBooks component rendered');
  console.log('User authenticated:', Auth.loggedIn());
  
  // Usar useQuery para obtener los datos del usuario
  const { loading, error, data, refetch } = useQuery(GET_ME, {
    // Añade esta opción para asegurarte de que el token se incluye
    fetchPolicy: 'network-only'
  });
  
  console.log('Query data:', data);
  console.log('Query error:', error);
  
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

  // Si están cargando los datos, mostrar mensaje
  if (loading) {
    return <h2>CARGANDO...</h2>;
  }

  // Manejar el caso de error
  if (error) {
    console.error('Error loading saved books:', error);
    return (
      <Container>
        <h2>Error cargando libros guardados</h2>
        <p>{error.message}</p>
        <Button onClick={() => Auth.logout()}>Cerrar sesión y volver a intentar</Button>
      </Container>
    );
  }

  // Verificar si tenemos datos
  if (!data || !data.me) {
    console.log('No user data found');
    return (
      <Container>
        <h2>No se encontraron datos de usuario</h2>
        <p>Por favor, inicia sesión para ver tus libros guardados.</p>
        <Button onClick={() => window.location.href = '/login'}>Iniciar sesión</Button>
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