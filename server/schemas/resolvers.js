import { AuthenticationError } from 'apollo-server-express';
import { User } from '../models/index.js';
import { signToken } from '../utils/auth.js';  // Añade la extensión .js

export const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      console.log('ME QUERY - Context received:', JSON.stringify(context));
      
      if (!context.user) {
        throw new AuthenticationError('You need to be logged in!');
      }
      
      console.log('Looking for user with ID:', context.user._id);
      
      try {
        const user = await User.findOne({ _id: context.user._id });  // Usa findOne en lugar de findById
        console.log('User found?', !!user);
        return user;
      } catch (err) {
        console.error('Error finding user:', err);
        throw new Error('Error finding user');
      }
    },
  },
  Mutation: {
    addUser: async (parent, args) => {
      console.log("Args: ", args);
      const user = await User.create(args);
      const token = signToken(user);
      return { token, user };
    },
    login: async (parent, { email, password }) => {
      const user = await User.findOne({ email });

      if (!user) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken(user);
      return { token, user };
    },
    saveBook: async (_, { bookData }, context) => {
      console.log('SaveBook mutation called');
      console.log('Context received:', JSON.stringify(context));
      console.log('Book data:', JSON.stringify(bookData));
      
      if (!context.user) {
        console.log('No user in context');
        throw new AuthenticationError('You need to be logged in!');
      }
      
      try {
        // No verificamos context.user._id, lo usamos directamente
        console.log('Attempting to find user with ID:', context.user._id);
        
        // Usar String() para asegurar que el ID sea una cadena
        const userId = String(context.user._id);
        
        // Usar findOne en lugar de findById
        const updatedUser = await User.findOneAndUpdate(
          { _id: userId },
          { 
            $addToSet: { 
              savedBooks: {
                bookId: bookData.bookId,
                title: bookData.title,
                authors: bookData.authors || ['Unknown'],
                description: bookData.description || '',
                image: bookData.image || '',
                link: bookData.link || ''
              }
            }
          },
          { new: true }
        );
        
        if (!updatedUser) {
          console.log('User not found with ID:', userId);
          throw new Error('User not found');
        }
        
        console.log('Book saved successfully');
        return updatedUser;
      } catch (err) {
        console.error('Error in saveBook resolver:', err);
        throw new Error(`Failed to save book: ${err.message}`);
      }
    },
    removeBook: async (parent, { bookId }, context) => {
      if (context.user) {
        const updatedUser = await User.findByIdAndUpdate(
          { _id: context.user._id },
          { $pull: { savedBooks: { bookId } } },
          { new: true }
        );

        return updatedUser;
      }

      throw new AuthenticationError('You need to be logged in!');
    },
  },
};

export default resolvers;