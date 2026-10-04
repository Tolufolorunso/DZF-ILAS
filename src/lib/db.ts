import mongoose, { Mongoose } from 'mongoose';

const MONGODB_URI =
  process.env.MONGODB_URI_LOCAL ||
  process.env.MONGODB_URI ||
  'mongodb://127.0.0.1:27017/dzuelsDB';

interface MongooseCache {
  conn: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

declare global {
  var mongooseCache: MongooseCache | undefined;
}

const cached: MongooseCache = global.mongooseCache || { conn: null, promise: null };

if (!global.mongooseCache) {
  global.mongooseCache = cached;
}

/**
 * Connect to MongoDB with cached singleton connection pool
 * Prevents multiple connections during Next.js App Router hot reloads
 */
export async function connectDB(): Promise<Mongoose> {
  if (cached.conn) {
    return cached.conn;
  }

  if (!cached.promise) {
    const opts: mongoose.ConnectOptions = {
      bufferCommands: false,
      maxPoolSize: 10,
      serverSelectionTimeoutMS: 5000,
      socketTimeoutMS: 45000,
    };

    cached.promise = mongoose.connect(MONGODB_URI, opts).then((mongooseInstance) => {
      return mongooseInstance;
    });
  }

  try {
    cached.conn = await cached.promise;
  } catch (error) {
    cached.promise = null;
    throw error;
  }

  return cached.conn;
}

/**
 * Helper to inspect current Mongoose connection status
 */
export function getDatabaseState(): {
  readyState: number;
  status: 'disconnected' | 'connected' | 'connecting' | 'disconnecting' | 'uninitialized';
} {
  const readyState = mongoose.connection.readyState;
  const states: Record<number, 'disconnected' | 'connected' | 'connecting' | 'disconnecting'> = {
    0: 'disconnected',
    1: 'connected',
    2: 'connecting',
    3: 'disconnecting',
  };
  return {
    readyState,
    status: states[readyState] || 'uninitialized',
  };
}

export const getConnectionState = getDatabaseState;

export default connectDB;
