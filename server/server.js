const express = require('express');
const { ApolloServer } = require('@apollo/server');
const { expressMiddleware } = require('@apollo/server/express4');
const path = require('path');
const cors = require('cors');
const db = require('./config/connection');
const { typeDefs, resolvers } = require('./schemas');
const { authMiddleware, signToken } = require('./utils/auth');
const jwt = require('jsonwebtoken');
const secret = process.env.JWT_SECRET_KEY || '25c390a9e5dbadc7ef5d650272ff3fcf63819f3f012106bf68606b3d4e849578';
const User = require('./models/User');

const app = express();
const PORT = process.env.PORT || 3001;

// Apply global middleware first
app.use(cors()); // Enable CORS for all routes
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

// Añade aquí tu endpoint de debug-user
app.get('/debug-user/:email', async (req, res) => {
  try {
    const { email } = req.params;
    
    if (!email) {
      return res.json({
        success: false,
        message: 'Email parameter required'
      });
    }
    
    // Buscar el usuario por email
    let user = await User.findOne({ email });
    
    // Si no existe, crearlo
    if (!user) {
      console.log(`Creating user with email ${email}`);
      
      // Extraer nombre de usuario del email
      const username = email.split('@')[0];
      
      // Crear el usuario
      user = new User({
        username,
        email,
        password: 'Password123!' // Esta contraseña será hasheada automáticamente
      });
      
      await user.save();
      
      return res.json({
        success: true,
        message: 'User created successfully',
        user: {
          _id: user._id,
          username: user.username,
          email: user.email
        },
        note: 'Password has been set to "Password123!"'
      });
    }
    
    // Generar un token para ese usuario
    const token = signToken(user);
    
    // Verificar el token
    const decoded = jwt.verify(token, secret);
    
    return res.json({
      success: true,
      user: {
        id: user._id.toString(),
        username: user.username,
        email: user.email,
        bookCount: user.savedBooks?.length || 0
      },
      token: token,
      decoded: decoded,
      tokenData: decoded.data,
      loginUrl: `https://module-18.onrender.com/login?email=${email}&password=Password123!`
    });
  } catch (err) {
    return res.json({
      success: false,
      message: err.message,
      stack: err.stack
    });
  }
});

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

  // Add this route to your server.js
  app.get('/debug-mongo', async (req, res) => {
    try {
      // Test the basic MongoDB connection
      const collections = await db.db.listCollections().toArray();
      const userCollection = collections.find(c => c.name === 'users');
      
      if (!userCollection) {
        return res.json({
          success: false,
          message: 'Users collection not found',
          collections: collections.map(c => c.name)
        });
      }
      
      // Get a sample user
      const users = await User.find().limit(1);
      
      if (users.length === 0) {
        return res.json({
          success: false,
          message: 'No users found in database',
          collectionExists: true
        });
      }
      
      const sampleUser = users[0];
      
      // Return basic info about the user
      return res.json({
        success: true,
        message: 'MongoDB connection successful',
        collections: collections.map(c => c.name),
        sampleUser: {
          _id: sampleUser._id.toString(),
          username: sampleUser.username,
          email: sampleUser.email,
          bookCount: sampleUser.savedBooks ? sampleUser.savedBooks.length : 0
        }
      });
    } catch (err) {
      console.error('MongoDB debug error:', err);
      return res.json({
        success: false,
        message: 'Error testing MongoDB connection',
        error: err.message,
        stack: err.stack
      });
    }
  });

  // Añade este endpoint antes del middleware de Apollo
  app.get('/debug-token', async (req, res) => {
    const authHeader = req.headers.authorization;
    
    if (!authHeader) {
      return res.json({ success: false, message: 'No auth header provided' });
    }
    
    try {
      const token = authHeader.split(' ').pop().trim();
      
      // Importa jwt directamente
      const jwt = await import('jsonwebtoken');
      const secret = process.env.JWT_SECRET_KEY || '25c390a9e5dbadc7ef5d650272ff3fcf63819f3f012106bf68606b3d4e849578';
      
      const decoded = jwt.default.verify(token, secret);
      const userData = decoded.data;
      
      // Verifica la estructura del token
      if (!userData || !userData._id) {
        return res.json({ 
          success: false, 
          message: 'Token valid but missing user data or ID',
          decoded
        });
      }
      
      // Importa el modelo User
      const { default: User } = await import('./dist/models/User.js');
      
      console.log('Trying to find user with ID:', userData._id);
      
      // Intenta encontrar al usuario
      const user = await User.findById(userData._id);
      
      if (!user) {
        // Si no se encuentra por ID, intenta buscar por email
        const userByEmail = userData.email ? await User.findOne({ email: userData.email }) : null;
        
        if (userByEmail) {
          return res.json({
            success: true,
            message: 'User found by email, not by ID',
            tokenId: userData._id,
            actualUserId: userByEmail._id.toString(),
            email: userData.email,
            username: userByEmail.username
          });
        }
        
        return res.json({
          success: false,
          message: 'User not found in database',
          tokenData: userData
        });
      }
      
      return res.json({
        success: true,
        message: 'User found in database',
        userId: user._id.toString(),
        username: user.username,
        email: user.email,
        bookCount: user.savedBooks?.length || 0
      });
    } catch (err) {
      return res.json({
        success: false,
        message: err.message,
        stack: err.stack
      });
    }
  });

  // Añade este endpoint antes de configurar Apollo Server
  app.get('/debug-user/:email', async (req, res) => {
    try {
      const { email } = req.params;
      
      if (!email) {
        return res.json({
          success: false,
          message: 'Email parameter required'
        });
      }
      
      // Buscar el usuario por email
      let user = await User.findOne({ email });
      
      // Si no existe, crearlo
      if (!user) {
        console.log(`Creating user with email ${email}`);
        
        // Extraer nombre de usuario del email
        const username = email.split('@')[0];
        
        // Crear el usuario
        user = new User({
          username,
          email,
          password: 'Password123!' // Esta contraseña será hasheada automáticamente
        });
        
        await user.save();
        
        return res.json({
          success: true,
          message: 'User created successfully',
          user: {
            _id: user._id,
            username: user.username,
            email: user.email
          },
          note: 'Password has been set to "Password123!"'
        });
      }
      
      // Generar un token para ese usuario
      const token = signToken(user);
      
      // Verificar el token
      const decoded = jwt.verify(token, secret);
      
      return res.json({
        success: true,
        user: {
          id: user._id.toString(),
          username: user.username,
          email: user.email,
          bookCount: user.savedBooks?.length || 0
        },
        token: token,
        decoded: decoded,
        tokenData: decoded.data,
        loginUrl: `https://module-18.onrender.com/login?email=${email}&password=Password123!`
      });
    } catch (err) {
      return res.json({
        success: false,
        message: err.message,
        stack: err.stack
      });
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
        // Obtener el token de autenticación
        const authHeader = req.headers.authorization;
        console.log('Auth header:', authHeader ? 'Present' : 'Missing');
        
        // Si no hay token, retorna null
        if (!authHeader) {
          return { user: null };
        }
        
        try {
          // Extraer el token del encabezado
          const token = authHeader.split(' ').pop().trim();
          console.log('Token extracted:', token ? 'Yes' : 'No');
          
          if (!token) {
            return { user: null };
          }
          
          // Verificar el token
          const decoded = jwt.verify(token, secret);
          console.log('Token verified, data present:', !!decoded?.data);
          
          // Si no hay datos o no hay ID, retornar null
          if (!decoded || !decoded.data) {
            return { user: null };
          }
          
          // Asegurarse de que user._id esté presente
          if (!decoded.data._id) {
            console.log('Warning: User ID missing in token data');
          }
          
          // Usar los datos del token para el contexto
          return { user: decoded.data };
        } catch (err) {
          console.error('Error verifying token:', err);
          return { user: null };
        }
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

  app.get('/api/user-books', async (req, res) => {
    try {
      // Obtener token de autorización
      const authHeader = req.headers.authorization;
      if (!authHeader) {
        return res.status(401).json({
          success: false,
          message: 'No authorization token provided'
        });
      }
      
      // Resto del código...
    } catch (err) {
      return res.status(500).json({
        success: false,
        message: 'Server error',
        error: err.message
      });
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