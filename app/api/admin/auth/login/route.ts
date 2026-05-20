import { NextResponse } from 'next/server';
import { AdminLoginSchema } from '@/src/models/admin-user';
import { AdminAuthService } from '@/src/services/admin-auth.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Internal server error';
}

/**
 * POST /api/admin/auth/login
 * 
 * Step 1: Admin login with email and password.
 * If successful, sends an OTP and returns mfaRequired: true.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();

    // Validate input
    const validation = AdminLoginSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.format() },
        { status: 400 }
      );
    }

    // Call Step 1: Login with password
    const result = await AdminAuthService.login(validation.data);

    return NextResponse.json(result, { status: 200 });

  } catch (error: unknown) {
    console.error('[Admin Auth API] Login error:', error);
    const message = getErrorMessage(error);

    if (message === 'Invalid credentials') {
      return NextResponse.json({ message }, { status: 401 });
    }

    if (message === 'Admin account is deactivated') {
      return NextResponse.json({ message }, { status: 403 });
    }

    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
