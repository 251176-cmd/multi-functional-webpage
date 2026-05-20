import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { AdminLoginInput } from '@/src/models/admin-user';
import { AdminDao } from '@/src/dao/admin.dao';
import { generateOtp, getOtpExpiration } from '@/src/lib/otp';
import { sendEmail } from '@/src/lib/email';

const JWT_SECRET = process.env.JWT_ADMIN_SECRET || process.env.JWT_SECRET || 'admin-fallback-secret-key';
const JWT_EXPIRES_IN = '12h';

type AdminAuthAdmin = {
  id: string;
  email: string;
  name: string;
  permissions: string[];
};

/**
 * Service for handling admin authentication logic with 2FA
 */
export class AdminAuthService {
  /**
   * Step 1: Login with password and send OTP
   * 
   * @param {AdminLoginInput} input - Admin login data
   * @returns {Promise<{ mfaRequired: boolean; email: string; token?: string; admin?: AdminAuthAdmin }>} Result message
   */
  static async login(input: AdminLoginInput): Promise<{ mfaRequired: boolean; email: string; token?: string; admin?: AdminAuthAdmin }> {
    const { email, password } = input;

    // Check for default admin login if enabled in environment
    const isDefaultAdminEnabled = process.env.DEFAULT_ADMIN === 'true';
    if (isDefaultAdminEnabled && email === 'admin' && password === 'admin') {
      console.log('[Admin Auth] Default admin login used');
      
      const token = jwt.sign(
        { 
          adminId: 'default-admin-id',
          email: 'admin@vc4s.local',
          type: 'admin',
          permissions: ['all']
        },
        JWT_SECRET,
        { expiresIn: JWT_EXPIRES_IN }
      );

      return {
        mfaRequired: false,
        email: 'admin',
        token,
        admin: {
          id: 'default-admin-id',
          email: 'admin@vc4s.local',
          name: 'Default Admin',
          permissions: ['all']
        },
      };
    }

    // Find admin by email using DAO
    const admin = await AdminDao.findByEmail(email);
    if (!admin) {
      throw new Error('Invalid credentials');
    }

    if (!admin.isActive) {
      throw new Error('Admin account is deactivated');
    }

    const isPasswordValid = await bcrypt.compare(password, admin.password);
    if (!isPasswordValid) {
      throw new Error('Invalid credentials');
    }

    // Generate OTP for 2FA
    const otpCode = generateOtp();
    const otpExpiresAt = getOtpExpiration(5); // Admin OTP valid for 5 minutes

    // Update OTP using DAO
    await AdminDao.updateById(admin._id.toString(), { 
      $set: { 
        otp: { code: otpCode, expiresAt: otpExpiresAt },
        updatedAt: new Date() 
      } 
    });

    // Send OTP email
    try {
      await sendEmail({
        to: email,
        subject: 'Admin Portal Login - Verification Code',
        html: `
          <h1>Admin Portal Verification</h1>
          <p>You are attempting to login to the Admin Portal. Please use the following code for 2FA:</p>
          <h2 style="color: #0078d4; font-size: 32px; letter-spacing: 5px;">${otpCode}</h2>
          <p>This code will expire in 5 minutes.</p>
        `,
      });
      console.log(`[Admin Auth] 2FA OTP sent to ${email}`);
    } catch (error) {
      console.error('[Admin Auth] Failed to send 2FA email:', error);
      throw new Error('Failed to send verification email');
    }

    return {
      mfaRequired: true,
      email: admin.email,
    };
  }

  /**
   * Step 2: Verify OTP and return JWT
   * 
   * @param {string} email - Admin email
   * @param {string} code - OTP code
   * @returns {Promise<{ token: string; admin: AdminAuthAdmin }>} JWT token and admin details
   */
  static async verifyOtp(email: string, code: string): Promise<{ token: string; admin: AdminAuthAdmin }> {
    // Find admin by email using DAO
    const admin = await AdminDao.findByEmail(email);
    if (!admin) {
      throw new Error('Invalid session');
    }

    if (!admin.otp || admin.otp.code !== code || (admin.otp.expiresAt && admin.otp.expiresAt < new Date())) {
      throw new Error('Invalid or expired verification code');
    }

    // Clear OTP after successful verification using DAO
    await AdminDao.updateById(admin._id.toString(), { 
      $unset: { otp: "" },
      $set: { lastLogin: new Date(), updatedAt: new Date() } 
    });

    const token = jwt.sign(
      { 
        adminId: admin._id?.toString(),
        email: admin.email,
        type: 'admin',
        permissions: admin.permissions
      },
      JWT_SECRET,
      { expiresIn: JWT_EXPIRES_IN }
    );

    return {
      token,
      admin: {
        id: admin._id?.toString(),
        email: admin.email,
        name: admin.name,
        permissions: admin.permissions
      }
    };
  }
}
