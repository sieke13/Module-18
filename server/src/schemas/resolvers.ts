import User, { IUser } from '../models/User.js';
import { signToken, AuthenticationError } from '../services/auth.js';

// Al principio de tu archivo resolvers.ts, añade:

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
    saveBook: async (_: any, { bookData, userEmail }: { bookData: any; userEmail: string }, context: any) => {
      console.log('SaveBook mutation called');
      
      try {
        // Log seguro de datos
        if (context.user) {
          console.log('User in context:', {
            id: context.user._id,
            username: context.user.username,
            email: context.user.email
          });
        } else {
          console.log('No user in context');
        }
        
        console.log('Book data:', {
          id: bookData.bookId,
          title: bookData.title
        });
        
        let userId;
        
        // 1. Primero, intentamos obtener un usuario del contexto
        if (context.user && context.user._id) {
          console.log('Using authenticated user ID:', context.user._id);
          userId = context.user._id;
        }
        // 2. Si no hay contexto pero tenemos email, buscar por email
        else if (userEmail) {
          console.log('Looking for user by email:', userEmail);
          const userByEmail = await User.findOne({ email: userEmail });
          if (userByEmail) {
            console.log('Found user by email:', userByEmail._id);
            userId = userByEmail._id;
          }
        }
        
        // Si no tenemos userId por ninguna vía, error
        if (!userId) {
          console.log('No user ID found from context or email');
          throw new AuthenticationError('You need to be logged in!');
        }
        
        // Intentamos usar findOneAndUpdate que es más tolerante
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
          { new: true, runValidators: true }
        );
        
        if (!updatedUser) {
          console.log('User not found with ID:', userId);
          throw new Error('User not found');
        }
        
        console.log('Book saved successfully for user:', updatedUser.username);
        return updatedUser;
      } catch (err) {
        console.error('Error in saveBook resolver:', err instanceof Error ? err.message : 'Unknown error');
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