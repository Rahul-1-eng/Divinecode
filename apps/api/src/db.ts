import mongoose from 'mongoose';

let cachedConnection: typeof mongoose | null = null;

export async function connectDB() {
  if (cachedConnection) return cachedConnection;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn('MONGODB_URI is not set. Falling back to in-memory contest data.');
    return null;
  }

  mongoose.set('strictQuery', true);
  cachedConnection = await mongoose.connect(mongoUri, {
    dbName: process.env.MONGODB_DB || 'divinecode'
  });

  console.log('MongoDB connected');
  return cachedConnection;
}
