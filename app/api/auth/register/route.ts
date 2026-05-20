import { NextResponse } from 'next/server';
import { RegisterSchema } from '@/src/models/user';
import { AuthService } from '@/src/services/auth.service';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Internal server error';
}

/**
 * POST /api/auth/register
 * 
 * Registers a new user via AuthService.
 */
export async function POST(request: Request) {
  try {
    const body = await request.json();
    
    // Validate input
    const validation = RegisterSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: validation.error.format() },
        { status: 400 }
      );
    }

    // Call service
    const result = await AuthService.register(validation.data);

    return NextResponse.json(result, { status: 201 });

  } catch (error: unknown) {
    console.error('[Auth API] Registration error:', error);
    const message = getErrorMessage(error);
    
    // Handle specific errors from service
    if (message === 'User already exists') {
      return NextResponse.json({ message }, { status: 409 });
    }

    return NextResponse.json(
      { message },
      { status: 500 }
    );
  }
}
