const jwt = require('jsonwebtoken');

const secret = process.env.JWT_SECRET_KEY || '25c390a9e5dbadc7ef5d650272ff3fcf63819f3f012106bf68606b3d4e849578';
const expiration = '365d';

module.exports = {
  AuthenticationError: class AuthenticationError extends Error {
    constructor(message) {
      super(message);
      this.name = 'AuthenticationError';
    }
  },
  
  authMiddleware: function ({ req }) {
    let token = req.body.token || req.query.token || req.headers.authorization;
    
    if (req.headers.authorization) {
      token = token.split(' ').pop().trim();
    }
    
    if (!token) {
      return { user: null };
    }
    
    try {
      const { data } = jwt.verify(token, secret);
      return { user: data };
    } catch {
      console.log('Invalid token');
      return { user: null };
    }
  },
  
  signToken: function ({ _id, username, email }) {
    const payload = { _id, username, email };
    // CAMBIO AQUÍ: Usar sign en lugar de verify
    return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
  }
};