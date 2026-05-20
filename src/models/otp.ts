import { z } from 'zod';
import { ObjectId } from 'mongodb';

/**
 * OTP Zod Schema
 * Defines the structure of an OTP document in MongoDB.
 * Used for verifying email before registration or password reset.
 */
export const OtpSchema = z.object({
  _id: z.instanceof(ObjectId).optional(),
  email: z.string().email({ message: "Invalid email address" }),
  code: z.string().length(6, { message: "OTP must be exactly 6 digits" }),
  type: z.enum(['registration', 'password_reset']),
  expiresAt: z.date(),
  createdAt: z.date().default(() => new Date()),
});

/**
 * TypeScript type inferred from the Otp Zod Schema
 */
export type Otp = z.infer<typeof OtpSchema>;

/**
 * Schema for sending OTP request
 */
export const SendOtpSchema = z.object({
  email: z.string().email({ message: "Invalid email address" }),
  type: z.enum(['registration', 'password_reset']),
});

/**
 * TypeScript type for send OTP request
 */
export type SendOtpInput = z.infer<typeof SendOtpSchema>;

