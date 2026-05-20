import { NextResponse } from 'next/server';
import { SendOtpSchema } from '@/src/models/otp';
import { AuthService } from '@/src/services/auth.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Internal server error';
}

/**
 * POST /api/auth/send-otp
 * 
 * Sends an OTP for registration or password reset.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = SendOtpSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.format() },
        { status: 400 }
      );
    }

    const { email, type } = validation.data;

    // Call service to send OTP
    const result = await AuthService.sendOtp(email, type);

    return NextResponse.json(result, { status: 200 });

  } catch (error: unknown) {
    console.error('[Auth API] Send OTP error:', error);
    const message = getErrorMessage(error);
    
    // Handle specific errors
    if (message === 'User already exists') {
      return NextResponse.json({ message }, { status: 409 });
    }

    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}

