import "server-only";

import mongoose, { type Mongoose } from "mongoose";
import { DatabaseError } from "./errors";

interface MongooseCache {
  connection: Mongoose | null;
  promise: Promise<Mongoose> | null;
}

const globalWithMongoose = globalThis as typeof globalThis & {
  mongoose?: MongooseCache;
};

const cache = (globalWithMongoose.mongoose ??= {
  connection: null,
  promise: null,
});

export async function connectToDatabase(): Promise<Mongoose> {
  if (cache.connection) return cache.connection;

  const mongoDbUri = process.env.MONGODB_URI;
  if (!mongoDbUri) {
    throw new DatabaseError("CONNECTION_FAILED", "The MONGODB_URI environment variable is not configured.");
  }

  cache.promise ??= mongoose.connect(mongoDbUri).catch((error: unknown) => {
    cache.promise = null;
    throw new DatabaseError("CONNECTION_FAILED", "Unable to connect to MongoDB.", { cause: error });
  });

  cache.connection = await cache.promise;
  return cache.connection;
}
