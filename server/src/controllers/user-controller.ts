import type { Request, Response } from 'express';
import User, { IUser } from '../models/User.js'; 
import { signToken } from '../services/auth.js';

// get a single user by either their id or their username
export const getSingleUser = async (req: Request, res: Response) => {
  const foundUser: IUser | null = await User.findOne({
    $or: [{ _id: req.user ? req.user._id : req.params.id }, { username: req.params.username }],
  });

  if (!foundUser) {
    return res.status(400).json({ message: 'Cannot find a user with this id!' });
  }

  return res.json(foundUser);
};

// create a user, sign a token, and send it back
export const createUser = async (req: Request, res: Response) => {
  const user: IUser = await User.create(req.body); // Explicitly type user as IUser

  if (!user) {
    return res.status(400).json({ message: 'Something is wrong!' });
  }
  const token = signToken({ username: user.username, email: user.email, _id: user._id.toString() });
  return res.json({ token, user });
};

// login a user, sign a token, and send it back
export const login = async (req: Request, res: Response) => {
  const user: IUser | null = await User.findOne({ $or: [{ username: req.body.username }, { email: req.body.email }] });
  if (!user) {
    return res.status(400).json({ message: "Can't find this user" });
  }

  const correctPw = await user.isCorrectPassword(req.body.password);

  if (!correctPw) {
    return res.status(400).json({ message: 'Wrong password!' });
  }

  // Use type assertion to ensure user is not null
  const userId = (user as IUser)._id.toString();
  const token = signToken({ username: user.username, email: user.email, _id: userId });
  return res.json({ token, user });
};

// save a book to a user's `savedBooks` field
export const saveBook = async (req: Request, res: Response) => {
  try {
    const updatedUser: IUser | null = await User.findOneAndUpdate(
      { _id: req.user?._id }, // Use optional chaining
      { $addToSet: { savedBooks: req.body } },
      { new: true, runValidators: true }
    );
    return res.json(updatedUser);
  } catch (err) {
    console.log(err);
    return res.status(400).json(err);
  }
};

// remove a book from `savedBooks`
export const deleteBook = async (req: Request, res: Response) => {
  const updatedUser: IUser | null = await User.findOneAndUpdate(
    { _id: req.user?._id }, // Use optional chaining
    { $pull: { savedBooks: { bookId: req.params.bookId } } },
    { new: true }
  );
  if (!updatedUser) {
    return res.status(404).json({ message: "Couldn't find user with this id!" });
  }
  return res.json(updatedUser);
};