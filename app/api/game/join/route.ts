import { NextResponse } from 'next/server';
import { JoinGameSchema } from '@/src/models/gameArena';
import { GameArenaService } from '@/src/services/gameArena.service';

/** MongoDB native driver requires Node; avoids Edge/HTML fallback failures. */
export const runtime = 'nodejs';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Internal server error';
}

/**
 * POST /api/game/join
 *
 * Creates a player profile in the shared arena (stored in MongoDB) and returns `playerId` + world snapshot.
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON.' }, { status: 400 });
    }
    const parsed = JoinGameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: parsed.error.format() },
        { status: 400 },
      );
    }

    const result = await GameArenaService.join(parsed.data);
    return NextResponse.json(result, { status: 200 });
  } catch (error: unknown) {
    console.error('[Game API] join error:', error);
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 500 });
  }
}
