import { randomUUID } from 'crypto';
import { GameArenaDao } from '@/src/dao/gameArena.dao';
import { ARENA_HEIGHT, ARENA_WIDTH, PLAYER_MAX_HP } from '@/src/lib/game/constants';
import { simulateArenaTick } from '@/src/lib/game/simulation';
import type {
  GameArenaDocument,
  GameStateResponse,
  JoinGameInput,
  SyncGameInput,
} from '@/src/models/gameArena';

/**
 * Maps a stored arena document to the wire format expected by the client canvas.
 */
function toGameStateResponse(arena: GameArenaDocument, now: number): GameStateResponse {
  return {
    roomId: arena._id,
    serverTime: now,
    world: { width: ARENA_WIDTH, height: ARENA_HEIGHT },
    players: arena.players,
    npcs: arena.npcs,
    bullets: arena.bullets,
  };
}

/**
 * Business logic for joining and syncing the Mongo-backed arena shooter.
 */
export class GameArenaService {
  /**
   * Registers a player in a room and returns initial authoritative state.
   */
  static async join(input: JoinGameInput): Promise<{ playerId: string; state: GameStateResponse }> {
    const now = Date.now();
    const playerId = randomUUID();
    const margin = 56;
    const spawnX = margin + Math.random() * (ARENA_WIDTH - margin * 2);
    const spawnY = margin + Math.random() * (ARENA_HEIGHT - margin * 2);

    const arena = await GameArenaDao.addPlayer(
      input.roomId,
      {
        id: playerId,
        name: input.displayName.trim(),
        x: spawnX,
        y: spawnY,
        angle: 0,
        hp: PLAYER_MAX_HP,
        lastShotAt: 0,
        score: 0,
        lastSeenAt: now,
      },
      now,
    );

    return { playerId, state: toGameStateResponse(arena, now) };
  }

  /**
   * Applies one client's input, advances simulation, persists, returns fresh state.
   */
  static async sync(input: SyncGameInput): Promise<GameStateResponse> {
    const now = Date.now();
    const arena = await GameArenaDao.getOrCreateArena(input.roomId, now);
    const dt = (now - arena.lastSimAt) / 1000;

    const player = arena.players.find((p) => p.id === input.playerId);
    if (player) {
      player.lastSeenAt = now;
    }

    simulateArenaTick(
      arena,
      dt,
      input.playerId,
      {
        moveX: input.moveX,
        moveY: input.moveY,
        aimAngle: input.aimAngle,
        wantsShoot: input.wantsShoot,
      },
      now,
    );

    await GameArenaDao.saveArena(arena);
    return toGameStateResponse(arena, now);
  }

  /**
   * Returns the latest snapshot without advancing the simulation (read-only).
   */
  static async getState(roomId: string): Promise<GameStateResponse> {
    const now = Date.now();
    const arena = await GameArenaDao.getOrCreateArena(roomId, now);
    return toGameStateResponse(arena, now);
  }
}
