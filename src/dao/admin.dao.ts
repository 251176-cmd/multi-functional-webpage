import { getDb } from '@/src/lib/mongodb';
import { AdminUser } from '@/src/models/admin-user';
import { ObjectId, Filter, UpdateFilter, InsertOneResult, WithId } from 'mongodb';

/**
 * Data Access Object for Admin User-related database operations.
 * This layer handles all direct interactions with the MongoDB 'admin_users' collection.
 */
export class AdminDao {
  /**
   * Collection name constant
   */
  private static readonly COLLECTION_NAME = 'admin_users';

  /**
   * Gets the admin_users collection
   */
  private static async getCollection() {
    const db = await getDb();
    return db.collection<AdminUser>(this.COLLECTION_NAME);
  }

  /**
   * Finds a single admin user by filter
   * 
   * @param {Filter<AdminUser>} filter - MongoDB filter object
   * @returns {Promise<WithId<AdminUser> | null>} The admin user document or null
   */
  static async findOne(filter: Filter<AdminUser>): Promise<WithId<AdminUser> | null> {
    const collection = await this.getCollection();
    return collection.findOne(filter);
  }

  /**
   * Finds an admin user by ID
   * 
   * @param {string} id - The admin's ID
   * @returns {Promise<WithId<AdminUser> | null>} The admin user document or null
   */
  static async findById(id: string): Promise<WithId<AdminUser> | null> {
    if (!ObjectId.isValid(id)) return null;
    return this.findOne({ _id: new ObjectId(id) } as Filter<AdminUser>);
  }

  /**
   * Finds an admin user by email
   * 
   * @param {string} email - The admin's email
   * @returns {Promise<WithId<AdminUser> | null>} The admin user document or null
   */
  static async findByEmail(email: string): Promise<WithId<AdminUser> | null> {
    return this.findOne({ email });
  }

  /**
   * Finds multiple admin users with pagination and sorting
   * 
   * @param {Filter<AdminUser>} filter - MongoDB filter object
   * @param {number} skip - Number of documents to skip
   * @param {number} limit - Maximum number of documents to return
   * @param {any} sort - Sort configuration
   * @returns {Promise<WithId<AdminUser>[]>} Array of admin user documents
   */
  static async findMany(
    filter: Filter<AdminUser> = {},
    skip: number = 0,
    limit: number = 10,
    sort: Record<string, 1 | -1> = { createdAt: -1 }
  ): Promise<WithId<AdminUser>[]> {
    const collection = await this.getCollection();
    return collection
      .find(filter)
      .sort(sort)
      .skip(skip)
      .limit(limit)
      .toArray();
  }

  /**
   * Counts admin user documents matching the filter
   * 
   * @param {Filter<AdminUser>} filter - MongoDB filter object
   * @returns {Promise<number>} Count of matching documents
   */
  static async count(filter: Filter<AdminUser> = {}): Promise<number> {
    const collection = await this.getCollection();
    return collection.countDocuments(filter);
  }

  /**
   * Inserts a new admin user document
   * 
   * @param {AdminUser} admin - The admin user document to insert
   * @returns {Promise<InsertOneResult<AdminUser>>} Result of the insertion
   */
  static async insertOne(admin: AdminUser): Promise<InsertOneResult<AdminUser>> {
    const collection = await this.getCollection();
    return collection.insertOne(admin);
  }

  /**
   * Updates an admin user document by filter
   * 
   * @param {Filter<AdminUser>} filter - MongoDB filter object
   * @param {UpdateFilter<AdminUser> | Partial<AdminUser>} update - Update operations or partial document
   * @returns {Promise<boolean>} True if at least one document was modified
   */
  static async updateOne(filter: Filter<AdminUser>, update: UpdateFilter<AdminUser> | Partial<AdminUser>): Promise<boolean> {
    const collection = await this.getCollection();
    const result = await collection.updateOne(filter, update);
    return result.modifiedCount > 0;
  }

  /**
   * Updates an admin user document by ID
   * 
   * @param {string} id - The admin's ID
   * @param {UpdateFilter<AdminUser> | Partial<AdminUser>} update - Update operations or partial document
   * @returns {Promise<boolean>} True if at least one document was modified
   */
  static async updateById(id: string, update: UpdateFilter<AdminUser> | Partial<AdminUser>): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    return this.updateOne({ _id: new ObjectId(id) } as Filter<AdminUser>, update);
  }

  /**
   * Deletes an admin user document by ID
   * 
   * @param {string} id - The admin's ID
   * @returns {Promise<boolean>} True if at least one document was deleted
   */
  static async deleteById(id: string): Promise<boolean> {
    if (!ObjectId.isValid(id)) return false;
    const collection = await this.getCollection();
    const result = await collection.deleteOne({ _id: new ObjectId(id) } as Filter<AdminUser>);
    return result.deletedCount > 0;
  }
}

