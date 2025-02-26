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
      // Check if the user is authenticated
      if (!context.user) {
        throw new AuthenticationError('You need to be logged in!');
      }
      
      try {
        console.log('Server saving book:', bookData);
        console.log('For user:', context.user._id);
        
        // Update the user's document
        const updatedUser = await User.findByIdAndUpdate(
          context.user._id,
          { $addToSet: { savedBooks: bookData } },
          { new: true, runValidators: true }
        );
        
        console.log('Updated user:', updatedUser);
        return updatedUser;
      } catch (err) {
        console.error('Server error saving book:', err);
        throw new Error('Failed to save book');
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