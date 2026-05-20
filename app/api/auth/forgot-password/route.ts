import { NextResponse } from 'next/server';
import { z } from 'zod';
import { AuthService } from '@/src/services/auth.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Internal server error';
}

const ForgotPasswordSchema = z.object({
  email: z.string().email(),
});

/**
 * POST /api/auth/forgot-password
 * 
 * Sends a password reset OTP via AuthService.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = ForgotPasswordSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid email address' },
        { status: 400 }
      );
    }

    const { email } = validation.data;
    
    // Call service
    const result = await AuthService.forgotPassword(email);

    return NextResponse.json(result, { status: 200 });

  } catch (error: unknown) {
    console.error('[Auth API] Forgot password error:', error);
    const message = getErrorMessage(error);
    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
