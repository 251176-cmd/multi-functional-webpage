import { z } from 'zod';

/**
 * In-world entity types for the multiplayer arena shooter.
 * These shapes are stored in MongoDB (`game_arenas` collection) and returned to clients.
 */

export interface GameBullet {
  id: string;
  ownerId: string;
  x: number;
  y: number;
  vx: number;
  vy: number;
  damage: number;
  spawnedAt: number;
}

export interface GameNpc {
  id: string;
  x: number;
  y: number;
  hp: number;
  vx: number;
  vy: number;
  lastShotAt: number;
  /**
   * When defined and `hp <= 0`, NPC will respawn after this timestamp (ms since epoch).
   */
  respawnAt?: number;
}

export interface GamePlayer {
  id: string;
  name: string;
  x: number;
  y: number;
  angle: number;
  hp: number;
  lastShotAt: number;
  score: number;
  /**
   * Updated on each successful `/api/game/sync` call.
   * Used to remove players who closed the tab / left the room.
   */
  lastSeenAt: number;
}

/** Serializable arena snapshot persisted in MongoDB */
export interface GameArenaDocument {
  _id: string;
  players: GamePlayer[];
  npcs: GameNpc[];
  bullets: GameBullet[];
  lastSimAt: number;
  updatedAt: number;
}

/** Client → server player intent for one sync tick */
export interface PlayerSyncInput {
  moveX: number;
  moveY: number;
  aimAngle: number;
  wantsShoot: boolean;
}

export const JoinGameSchema = z.object({
  roomId: z.string().min(1).max(64).default('main'),
  displayName: z.string().min(1).max(24),
});

export type JoinGameInput = z.infer<typeof JoinGameSchema>;

export const SyncGameSchema = z.object({
  roomId: z.string().min(1).max(64),
  playerId: z.string().min(1).max(128),
  moveX: z.number().min(-1).max(1),
  moveY: z.number().min(-1).max(1),
  aimAngle: z.number().finite(),
  wantsShoot: z.boolean(),
});

export type SyncGameInput = z.infer<typeof SyncGameSchema>;

/** API response carrying full arena for rendering */
export interface GameStateResponse {
  roomId: string;
  serverTime: number;
  world: {
    width: number;
    height: number;
  };
  players: GamePlayer[];
  npcs: GameNpc[];
  bullets: GameBullet[];
}
