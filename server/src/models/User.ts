import { Schema, model, Document, ObjectId } from 'mongoose';
import bcrypt from 'bcrypt';
// import { bookSchema } from './Book.js';

export interface IBook {
  bookId: string;
  authors?: string[];
  description?: string;
  title: string;
  image?: string;
  link?: string;
}

export interface IUser extends Document {
  _id: ObjectId; 
  username: string;
  email: string;
  password: string;
  savedBooks?: IBook[];
  isCorrectPassword(password: string): Promise<boolean>;
}

const bookSchema = new Schema<IBook>({
  bookId: {
    type: String,
    required: true,
  },
  authors: [String],
  description: {
    type: String,
  },
  title: {
    type: String,
    required: true,
  },
  image: {
    type: String,
  },
  link: {
    type: String,
  },
});

const userSchema = new Schema<IUser>(
  {
    username: {
      type: String,
      required: true,
      trim: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
      match: [/.+@.+\..+/, 'Must match an email address!'],
    },
    password: {
      type: String,
      required: true,
      minlength: 1,
    },
    savedBooks: [bookSchema],
  },
  {
    toJSON: {
      virtuals: true,
    },
  }
);

userSchema.pre('save', async function (next) {
  if (this.isNew || this.isModified('password')) {
    const saltRounds = 10;
    this.password = await bcrypt.hash(this.password, saltRounds);
  }

  next();
});

userSchema.methods.isCorrectPassword = async function (password: string) {
  return bcrypt.compare(password, this.password);
};

const User = model<IUser>('User', userSchema);

export default User;