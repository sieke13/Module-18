import express, { Application, Request, Response } from 'express';
import path from 'path';
import { fileURLToPath } from 'url';
import { ApolloServer } from 'apollo-server-express';
import cors from 'cors';
import dotenv from 'dotenv';

// Importaciones de archivos locales (sin extensiones .js)
import connectDB from './config/connection';
import { typeDefs } from './schemas/typeDefs';
import { resolvers } from './schemas/resolvers';
import { authMiddleware } from './utils/auth';

// Configuración básica
dotenv.config();
const PORT = process.env.PORT || 3001;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Inicializar Express
const app: Application = express();

// Middleware esencial
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cors());

// Función principal asíncrona para manejar el arranque del servidor
async function startServer() {
  try {
    // Conexión a la base de datos
    await connectDB();
    
    // Configuración y arranque de Apollo Server
    const server = new ApolloServer({
      typeDefs,
      resolvers,
      context: authMiddleware,
    });
    
    // Iniciar Apollo Server
    await server.start();
    server.applyMiddleware({ app });
    
    // Configuración para producción
    if (process.env.NODE_ENV === 'production') {
      app.use(express.static(path.join(__dirname, '../../client/dist')));
      
      // Todas las rutas no manejadas se redirigen al frontend
      app.get('*', (_: Request, res: Response) => {
        res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
      });
    }
    
    // Iniciar servidor
    app.listen(PORT, () => {
      console.log(`🌍 Servidor ejecutándose en http://localhost:${PORT}${server.graphqlPath}`);
    });
  } catch (error) {
    console.error('Error al iniciar el servidor:', error);
    process.exit(1);
  }
}

// Ejecutar la función principal
startServer();