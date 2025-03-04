import express, { Application, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importaciones de archivos locales (con extensiones .js)
import connectDB from './config/connection.js';
import { typeDefs } from './schemas/typeDefs.js';
import resolvers from './schemas/resolvers.js';
import { authMiddleware } from './services/auth.js';

// Configuración básica
dotenv.config();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar Express
const app: Application = express();

// Middleware esencial
app.use(express.json());
app.use(express.urlencoded({ extended: true }));
app.use(cors());

// Función principal asíncrona para manejar el arranque del servidor
async function startServer() {
  try {
    // Conexión a la base de datos
    await connectDB();
    
    // Configuración y arranque de Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers: resolvers as any, 
      context: authMiddleware,
    });
    
    // Iniciar Apollo Server
    await server.start();
    server.applyMiddleware({ app: app as any });
    
    // Configuración para producción
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../client/build')));
      
      // Todas las rutas no manejadas se redirigen al frontend
      app.get('*', (_: Request, res: Response) => {
        res.sendFile(path.join(__dirname, '../client/build/index.html'));
      });
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🌍 Server running on http://localhost:${PORT}${server.graphqlPath}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
startServer();