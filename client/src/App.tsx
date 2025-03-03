import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./App.css";
import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Crear un enlace HTTP
const httpLink = createHttpLink({
  uri: '/graphql',
});

// Crear un enlace de autenticación
const authLink = setContext((_, { headers }) => {
  // Obtener el token del localStorage
  const token = localStorage.getItem('id_token');
  
  console.log('Token for Apollo:', token ? 'exists' : 'none');
  
  // Devolver los encabezados al contexto
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    },
  };
});

const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache(),
});

function App(): JSX.Element {
  return (
    <ApolloProvider client={client}>
      <Navbar />
      <Outlet /> {/* Aquí se renderizan SearchBooks y SavedBooks según la ruta */}
    </ApolloProvider>
  );
}

export default App;
