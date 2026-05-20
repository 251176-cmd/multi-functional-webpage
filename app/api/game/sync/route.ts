import { NextResponse } from 'next/server';
import { SyncGameSchema } from '@/src/models/gameArena';
import { GameArenaService } from '@/src/services/gameArena.service';

export const runtime = 'nodejs';

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Internal server error';
}

/**
 * POST /api/game/sync
 *
 * Sends movement, aim, and fire input; server advances the arena tick and persists state to MongoDB.
 */
export async function POST(request: Request) {
  try {
    let body: unknown;
    try {
      body = await request.json();
    } catch {
      return NextResponse.json({ message: 'Request body must be valid JSON.' }, { status: 400 });
    }
    const parsed = SyncGameSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid input', errors: parsed.error.format() },
        { status: 400 },
      );
    }

    const state = await GameArenaService.sync(parsed.data);
    return NextResponse.json({ state }, { status: 200 });
  } catch (error: unknown) {
    console.error('[Game API] sync error:', error);
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 500 });
  }
}
