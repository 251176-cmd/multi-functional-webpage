import { getDb } from '@/src/lib/mongodb';
import { Otp } from '@/src/models/otp';
import { InsertOneResult, WithId, DeleteResult } from 'mongodb';

/**
 * Data Access Object for OTP-related database operations.
 * Handles interactions with the 'otps' collection.
 */
export class OtpDao {
  private static readonly COLLECTION_NAME = 'otps';

  private static async getCollection() {
    const db = await getDb();
    return db.collection<Otp>(this.COLLECTION_NAME);
  }

  /**
   * Finds the latest valid OTP for an email and type
   */
  static async findLatestValid(email: string, type: 'registration' | 'password_reset'): Promise<WithId<Otp> | null> {
    const collection = await this.getCollection();
    return collection.findOne(
      { 
        email, 
        type, 
        expiresAt: { $gt: new Date() } 
      },
      { sort: { createdAt: -1 } }
    );
  }

  /**
   * Inserts a new OTP document
   */
  static async insertOne(otp: Otp): Promise<InsertOneResult<Otp>> {
    const collection = await this.getCollection();
    return collection.insertOne(otp);
  }

  /**
   * Deletes all OTPs for a specific email and type (cleanup after use)
   */
  static async deleteByEmailAndType(email: string, type: 'registration' | 'password_reset'): Promise<DeleteResult> {
    const collection = await this.getCollection();
    return collection.deleteMany({ email, type });
  }

  /**
   * Deletes expired OTPs (can be called periodically)
   */
  static async deleteExpired(): Promise<DeleteResult> {
    const collection = await this.getCollection();
    return collection.deleteMany({ expiresAt: { $lt: new Date() } });
  }
}

