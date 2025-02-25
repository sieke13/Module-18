import { Schema, model, Document, ObjectId } from 'mongoose';
import bcrypt from 'bcrypt';

export interface IUser extends Document {
  _id: ObjectId; 
  username: string;
  email: string;
  password: string;
  savedBooks: Array<{
    bookId: string;
    authors: string[];
    description?: string;
    title: string;
    image?: string;
    link?: string;
  }>;
  isCorrectPassword(password: string): Promise<boolean>;
}

const bookSchema = new Schema({
  bookId: {
    type: String,
    required: true,
  },
  authors: [
    {
      type: String,
    },
  ],
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
      unique: true,
    },
    email: {
      type: String,
      required: true,
      unique: true,
    },
    password: {
      type: String,
      required: true,
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