import { Outlet } from "react-router-dom";
import Navbar from "./components/Navbar";
import "./App.css";
import { ApolloClient, InMemoryCache, createHttpLink, ApolloProvider } from '@apollo/client';
import { setContext } from '@apollo/client/link/context';

// Create the HTTP link to your GraphQL API
const httpLink = createHttpLink({
  uri: '/graphql',
});

// Add authentication to requests
const authLink = setContext((_, { headers }) => {
  // Get the token from localStorage
  const token = localStorage.getItem('id_token');
  
  console.log('Adding token to request:', token ? 'Token exists' : 'No token');
  
  // Return the headers to context
  return {
    headers: {
      ...headers,
      authorization: token ? `Bearer ${token}` : '',
    }
  };
});

// Create the Apollo Client
const client = new ApolloClient({
  link: authLink.concat(httpLink),
  cache: new InMemoryCache()
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
