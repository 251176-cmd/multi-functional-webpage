import { z } from 'zod';
import { ObjectId } from 'mongodb';

/**
 * User Zod Schema
 * Defines the structure of a user document in MongoDB.
 * Users can login with email and password.
 */
export const UserSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  email: z.string().email({ message: "Invalid email address" }),
  password: z.string().min(8, { message: "Password must be at least 8 characters long" }),
  name: z.string().min(2).optional(),
  role: z.enum(['user', 'admin']).default('user'),
  isActive: z.boolean().default(true),
  isVerified: z.boolean().default(false),
  otp: z.object({
    code: z.string().optional(),
    expiresAt: z.date().optional(),
    type: z.enum(['registration', 'password_reset']).optional(),
  }).optional(),
  createdAt: z.date().default(() => new Date()),
  updatedAt: z.date().default(() => new Date()),
});

/**
 * TypeScript type inferred from the User Zod Schema
 */
export type User = z.infer<typeof UserSchema>;

/**
 * Schema for user registration
 * Extends the base schema with additional validation if necessary
 */
export const RegisterSchema = UserSchema.pick({
  email: true,
  password: true,
  name: true,
}).extend({
  otp: z.string().length(6, { message: "OTP must be exactly 6 digits" }),
});

/**
 * Schema for user login
 * Only requires email and password
 */
export const LoginSchema = UserSchema.pick({
  email: true,
  password: true,
});

/**
 * TypeScript types for API requests
 */
export type RegisterInput = z.infer<typeof RegisterSchema>;
export type LoginInput = z.infer<typeof LoginSchema>;

/**
 * Schema for password reset
 */
export const ResetPasswordSchema = z.object({
  email: z.string().email(),
  oldPassword: z.string(),
  newPassword: z.string().min(8, { message: "New password must be at least 8 characters long" }),
  otp: z.string().length(6, { message: "OTP must be exactly 6 digits" }),
});

export type ResetPasswordInput = z.infer<typeof ResetPasswordSchema>;

