import jwt from 'jsonwebtoken';
import { Request } from 'express';
import { GraphQLError } from 'graphql';

const secret = process.env.JWT_SECRET_KEY || 'mysecretkey';
// Originally, it was 1 hour (1h), but for easier testing and avoiding frequent re-authentication,
// we set it to 365 days (1 year) so the token doesn't expire while you work on your project.
const expiration = '365d';

interface UserPayload {
  username: string;
  email: string;
  _id: string;
}

export const signToken = ({ username, email, _id }: UserPayload) => {
  const payload = { username, email, _id };
  return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
};

export const authenticateToken = (req: Request) => {
  let token = req.body.token || req.query.token || req.headers.authorization;

  if (req.headers.authorization) {
    token = token.split(' ').pop()?.trim();
  }

  if (!token) {
    return req;
  }

  try {
    const { data } = jwt.verify(token, secret, { maxAge: expiration }) as { data: UserPayload };
    req.user = data; 
  } catch {
    console.log('❌ Invalid token');
  }

  return req;
};

export class AuthenticationError extends GraphQLError {
  constructor(message: string) {
    super(message, undefined, undefined, undefined, ['UNAUTHENTICATED']);
    Object.defineProperty(this, 'name', { value: 'AuthenticationError' });
  }
}