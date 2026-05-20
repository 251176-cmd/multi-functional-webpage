import { z } from 'zod';
import { ObjectId } from 'mongodb';

/**
 * AdminUser Zod Schema
 * Defines the structure of an admin user document in MongoDB.
 * Admins can login to the backend portal with email and password.
 */
export const AdminUserSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  email: z.string().email({ message: "Invalid admin email address" }),
  password: z.string().min(10, { message: "Admin password must be at least 10 characters long" }),
  name: z.string().min(2),
  permissions: z.array(z.string()).default(['all']),
  isActive: z.boolean().default(true),
  otp: z.object({
    code: z.string().optional(),
    expiresAt: z.date().optional(),
  }).optional(),
  lastLogin: z.date().optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

/**
 * TypeScript type inferred from the AdminUser Zod Schema
 */
export type AdminUser = z.infer<typeof AdminUserSchema>;

/**
 * Schema for admin login
 * Allows email or "admin" string for default admin login
 */
export const AdminLoginSchema = z.object({
  email: z.string().min(1),
  password: z.string().min(1),
});

/**
 * TypeScript type for Admin Login API request
 */
export type AdminLoginInput = z.infer<typeof AdminLoginSchema>;

