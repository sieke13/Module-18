import { AuthenticationError } from 'apollo-server-express';
import { User } from '../models/index.js';
import { signToken } from '../utils/auth';

export const resolvers = {
  Query: {
    me: async (parent, args, context) => {
      console.log('ME query context:', context.user ? 'User found' : 'No user in context');
      
      // If no context.user, the user is not authenticated
      if (!context.user) {
        console.log('User not authenticated');
        return null;
      }

      try {
        // Find the user by ID from the context
        const userData = await User.findOne({ _id: context.user._id })
          .select('-__v -password')
          .populate('savedBooks');
          
        console.log('User data found:', userData ? 'Success' : 'Not found');
        return userData;
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
    saveBook: async (parent, { bookData }, context) => {
      console.log('SaveBook mutation called');
      console.log('Context user:', context.user);
      console.log('Book data:', bookData);
      
      // Check if user is authenticated
      if (!context.user) {
        console.log('No user found in context');
        throw new AuthenticationError('You need to be logged in!');
      }
      
      try {
        console.log(`Finding user with ID: ${context.user._id}`);
        
        // First check if user exists
        const existingUser = await User.findById(context.user._id);
        if (!existingUser) {
          console.log(`User not found with ID: ${context.user._id}`);
          throw new Error('User not found');
        }
        
        console.log('User found, updating with new book');
        
        // Now update with the new book
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { 
            $addToSet: { 
              savedBooks: {
                bookId: bookData.bookId,
                authors: bookData.authors || [],
                description: bookData.description || '',
                title: bookData.title,
                image: bookData.image || '',
                link: bookData.link || ''
              } 
            } 
          },
          { new: true }
        );
        
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