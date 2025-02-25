import { ApolloClient, InMemoryCache, ApolloProvider, HttpLink, from } from "@apollo/client";
import { onError } from "@apollo/client/link/error";
import { Routes, Route } from "react-router-dom";
import SearchBooks from "./pages/SearchBooks.js";
import SavedBooks from "./pages/SavedBooks.js";
import Navbar from "./components/Navbar.js";

import "./App.css";

// Error handling link
const errorLink = onError(({ graphQLErrors, networkError }) => {
  if (graphQLErrors) {
    graphQLErrors.forEach(({ message, locations, path }) =>
      console.log(`[GraphQL error]: Message: ${message}, Location: ${locations}, Path: ${path}`)
    );
  }
  if (networkError) {
    console.log(`[Network error]: ${networkError}`);
  }
});

// HTTP link
const httpLink = new HttpLink({
  uri: "http://localhost:3001/graphql",
  headers: {
    Authorization: `Bearer ${localStorage.getItem("id_token")}` || "",
  },
});

// Create an Apollo Client instance
const client = new ApolloClient({
  link: from([errorLink, httpLink]),
  cache: new InMemoryCache(),
});

function App() {
  return (
    <ApolloProvider client={client}>
      <>
        <Navbar />
        <Routes>
          <Route path="/" element={<SearchBooks />} />
          <Route path="/saved" element={<SavedBooks />} />
          <Route path="*" element={<h1>404 - Page Not Found</h1>} />
        </Routes>
      </>
    </ApolloProvider>
  );
}

export default App;