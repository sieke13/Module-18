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
    saveBook: async (_: any, { bookData, userEmail }: { bookData: any; userEmail: string }, context: any) => {
      console.log('SaveBook mutation called');
      console.log('Book data:', JSON.stringify(bookData));
      
      try {
        // Si hay contexto con usuario, usamos ese usuario
        if (context.user && context.user._id) {
          console.log('Using authenticated user:', context.user._id);
          
          // Actualiza el usuario con el libro
          const updatedUser = await User.findOneAndUpdate(
            { _id: context.user._id },
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
          
          if (updatedUser) {
            console.log('Book saved successfully for authenticated user');
            return updatedUser;
          }
        }
        
        // Si hay un email proporcionado, intenta buscar por email
        if (userEmail) {
          console.log('Trying to find user by email:', userEmail);
          
          const userByEmail = await User.findOneAndUpdate(
            { email: userEmail },
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
          
          if (userByEmail) {
            console.log('Book saved successfully for user by email');
            return userByEmail;
          }
        }
        
        // Si no hay usuario autenticado ni email proporcionado, crea un usuario temporal
        console.log('Creating temporary user for book');
        const tempUser = await User.create({
          username: 'temp_' + Date.now(),
          email: 'temp_' + Date.now() + '@example.com',
          password: 'TemporaryPassword123!',
          savedBooks: [{
            bookId: bookData.bookId,
            title: bookData.title,
            authors: bookData.authors || ['Unknown'],
            description: bookData.description || '',
            image: bookData.image || '',
            link: bookData.link || ''
          }]
        });
        
        console.log('Temporary user created with book');
        return tempUser;
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