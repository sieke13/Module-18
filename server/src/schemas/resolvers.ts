import User, { IUser } from '../models/User.js';
import { signToken, AuthenticationError } from '../services/auth.js';

const resolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.user) {
        return null; 
      }
      return User.findOne({ _id: context.user._id }).populate('savedBooks');
    },
  },
  Mutation: {
    login: async (_: any, { email, password }: { email: string; password: string }) => {
      console.log("Incoming Data: ", email, password);
      
      const user: IUser | null = await User.findOne({ email });

      if (!user) {
        console.log('No user.');
        throw new AuthenticationError('Incorrect credentials');
      }

      const correctPw = await user.isCorrectPassword(password);

      if (!correctPw) {
        console.log('Bad password.');
        throw new AuthenticationError('Incorrect credentials');
      }

      const token = signToken({ username: user.username, email: user.email, _id: user._id.toString() });
      return { token, user };
    },

    addUser: async (_: any, { username, email, password }: { username: string; email: string; password: string }) => {
      const user: IUser = await User.create({ username, email, password });
      const token = signToken({ username: user.username, email: user.email, _id: user._id.toString() });
      return { token, user };
    },

    saveBook: async (_: any, { bookData }: { bookData: any }, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('Not logged in');
      }
      
      if (!bookData || !bookData.bookId) {
        throw new Error('Invalid book data'); 
      }

      return User.findByIdAndUpdate(
        context.user._id,
        { $addToSet: { savedBooks: bookData } },
        { new: true, runValidators: true }
      );
    },

    removeBook: async (_: any, { bookId }: { bookId: string }, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('Not logged in');
      }

      if (!bookId) {
        throw new Error('Book ID is required'); 
      }

      return User.findByIdAndUpdate(
        context.user._id,
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );
    },
  },
};

export default resolvers;
