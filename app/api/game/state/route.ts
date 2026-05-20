import { NextResponse } from 'next/server';
import { z } from 'zod';
import { GameArenaService } from '@/src/services/gameArena.service';

export const runtime = 'nodejs';

const QuerySchema = z.object({
  roomId: z.string().min(1).max(64).optional().default('main'),
});

function getErrorMessage(error: unknown): string {
  if (error instanceof Error) return error.message;
  if (typeof error === 'string') return error;
  return 'Internal server error';
}

/**
 * GET /api/game/state?roomId=main
 *
 * Read-only arena snapshot (no simulation step). Useful for light polling between input ticks.
 */
export async function GET(request: Request) {
  try {
    const { searchParams } = new URL(request.url);
    const parsed = QuerySchema.safeParse({ roomId: searchParams.get('roomId') ?? undefined });
    if (!parsed.success) {
      return NextResponse.json(
        { message: 'Invalid query', errors: parsed.error.format() },
        { status: 400 },
      );
    }

    const state = await GameArenaService.getState(parsed.data.roomId);
    return NextResponse.json({ state }, { status: 200 });
  } catch (error: unknown) {
    console.error('[Game API] state error:', error);
    return NextResponse.json({ message: getErrorMessage(error) }, { status: 500 });
  }
}
