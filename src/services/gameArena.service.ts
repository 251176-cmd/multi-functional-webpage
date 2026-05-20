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
   * Live arena cache. MongoDB remains the source of truth for persistence, but realtime play
   * uses in-memory state to avoid per-tick DB reads/writes (which get laggy as players join).
   */
  private static getCache(): Map<string, { arena: GameArenaDocument; lastPersistAt: number }> {
    const g = globalThis as unknown as {
      __vc4sArenaCache?: Map<string, { arena: GameArenaDocument; lastPersistAt: number }>;
    };
    if (!g.__vc4sArenaCache) g.__vc4sArenaCache = new Map();
    return g.__vc4sArenaCache;
  }

  private static async loadArena(roomId: string, now: number): Promise<GameArenaDocument> {
    const cache = this.getCache();
    const cached = cache.get(roomId);
    if (cached) return cached.arena;

    const arena = await GameArenaDao.getOrCreateArena(roomId, now);
    cache.set(roomId, { arena, lastPersistAt: now });
    return arena;
  }

  private static async maybePersist(roomId: string, now: number): Promise<void> {
    const cache = this.getCache();
    const cached = cache.get(roomId);
    if (!cached) return;
    const PERSIST_EVERY_MS = 1000;
    if (now - cached.lastPersistAt < PERSIST_EVERY_MS) return;
    await GameArenaDao.saveArena(cached.arena);
    cached.lastPersistAt = now;
  }

  /**
   * Registers a player in a room and returns initial authoritative state.
   */
  static async join(input: JoinGameInput): Promise<{ playerId: string; state: GameStateResponse }> {
    const now = Date.now();
    const playerId = randomUUID();
    const margin = 56;
    const spawnX = margin + Math.random() * (ARENA_WIDTH - margin * 2);
    const spawnY = margin + Math.random() * (ARENA_HEIGHT - margin * 2);

    const arena = await this.loadArena(input.roomId, now);
    const playerName = input.displayName.trim();
    arena.players = [
      ...arena.players.filter((p) => p.id !== playerId),
      {
        id: playerId,
        name: playerName,
        x: spawnX,
        y: spawnY,
        angle: 0,
        hp: PLAYER_MAX_HP,
        lastShotAt: 0,
        score: 0,
        lastSeenAt: now,
      },
    ];
    arena.updatedAt = now;

    // Persist immediately so refreshes / other nodes can see the new player quickly.
    await GameArenaDao.saveArena(arena);
    const cached = this.getCache().get(input.roomId);
    if (cached) cached.lastPersistAt = now;

    return { playerId, state: toGameStateResponse(arena, now) };
  }

  /**
   * Applies one client's input, advances simulation, persists, returns fresh state.
   */
  static async sync(input: SyncGameInput): Promise<GameStateResponse> {
    const now = Date.now();
    const arena = await this.loadArena(input.roomId, now);
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

    await this.maybePersist(input.roomId, now);
    return toGameStateResponse(arena, now);
  }

  /**
   * Returns the latest snapshot without advancing the simulation (read-only).
   */
  static async getState(roomId: string): Promise<GameStateResponse> {
    const now = Date.now();
    const arena = await this.loadArena(roomId, now);
    return toGameStateResponse(arena, now);
  }
}
