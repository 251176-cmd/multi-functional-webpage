import { MongoClient, Db } from 'mongodb';

/**
 * MongoDB connection utility configuration
 */
const MONGODB_URI = process.env.MONGODB_URI || 'mongodb://localhost:27017/vc4s';
const MONGODB_DB = process.env.MONGODB_DB || 'vc4s';

// Check if the URI is provided
if (!MONGODB_URI) {
  throw new Error('Please define the MONGODB_URI environment variable inside .env.local');
}

/**
 * Cached connection object to be reused across the application
 * This is particularly useful in development to prevent multiple connections
 * during hot-reloads.
 */
interface MongoConnection {
  client: MongoClient;
  db: Db;
}

let cachedConnection: MongoConnection | null = null;

/**
 * Connects to MongoDB and returns the client and database instance.
 * Uses a cached connection if available.
 * 
 * @returns {Promise<MongoConnection>} An object containing the MongoClient and Db instance
 */
export async function connectToDatabase(): Promise<MongoConnection> {
  // If we have a cached connection, return it
  if (cachedConnection) {
    return cachedConnection;
  }

  try {
    // Set up connection options
    const client = new MongoClient(MONGODB_URI);

    // Connect to the cluster
    await client.connect();
    
    // Select the database
    const db = client.db(MONGODB_DB);

    // Cache the connection
    cachedConnection = {
      client,
      db,
    };

    console.log('[MongoDB] Successfully connected to database:', MONGODB_DB);

    return cachedConnection;
  } catch (error) {
    console.error('[MongoDB] Connection error:', error);
    throw new Error('Failed to connect to MongoDB');
  }
}

/**
 * Helper function to get the MongoDB database instance directly.
 * 
 * @returns {Promise<Db>} The MongoDB database instance
 */
export async function getDb(): Promise<Db> {
  const { db } = await connectToDatabase();
  return db;
}

/**
 * Helper function to get the MongoClient instance directly.
 * 
 * @returns {Promise<MongoClient>} The MongoClient instance
 */
export async function getClient(): Promise<MongoClient> {
  const { client } = await connectToDatabase();
  return client;
}

