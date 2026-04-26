import mongoose from 'mongoose';

let cachedConnection: typeof mongoose | null = null;

function maskMongoUri(uri: string) {
  return uri.replace(/:\/\/([^:]+):([^@]+)@/, '://$1:****@');
}

export async function connectDB() {
  if (cachedConnection) return cachedConnection;

  const mongoUri = process.env.MONGODB_URI;
  if (!mongoUri) {
    console.warn('MONGODB_URI is not set. Falling back to in-memory contest data.');
    return null;
  }

  try {
    mongoose.set('strictQuery', true);
    cachedConnection = await mongoose.connect(mongoUri, {
      dbName: process.env.MONGODB_DB || 'divinecode',
      serverSelectionTimeoutMS: 10000
    });

    console.log(`MongoDB connected: ${maskMongoUri(mongoUri)}`);
    return cachedConnection;
  } catch (error) {
    console.error('MongoDB connection failed. Check MONGODB_URI, database user password, and Network Access 0.0.0.0/0.');
    console.error(error instanceof Error ? error.message : error);
    return null;
  }
}
