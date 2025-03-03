// resolvers.js
const bcrypt = require('bcrypt');
const jwt = require('jsonwebtoken');
const { User } = require('./models'); // Asegúrate de importar tus modelos

const resolvers = {
  Mutation: {
    // Mutación para iniciar sesión
    login: async (_: any, { email, password }: { email: string; password: string }) => {
      const user = await User.findOne({ email });
      if (!user) {
        throw new Error('Usuario no encontrado');
      }

      const validPassword = await bcrypt.compare(password, user.password);
      if (!validPassword) {
        throw new Error('Contraseña incorrecta');
      }

      const token = jwt.sign({ userId: user._id }, 'tu_secreto_jwt', { expiresIn: '1h' });
      return {
        token,
        user,
      };
    },

    // Mutación para registrar un nuevo usuario
    addUser: async (_: any, { input }: { input: { username: string; email: string; password: string } }) => {
      const { username, email, password } = input;
      const hashedPassword = await bcrypt.hash(password, 10);

      const user = await User.create({
        username,
        email,
        password: hashedPassword,
      });

      const token = jwt.sign({ userId: user._id }, 'tu_secreto_jwt', { expiresIn: '1h' });
      return {
        token,
        user,
      };
    },

    // Mutación para guardar un libro
    saveBook: async (_: any, { bookData }: { bookData: any }, context: any) => {
      if (!context.user) {
        throw new Error('Debes estar autenticado para realizar esta acción');
      }

      const user = await User.findByIdAndUpdate(
        context.user._id,
        { $push: { savedBooks: bookData } },
        { new: true }
      );

      return user;
    },

    // Mutación para eliminar un libro
    removeBook: async (_: any, { bookId }: { bookId: string }, context: { user: any }) => {
      if (!context.user) {
        throw new Error('Debes estar autenticado para realizar esta acción');
      }

      const user = await User.findByIdAndUpdate(
        context.user._id,
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );

      return user;
    },
  },
};

module.exports = resolvers;
