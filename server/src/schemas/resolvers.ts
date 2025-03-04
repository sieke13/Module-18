import models from "../models/index.js";
import { GraphQLError } from 'graphql';
import jwt from 'jsonwebtoken';
import mongoose from 'mongoose';

// Secret key and expiration for JWT
const secret = process.env.JWT_SECRET_KEY || 'secret';
const expiration = '2000h';

// Define User interface - exported for use in other files
export interface User {
    _id: string;
    username: string;
    email: string;
    password: string;
    savedBooks: any[];
    isCorrectPassword(password: string): Promise<boolean>;
}

// Add TypeScript interfaces for resolver arguments
interface BookInput {
  bookId: string;
  authors: string[];
  description: string;
  title: string;
  image?: string;
  link?: string;
}

interface UserInput {
  username: string;
  email: string;
  password: string;
}

// Type for context
interface AuthContext {
  user?: {
    _id: string;
    username: string;
    email: string;
  };
}

// Define the type for resolvers
interface IResolvers {
    Query: {
        me: (_parent: any, _args: any, context: AuthContext) => Promise<any>;
    };
    Mutation: {
        addUser: (_parent: any, args: { input: UserInput }) => Promise<any>;
        login: (_parent: any, args: { email: string; password: string }) => Promise<any>;
        saveBook: (_parent: any, args: { bookData: BookInput }, context: AuthContext) => Promise<any>;
        removeBook: (_parent: any, args: { bookId: string }, context: AuthContext) => Promise<any>;
    };
}

const resolvers: IResolvers = {
    Query: {
        me: async (_parent: any, _args: any, context: AuthContext) => {
            if (context.user) {
                return models.User.findById(context.user._id).populate('savedBooks');
            }
            throw new GraphQLError('Could not authenticate user.', {
                extensions: { code: 'UNAUTHENTICATED' }
            });
        }
    },
    Mutation: {
        addUser: async (_parent: any, { input }: { input: UserInput }) => {
            try {
                // Use the model directly from the imported object
                const user = await models.User.create(input) as unknown as User & { _id: mongoose.Types.ObjectId };
                const token = signToken(user.username, user.email, user._id.toString());
                return { token, user };
            }
            catch (error) {
                console.error('Error creating user:', error);
                throw new Error('Failed to create user');
            }
        },
        login: async (_parent: any, { email, password }: { email: string; password: string }) => {
            // Find a user with the provided email
            const user = await models.User.findOne({ email }) as unknown as User & { _id: mongoose.Types.ObjectId };
            // If no user is found, throw an GraphQLError
            if (!user) {
                throw new GraphQLError('Could not authenticate user.', {
                    extensions: { code: 'UNAUTHENTICATED' }
                });
            }
            
            // Check if the provided password is correct
            const isCorrectPassword = await user.isCorrectPassword(password);
            if (!isCorrectPassword) {
                throw new GraphQLError('Incorrect password.', {
                    extensions: { code: 'UNAUTHENTICATED' }
                });
            }
            
            const token = signToken(user.username, user.email, user._id.toString());
            // Return the token and the user
            return { token, user };
        },
        saveBook: async (_parent: any, { bookData }: { bookData: BookInput }, context: AuthContext) => {
            if (!context.user) {
                throw new GraphQLError('Could not authenticate user.', {
                    extensions: { code: 'UNAUTHENTICATED' }
                });
            }
            try {
                // Use the alternate update approach
                return models.User.findByIdAndUpdate(context.user._id, { $addToSet: { savedBooks: bookData } }, { new: true, runValidators: true }).populate('savedBooks');
            }
            catch (error) {
                console.error('Error saving book:', error);
                throw new Error('Could not save book.');
            }
        },
        removeBook: async (_parent: any, { bookId }: { bookId: string }, context: AuthContext) => {
            if (!context.user) {
                throw new GraphQLError('Could not authenticate user.', {
                    extensions: { code: 'UNAUTHENTICATED' }
                });
            }
            try {
                // Use the alternate update approach
                return models.User.findByIdAndUpdate(context.user._id, { $pull: { savedBooks: { bookId } } }, { new: true }).populate('savedBooks');
            }
            catch (error) {
                console.error('Error removing book:', error);
                throw new Error('Could not remove book.');
            }
        }
    }
};

export default resolvers;

function signToken(username: string, email: string, _id: string) {
    const payload = { username, email, _id };
    return jwt.sign({ data: payload }, secret, { expiresIn: expiration });
}

