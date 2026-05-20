import { User } from '@/src/models/user';
import { UserDao } from '@/src/dao/user.dao';
import bcrypt from 'bcryptjs';

/**
 * Service for handling user-related operations.
 * This service provides methods for managing users, including retrieval, creation, and updates.
 */
export class UserService {
  /**
   * Retrieves a paginated list of users from the database.
   * 
   * @param {number} page - The page number to retrieve (starts from 1).
   * @param {number} limit - The number of users to retrieve per page.
   * @returns {Promise<{ users: User[]; total: number; pages: number }>} A promise that resolves to an object containing the users, total count, and total pages.
   */
  static async getUsers(page: number = 1, limit: number = 10): Promise<{ users: User[]; total: number; pages: number }> {
    // Calculate number of documents to skip
    const skip = (page - 1) * limit;

    // Fetch users and total count in parallel using DAO
    const [users, total] = await Promise.all([
      UserDao.findMany({}, skip, limit),
      UserDao.count({})
    ]);

    // Calculate total pages
    const pages = Math.ceil(total / limit);

    console.log(`[UserService] Fetched ${users.length} users (Page ${page}/${pages}, Total: ${total})`);

    return {
      users: users as User[],
      total,
      pages
    };
  }

  /**
   * Creates a new user in the database.
   * 
   * @param {Partial<User> & { password?: string }} userData - The user data to create.
   * @returns {Promise<string>} A promise that resolves to the created user's ID.
   * @throws {Error} If the user already exists or creation fails.
   */
  static async createUser(userData: Partial<User> & { password?: string }): Promise<string> {
    // Check if user already exists using DAO
    if (!userData.email) throw new Error('Email is required');

    const existingUser = await UserDao.findByEmail(userData.email);
    if (existingUser) {
      throw new Error('A user with this email already exists');
    }

    // Hash password if provided, otherwise set a temporary one
    const password = userData.password || Math.random().toString(36).slice(-10);
    const passwordHash = await bcrypt.hash(password, 10);

    const newUser: User = {
      email: userData.email,
      password: passwordHash,
      name: userData.name,
      role: userData.role ?? 'user',
      isActive: userData.isActive ?? true,
      isVerified: userData.isVerified ?? false,
      otp: userData.otp,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // Insert user using DAO
    const result = await UserDao.insertOne(newUser);
    
    console.log(`[UserService] Created new user with email: ${userData.email}, ID: ${result.insertedId}`);
    return result.insertedId.toString();
  }

  /**
   * Updates an existing user's information.
   * 
   * @param {string} userId - The ID of the user to update.
   * @param {Partial<User>} data - The data to update.
   * @returns {Promise<boolean>} A promise that resolves to true if the update was successful.
   */
  static async updateUser(userId: string, data: Partial<User>): Promise<boolean> {
    const updateData = { 
      ...data,
      updatedAt: new Date()
    };

    // Update user using DAO
    const success = await UserDao.updateById(userId, { $set: updateData });

    console.log(`[UserService] Updated user ${userId}:`, success);
    return success;
  }

  /**
   * Deletes a user from the database.
   * 
   * @param {string} userId - The ID of the user to delete.
   * @returns {Promise<boolean>} A promise that resolves to true if the deletion was successful.
   */
  static async deleteUser(userId: string): Promise<boolean> {
    // Delete user using DAO
    const success = await UserDao.deleteById(userId);

    console.log(`[UserService] Deleted user ${userId}:`, success);
    return success;
  }
}

