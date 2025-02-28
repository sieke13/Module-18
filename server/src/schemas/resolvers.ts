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
      console.log('SaveBook mutation called');
      console.log('Context user:', context.user);
      console.log('Book data:', bookData);
      
      // Check if user is authenticated
      if (!context.user) {
        console.log('No user in context');
        throw new AuthenticationError('You need to be logged in!');
      }
    
      try {
        // Make sure all required fields are present
        if (!bookData.bookId || !bookData.title) {
          console.log('Missing required book fields');
          throw new Error('Book data is missing required fields');
        }
        
        // Find the user by ID
        const user = await User.findById(context.user._id);
        
        if (!user) {
          console.log('User not found with ID:', context.user._id);
          throw new Error('User not found');
        }
        
        // Carefully construct the book object with all fields to match schema
        const bookToSave = {
          bookId: bookData.bookId,
          authors: Array.isArray(bookData.authors) ? bookData.authors : [], 
          description: bookData.description || '',
          title: bookData.title,
          image: bookData.image || '',
          link: bookData.link || ''
        };
        
        // Update user with new book
        if (!user.savedBooks) {
          user.savedBooks = [];
        }
        user.savedBooks.push(bookToSave);
        await user.save();
        
        console.log('Book saved successfully');
        return user;
      } catch (err) {
        console.error('Error in saveBook resolver:', err);
        if (err instanceof Error) {
          throw new Error(`Failed to save book: ${err.message}`);
        } else {
          throw new Error('Failed to save book due to an unknown error');
        }
      }
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