import { getDb } from '@/src/lib/mongodb';
import { User } from '@/src/models/user';
import { ObjectId, Filter, UpdateFilter, InsertOneResult, WithId } from 'mongodb';

/**
 * Data Access Object for User-related database operations.
 * This layer handles all direct interactions with the MongoDB 'users' collection.
 */
export class UserDao {
  /**
   * Collection name constant
   */
  private static readonly COLLECTION_NAME = 'users';

  /**
   * Gets the users collection
   */
  private static async getCollection() {
    const db = await getDb();
    return db.collection<User>(this.COLLECTION_NAME);
  }

  /**
   * Finds a single user by filter
   * 
   * @param {Filter<User>} filter - MongoDB filter object
   * @returns {Promise<WithId<User> | null>} The user document or null
   */
  static async findOne(filter: Filter<User>): Promise<WithId<User> | null> {
    const collection = await this.getCollection();
    return collection.findOne(filter);
  }

  /**
   * Finds a user by ID
   * 
   * @param {string} id - The user's ID
   * @returns {Promise<WithId<User> | null>} The user document or null
   */
  static async findById(id: string): Promise<WithId<User> | null> {
    if (!ObjectId.isValid(id)) return null;
    return this.findOne({ _id: new ObjectId(id) } as Filter<User>);
  }

  /**
   * Finds a user by email
   * 
   * @param {string} email - The user's email
   * @returns {Promise<WithId<User> | null>} The user document or null
   */
  static async findByEmail(email: string): Promise<WithId<User> | null> {
    return this.findOne({ email });
  }

  /**
   * Finds multiple users with pagination and sorting
   * 
   * @param {Filter<User>} filter - MongoDB filter object
   * @param {number} skip - Number of documents to skip
   * @param {number} limit - Maximum number of documents to return
   * @param {any} sort - Sort configuration
   * @returns {Promise<WithId<User>[]>} Array of user documents
   */
  static async findMany(
    filter: Filter<User> = {},
    skip: number = 0,
    limit: number = 10,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<WithId<User>[]> {
    const collection = await this.getCollection();
    return collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  /**
   * Counts documents matching the filter
   * 
   * @param {Filter<User>} filter - MongoDB filter object
   * @returns {Promise<number>} Count of matching documents
   */
  static async count(filter: Filter<User> = {}): Promise<number> {
    const collection = await this.getCollection();
    return collection.countDocuments(filter);
  }

  /**
   * Inserts a new user document
   * 
   * @param {User} user - The user document to insert
   * @returns {Promise<InsertOneResult<User>>} Result of the insertion
   */
  static async insertOne(user: User): Promise<InsertOneResult<User>> {
    const collection = await this.getCollection();
    return collection.insertOne(user);
  }

  /**
   * Updates a user document by filter
   * 
   * @param {Filter<User>} filter - MongoDB filter object
   * @param {UpdateFilter<User> | Partial<User>} update - Update operations or partial document
   * @returns {Promise<boolean>} True if at least one document was modified
   */
  static async updateOne(filter: Filter<User>, update: UpdateFilter<User> | Partial<User>): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.updateOne(filter, update);
    return result.modifiedCount > 0;
  }

  /**
   * Updates a user document by ID
   * 
   * @param {string} id - The user's ID
   * @param {UpdateFilter<User> | Partial<User>} update - Update operations or partial document
   * @returns {Promise<boolean>} True if at least one document was modified
   */
  static async updateById(id: string, update: UpdateFilter<User> | Partial<User>): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    return this.updateOne({ _id: new ObjectId(id) } as Filter<User>, update);
  }

  /**
   * Deletes a user document by ID
   * 
   * @param {string} id - The user's ID
   * @returns {Promise<boolean>} True if at least one document was deleted
   */
  static async deleteById(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) } as Filter<User>);
    return result.deletedCount > 0;
  }
}

