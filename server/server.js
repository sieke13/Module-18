const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const path = require('path');
const cors = require('cors');
const db = require('./config/connection');
const { typeDefs, resolvers } = require('./schemas');
const { authMiddleware } = require('./utils/auth');
const jwt = require('jsonwebtoken');
const secret = 'your_secret_key';
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3001;

// Apply global middleware first
app.use(cors()); // Enable CORS for all routes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const server = new ApolloServer({
  typeDefs,
  resolvers,
  formatError: (error) => {
    console.error('GraphQL Error:', error);
    return error;
  }
});

async function startServer() {
  await server.start();

  // Debug route to test JWT authentication
  app.get('/debug-auth', (req, res) => {
    try {
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.json({ success: false, message: 'No auth header provided' });
      }
      
      const token = authHeader.split(' ').pop().trim();
      console.log('Token:', token);
      
      const decoded = jwt.verify(token, secret);
      console.log('Decoded token:', decoded);
      
      return res.json({ 
        success: true, 
        user: decoded.data,
        message: 'Token valid' 
      });
    } catch (err) {
      console.error('Debug auth error:', err);
      return res.json({ 
        success: false, 
        message: err.message,
        stack: err.stack
      });
    }
  });

  // Add the new debug-me route here
  app.get('/debug-me', async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.json({ success: false, message: 'No auth header provided' });
    }
    
    try {
      const token = authHeader.split(' ').pop().trim();
      const decoded = jwt.verify(token, secret);
      
      // Test if we can find the user directly
      const user = await User.findById(decoded.data._id);
      
      if (!user) {
        return res.json({
          success: false,
          message: 'User found in token but not in database',
          tokenUser: decoded.data
        });
      }
      
      // Add direct test of saving a book
      const testBook = {
        bookId: 'test-' + Date.now(),
        title: 'Test Book',
        authors: ['Test Author'],
        description: 'Test description'
      };
      
      user.savedBooks.push(testBook);
      await user.save();
      
      return res.json({
        success: true, 
        message: 'User found and test book saved',
        user: {
          _id: user._id.toString(),
          username: user.username,
          books: user.savedBooks.length
        }
      });
    } catch (err) {
      console.error('Debug error:', err);
      return res.json({ success: false, error: err.message });
    }
  });

  // Apply Apollo middleware with specific CORS options
  app.use(
    '/graphql',
    cors({
      origin: ['http://localhost:3000', 'http://127.0.0.1:3000', 'https://module-18.onrender.com'],
      credentials: true,
      methods: ['POST', 'GET', 'OPTIONS'],
      allowedHeaders: ['Content-Type', 'Authorization'],
    }),
    expressMiddleware(server, {
      context: async ({ req }) => {
        const authHeader = req.headers.authorization;
        let user = null;
        
        if (authHeader) {
          try {
            // Get the token from the auth header
            const token = authHeader.split(' ').pop().trim();
            
            // Verify the token using the secret
            const { data } = jwt.verify(token, secret);
            
            // Set user to JUST the decoded data
            user = data;
            
            console.log('User authenticated:', user.username);
            console.log('User ID:', user._id);
          } catch (error) {
            console.error('Token verification error:', error.message);
          }
        }
        
        // Return ONLY the user data, not the entire request
        return { user };
      }
    })
  );

  app.get('/debug-db', async (req, res) => {
    try {
      // Test if we can find the user
      const authHeader = req.headers.authorization;
      
      if (!authHeader) {
        return res.json({ success: false, message: 'No auth header provided' });
      }
      
      const token = authHeader.split(' ').pop().trim();
      const { data } = jwt.verify(token, secret);
      
      const user = await User.findById(data._id); // User is not defined!
      
      if (!user) {
        return res.json({ success: false, message: 'User not found in database' });
      }
      
      return res.json({ 
        success: true, 
        user: {
          _id: user._id,
          username: user.username,
          email: user.email,
          savedBooks: user.savedBooks.length
        }
      });
    } catch (err) {
      return res.json({ success: false, error: err.message });
    }
  });

  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../client/dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.join(__dirname, '../client/dist/index.html'));
    });
  }

  // Start server only after database connection is established
  db.once('open', () => {
    app.listen(PORT, () => {
      console.log(`🌍 Server running on http://localhost:${PORT}`);
      console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`);
    });
  });
}

// Start server with error handling
startServer().catch(err => {
  console.error('Failed to start server:', err);
  process.exit(1);
});