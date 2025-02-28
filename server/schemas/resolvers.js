const { AuthenticationError } = require('apollo-server-express');
const { User } = require('../models');
const { signToken } = require('../utils/auth');

const resolvers = {
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
      console.log('Context:', context);
      console.log('User in context:', context.user);
      
      // Check if user is authenticated
      if (!context.user) {
        console.log('No authenticated user found');
        throw new AuthenticationError('You need to be logged in!');
      }
      
      try {
        console.log(`Finding user with ID: ${context.user._id}`);
        
        const updatedUser = await User.findOneAndUpdate(
          { _id: context.user._id },
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
        
        if (!updatedUser) {
          console.log(`No user found with ID: ${context.user._id}`);
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

module.exports = resolvers;