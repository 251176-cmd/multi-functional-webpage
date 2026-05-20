import { NextResponse } from 'next/server';
import { ResetPasswordSchema } from '@/src/models/user';
import { AuthService } from '@/src/services/auth.service';
import { requireUserAuth } from '@/src/lib/auth';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Internal server error';
}

/**
 * POST /api/auth/reset-password
 * 
 * Resets user password using OTP and old password verification.
 * Input: email, oldPassword, newPassword, otp
 */
export async function POST(request: Request) {
  try {
    // Step 1: Require a valid logged-in user token
    const authPayload = requireUserAuth(request);

    // Step 2: Parse request body
    const body = await request.json();

    // Step 3: Validate input
    const validation = ResetPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.format() },
        { status: 400 }
      );
    }

    // Step 4: Ensure the token email matches the reset request
    if (authPayload.email !== validation.data.email) {
      return NextResponse.json(
        { message: 'Email does not match authenticated user' },
        { status: 403 }
      );
    }

    // Step 5: Call service to reset password
    const result = await AuthService.resetPassword(validation.data);

    return NextResponse.json(result, { status: 200 });

  } catch (error: unknown) {
    console.error('[Auth API] Reset password error:', error);
    const message = getErrorMessage(error);
    
    // Handle specific errors
    if (message === 'Unauthorized' || message === 'Invalid token') {
      return NextResponse.json({ message }, { status: 401 });
    }

    if (message === 'User not found' || message === 'Invalid OTP' || message === 'OTP has expired' || message === 'Incorrect old password') {
      return NextResponse.json({ message }, { status: 400 });
    }

    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

