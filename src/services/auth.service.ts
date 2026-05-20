import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { User, LoginInput, RegisterInput, ResetPasswordInput } from '@/src/models/user';
import { UserDao } from '@/src/dao/user.dao';
import { OtpDao } from '@/src/dao/otp.dao';
import { Otp } from '@/src/models/otp';
import { generateOtp, getOtpExpiration } from '@/src/lib/otp';
import { sendEmail } from '@/src/lib/email';

const JWT_SECRET = process.env.JWT_SECRET || 'your-fallback-secret-key';
const JWT_EXPIRES_IN = '1d';

type AuthUser = {
  id: string;
  email: string;
  name?: string;
  role: User['role'];
};

/**
 * Service for handling user authentication logic
 */
export class AuthService {
  /**
   * Sends an OTP for registration or password reset
   * 
   * @param {string} email - Recipient email
   * @param {'registration' | 'password_reset'} type - OTP type
   * @returns {Promise<{ message: string }>} Result message
   */
  static async sendOtp(email: string, type: 'registration' | 'password_reset'): Promise<{ message: string }> {
    // If registration, check if user already exists
    if (type === 'registration') {
      const existingUser = await UserDao.findByEmail(email);
      if (existingUser) {
        throw new Error('User already exists');
      }
    }

    // Generate OTP
    const otpCode = generateOtp();
    const otpExpiresAt = getOtpExpiration(15); // 15 minutes

    // Create OTP record
    const otpRecord: Otp = {
      email,
      code: otpCode,
      type,
      expiresAt: otpExpiresAt,
      createdAt: new Date(),
    };

    // Save to database
    await OtpDao.insertOne(otpRecord);

    // Send email
    const subject = type === 'registration' ? 'Verify your account' : 'Password Reset Request';
    const title = type === 'registration' ? 'Welcome to VC4S Starter Template' : 'Password Reset';
    const instruction = type === 'registration' 
      ? 'Please use the following OTP to verify your account:' 
      : 'You requested a password reset. Please use the following OTP to reset your password:';

    try {
      await sendEmail({
        to: email,
        subject,
        html: `
          <h1>${title}</h1>
          <p>${instruction}</p>
          <h2 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px;">${otpCode}</h2>
          <p>This code will expire in 15 minutes.</p>
        `,
      });
    } catch (error) {
      console.error(`[AuthService] ${type} email failed:`, error);
      throw new Error('Failed to send OTP email');
    }

    return { message: 'OTP sent successfully. Please check your email.' };
  }

  /**
   * Registers a new user and sends verification OTP
   * 
   * @param {RegisterInput} input - User registration data including OTP
   * @returns {Promise<{ message: string }>} Result message
   */
  static async register(input: RegisterInput): Promise<{ message: string }> {
    const { email, password, name, otp } = input;

    // 1. Verify OTP
    const validOtp = await OtpDao.findLatestValid(email, 'registration');
    if (!validOtp || validOtp.code !== otp) {
      throw new Error('Invalid or expired OTP');
    }

    // 2. Check if user already exists
    const existingUser = await UserDao.findByEmail(email);
    if (existingUser) {
      throw new Error('User already exists');
    }

    // 3. Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // 4. Create user object as verified
    const newUser: User = {
      email,
      password: hashedPassword,
      name,
      role: 'user',
      isActive: true,
      isVerified: true, // Registered via OTP, so verified
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    // 5. Insert user
    await UserDao.insertOne(newUser);

    // 6. Cleanup OTP
    await OtpDao.deleteByEmailAndType(email, 'registration');

    return { message: 'User registered successfully. You can now login.' };
  }

  /**
   * Authenticates a user and returns a token
   * 
   * @param {LoginInput} input - User login data
   * @returns {Promise<{ token: string; user: AuthUser }>} JWT token and user details
   */
  static async login(input: LoginInput): Promise<{ token: string; user: AuthUser }> {
    const { email, password } = input;

    // Find user by email using DAO
    const user = await UserDao.findByEmail(email);
    if (!user) {
      throw new Error('Invalid email or password');
    }

    if (!user.isVerified) {
      throw new Error('Please verify your email address before logging in');
    }

    if (!user.isActive) {
      throw new Error('Your account has been deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);
    if (!isPasswordValid) {
      throw new Error('Invalid email or password');
    }

    const token = jwt.sign(
      { 
        userId: user._id?.toString(),
        email: user.email,
        role: user.role 
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      user: {
        id: user._id?.toString() ?? '',
        email: user.email,
        name: user.name,
        role: user.role,
      }
    };
  }

  /**
   * Handles forgot password request by sending OTP
   * 
   * @param {string} email - User email address
   * @returns {Promise<{ message: string }>} Result message
   */
  static async forgotPassword(email: string): Promise<{ message: string }> {
    // Find user by email using DAO
    const user = await UserDao.findByEmail(email);
    
    // Privacy: don't reveal if user exists
    if (!user) {
      return { message: 'If an account exists with this email, you will receive an OTP shortly.' };
    }

    const otpCode = generateOtp();
    const otpExpiresAt = getOtpExpiration(15);

    // Update user using DAO
    await UserDao.updateById(user._id.toString(), {
      $set: {
        otp: {
          code: otpCode,
          expiresAt: otpExpiresAt,
          type: 'password_reset',
        },
        updatedAt: new Date(),
      }
    });

    try {
      await sendEmail({
        to: email,
        subject: 'Password Reset Request',
        html: `
          <h1>Password Reset</h1>
          <p>You requested a password reset. Please use the following OTP to reset your password:</p>
          <h2 style="color: #4F46E5; font-size: 32px; letter-spacing: 5px;">${otpCode}</h2>
          <p>This code will expire in 15 minutes.</p>
        `,
      });
    } catch (error) {
      console.error('[AuthService] Forgot password email failed:', error);
      throw new Error('Failed to send reset email');
    }

    return { message: 'If an account exists with this email, you will receive an OTP shortly.' };
  }

  /**
   * Resets user password using OTP and old password verification
   * 
   * @param {ResetPasswordInput} input - Reset password data
   * @returns {Promise<{ message: string }>} Result message
   */
  static async resetPassword(input: ResetPasswordInput): Promise<{ message: string }> {
    const { email, oldPassword, newPassword, otp } = input;

    // 1. Find user
    const user = await UserDao.findByEmail(email);
    if (!user) {
      throw new Error('User not found');
    }

    // 2. Verify OTP from user document
    if (!user.otp || user.otp.type !== 'password_reset' || user.otp.code !== otp) {
      throw new Error('Invalid OTP');
    }

    if (user.otp.expiresAt && user.otp.expiresAt < new Date()) {
      throw new Error('OTP has expired');
    }

    // 3. Verify old password (as requested)
    const isOldPasswordValid = await bcrypt.compare(oldPassword, user.password);
    if (!isOldPasswordValid) {
      throw new Error('Incorrect old password');
    }

    // 4. Hash new password
    const hashedNewPassword = await bcrypt.hash(newPassword, 12);

    // 5. Update user password and clear OTP
    await UserDao.updateById(user._id.toString(), {
      $set: {
        password: hashedNewPassword,
        updatedAt: new Date(),
      },
      $unset: {
        otp: "",
      }
    });

    return { message: 'Password updated successfully' };
  }
}

