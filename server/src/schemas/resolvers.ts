import User, { IUser } from '../models/User.js';
import { signToken, AuthenticationError } from '../services/auth.js';

const resolvers = {
  Query: {
    me: async (_: any, __: any, context: any) => {
      if (!context.user) {
        return null;
      }
  
      const user = await User.findOne({ _id: context.user._id }).populate('savedBooks');
      console.log('User data from DB:', user); // Log the user data
  
      if (user && user.savedBooks) {
        user.savedBooks = user.savedBooks.filter(book => book !== null); // Filter out null values
        console.log('Filtered savedBooks:', user.savedBooks); // Log the filtered savedBooks
      }
  
      return user;
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
    
      console.log('Book data received:', bookData); // Log the book data
    
      if (!bookData || !bookData.bookId) {
        throw new Error('Invalid book data');
      }
    
      // Ensure required fields are present
      const validatedBookData = {
        bookId: bookData.bookId,
        authors: bookData.authors || ['No author to display'],
        title: bookData.title || 'No title',
        description: bookData.description || '', // Ensure description is not undefined
        image: bookData.image || '',
        link: bookData.link || '',
      };
    
      const updatedUser = await User.findByIdAndUpdate(
        context.user._id,
        { $addToSet: { savedBooks: validatedBookData } },
        { new: true, runValidators: true }
      );
    
      console.log('Updated user after saving book:', updatedUser); // Log the updated user
    
      return updatedUser;
    },

    removeBook: async (_: any, { bookId }: { bookId: string }, context: any) => {
      if (!context.user) {
        throw new AuthenticationError('Not logged in');
      }
    
      console.log('Removing book with ID:', bookId); // Log the book ID
    
      const updatedUser = await User.findByIdAndUpdate(
        context.user._id,
        { $pull: { savedBooks: { bookId } } },
        { new: true }
      );
    
      console.log('Updated user after removing book:', updatedUser); // Log the updated user
    
      return updatedUser;
    }
  }
};

export default resolvers;