import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema(
  {
    name: { type: String, required: true },
    email: { type: String, required: true, unique: true },
    googleId: { type: String },
    avatar: { type: String },
    handle: { type: String },
    createdAt: { type: Date, default: Date.now }
  },
  { timestamps: true }
);

export const UserModel =
  mongoose.models.User || mongoose.model('User', UserSchema);
