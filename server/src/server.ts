import express from 'express';
import { Request, Response } from 'express';
import path from 'node:path';
import { fileURLToPath } from 'url';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@apollo/server/express4';
import cors from 'cors';
import dotenv from 'dotenv';

import connectDB from './config/connection.js'; 
import typeDefs from './schemas/typeDefs';

const jwt = require('jsonwebtoken');

const secret = 'mysecretsshhhhh';
const expiration = '2h';

module.exports = {
  authMiddleware: function ({ req }: { req: Request }) {
    let token = req.headers.authorization || '';

    if (token) {
      token = token.split(' ').pop()?.trim() || '';
    }

    if (!token) {
      return req;
    }

    try {
      const { data } = jwt.verify(token, secret, { maxAge: expiration });
      req.user = data;
    } catch {
      console.log('Invalid token');
    }

    return req;
  },
  signToken: function ({ username, email, _id }: { username: string; email: string; _id: string }) {
    const payload = { username, email, _id };
    return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
  },
};

// ✅ Manually Define __dirname
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

const PORT = process.env.PORT || 3001;
const app = express();

// ✅ Connect to MongoDB (Fixed)
await connectDB();

// ✅ Initialize Apollo Server
const resolvers = {
  Query: {
    // your query resolvers
  },
  Mutation: {
    // your mutation resolvers
  },
};

export { resolvers };

// Use the authMiddleware from this file since it's already defined above
const { authMiddleware } = module.exports;

const server = new ApolloServer({
  typeDefs,
  resolvers,
});

const startApolloServer = async () => {
  await server.start();

  app.use(express.json());
  app.use(express.urlencoded({ extended: false }));

  // ✅ Apply Apollo GraphQL Middleware with Authentication
  app.use(
    '/graphql',
    cors(),
    expressMiddleware(server, {
      context: authMiddleware
    })
  );

  // ✅ Serve Static Assets in Production
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.join(__dirname, '../../client/dist')));

    app.get('*', (_: Request, res: Response) => {
      res.sendFile(path.join(__dirname, '../../client/dist/index.html'));
    });
  }

  // ✅ Start Server
  app.listen(PORT, () => {
    console.log(`🌍 Server running on http://localhost:${PORT}`);
    console.log(`🚀 GraphQL ready at http://localhost:${PORT}/graphql`);
  });
};

startApolloServer();