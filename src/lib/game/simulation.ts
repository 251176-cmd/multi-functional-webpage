import type { GameArenaDocument, GameBullet, GamePlayer, PlayerSyncInput } from '@/src/models/gameArena';
import {
  ARENA_HEIGHT,
  ARENA_WIDTH,
  BULLET_DAMAGE_NPC,
  BULLET_DAMAGE_PLAYER,
  BULLET_RADIUS,
  BULLET_SPEED,
  FIRE_COOLDOWN_MS,
  MAX_BULLETS,
  NPC_FIRE_COOLDOWN_MS,
  NPC_MAX_HP,
  NPC_RADIUS,
  NPC_SPEED,
  PLAYER_MAX_HP,
  PLAYER_RADIUS,
  PLAYER_SPEED,
  SIM_DT_CAP_S,
  TARGET_NPC_COUNT,
} from '@/src/lib/game/constants';

/**
 * Clamps a numeric value between min and max.
 */
function clamp(value: number, min: number, max: number): number {
  return Math.min(max, Math.max(min, value));
}

/**
 * Generates a short unique id for entities (non-cryptographic, fine for game objects).
 */
function makeId(prefix: string): string {
  return `${prefix}_${Date.now().toString(36)}_${Math.random().toString(36).slice(2, 9)}`;
}

/**
 * Picks a random spawn point away from the world edges.
 */
function randomSpawn(): { x: number; y: number } {
  const margin = 48;
  return {
    x: margin + Math.random() * (ARENA_WIDTH - margin * 2),
    y: margin + Math.random() * (ARENA_HEIGHT - margin * 2),
  };
}

/**
 * Keeps a circle fully inside the arena bounds.
 */
function clampEntityPosition(x: number, y: number, radius: number): { x: number; y: number } {
  return {
    x: clamp(x, radius, ARENA_WIDTH - radius),
    y: clamp(y, radius, ARENA_HEIGHT - radius),
  };
}

/**
 * Circle-circle hit test.
 */
function circlesOverlap(
  ax: number,
  ay: number,
  ar: number,
  bx: number,
  by: number,
  br: number,
): boolean {
  const dx = ax - bx;
  const dy = ay - by;
  const r = ar + br;
  return dx * dx + dy * dy <= r * r;
}

/**
 * Ensures the arena has the baseline number of hostile NPCs.
 */
export function maintainNpcRoster(arena: GameArenaDocument): void {
  while (arena.npcs.length < TARGET_NPC_COUNT) {
    const { x, y } = randomSpawn();
    arena.npcs.push({
      id: makeId('npc'),
      x,
      y,
      hp: NPC_MAX_HP,
      vx: 0,
      vy: 0,
      lastShotAt: 0,
    });
  }
}

/**
 * Creates a fresh empty arena document for a room with NPCs spawned.
 */
export function createInitialArena(roomId: string, now: number): GameArenaDocument {
  const arena: GameArenaDocument = {
    _id: roomId,
    players: [],
    npcs: [],
    bullets: [],
    lastSimAt: now,
    updatedAt: now,
  };
  maintainNpcRoster(arena);
  return arena;
}

/**
 * Spawns a bullet from a shooter position toward angle.
 */
function spawnBullet(
  bullets: GameBullet[],
  ownerId: string,
  x: number,
  y: number,
  angle: number,
  damage: number,
  now: number,
  shooterRadius: number,
): void {
  if (bullets.length >= MAX_BULLETS) {
    bullets.shift();
  }
  const vx = Math.cos(angle) * BULLET_SPEED;
  const vy = Math.sin(angle) * BULLET_SPEED;
  const { x: sx, y: sy } = clampEntityPosition(
    x + Math.cos(angle) * (shooterRadius + 4),
    y + Math.sin(angle) * (shooterRadius + 4),
    BULLET_RADIUS,
  );
  bullets.push({
    id: makeId('b'),
    ownerId,
    x: sx,
    y: sy,
    vx,
    vy,
    damage,
    spawnedAt: now,
  });
}

/**
 * Applies player movement and optional shooting for the syncing client.
 */
function applyPlayerInput(player: GamePlayer, input: PlayerSyncInput, dt: number, now: number, bullets: GameBullet[]): void {
  const len = Math.hypot(input.moveX, input.moveY);
  const nx = len > 0 ? input.moveX / len : 0;
  const ny = len > 0 ? input.moveY / len : 0;
  player.x += nx * PLAYER_SPEED * dt;
  player.y += ny * PLAYER_SPEED * dt;
  const clamped = clampEntityPosition(player.x, player.y, PLAYER_RADIUS);
  player.x = clamped.x;
  player.y = clamped.y;
  player.angle = input.aimAngle;

  if (input.wantsShoot && now - player.lastShotAt >= FIRE_COOLDOWN_MS) {
    spawnBullet(bullets, player.id, player.x, player.y, player.angle, BULLET_DAMAGE_NPC, now, PLAYER_RADIUS);
    player.lastShotAt = now;
  }
}

/**
 * NPC AI: chase nearest living player; shoot when roughly aligned.
 */
function updateNpcs(arena: GameArenaDocument, dt: number, now: number): void {
  const livingPlayers = arena.players.filter((p) => p.hp > 0);

  for (const npc of arena.npcs) {
    // If this NPC is dead, only allow it to come back after its respawn time.
    if (npc.hp <= 0) {
      if (typeof npc.respawnAt === 'number' && now >= npc.respawnAt) {
        const spawn = randomSpawn();
        npc.x = spawn.x;
        npc.y = spawn.y;
        npc.hp = NPC_MAX_HP;
        npc.lastShotAt = now;
        npc.respawnAt = undefined;
      } else {
        continue;
      }
    }

    let target: GamePlayer | null = null;
    let best = Infinity;
    for (const p of livingPlayers) {
      const d = Math.hypot(p.x - npc.x, p.y - npc.y);
      if (d < best) {
        best = d;
        target = p;
      }
    }

    if (target) {
      const dx = target.x - npc.x;
      const dy = target.y - npc.y;
      const dist = Math.hypot(dx, dy) || 1;
      npc.vx = (dx / dist) * NPC_SPEED;
      npc.vy = (dy / dist) * NPC_SPEED;
      npc.x += npc.vx * dt;
      npc.y += npc.vy * dt;
      const c = clampEntityPosition(npc.x, npc.y, NPC_RADIUS);
      npc.x = c.x;
      npc.y = c.y;

      const aim = Math.atan2(dy, dx);
      if (dist < 420 && now - npc.lastShotAt >= NPC_FIRE_COOLDOWN_MS) {
        spawnBullet(arena.bullets, `npc:${npc.id}`, npc.x, npc.y, aim, BULLET_DAMAGE_PLAYER, now, NPC_RADIUS);
        npc.lastShotAt = now;
      }
    } else {
      npc.x += Math.sin(now / 800 + npc.id.length) * 20 * dt;
      npc.y += Math.cos(now / 700 + npc.id.length) * 20 * dt;
      const c = clampEntityPosition(npc.x, npc.y, NPC_RADIUS);
      npc.x = c.x;
      npc.y = c.y;
    }
  }
}

/**
 * Moves bullets and drops those that leave the world or live too long.
 */
function updateBullets(bullets: GameBullet[], dt: number, now: number): void {
  const maxAge = 4500;
  const next: GameBullet[] = [];
  for (const b of bullets) {
    b.x += b.vx * dt;
    b.y += b.vy * dt;
    if (b.x < -20 || b.y < -20 || b.x > ARENA_WIDTH + 20 || b.y > ARENA_HEIGHT + 20) continue;
    if (now - b.spawnedAt > maxAge) continue;
    next.push(b);
  }
  bullets.length = 0;
  bullets.push(...next);
}

/**
 * Resolves bullet hits against players and NPCs; awards score for NPC kills.
 */
function resolveHits(arena: GameArenaDocument, now: number): void {
  const remaining: GameBullet[] = [];

  for (const bullet of arena.bullets) {
    let consumed = false;
    const isNpcOwner = bullet.ownerId.startsWith('npc:');

    if (!isNpcOwner) {
      for (const npc of arena.npcs) {
        if (npc.hp <= 0) continue;
        if (circlesOverlap(bullet.x, bullet.y, BULLET_RADIUS, npc.x, npc.y, NPC_RADIUS)) {
          npc.hp -= bullet.damage;
          consumed = true;
          if (npc.hp <= 0) {
            const owner = arena.players.find((p) => p.id === bullet.ownerId);
            if (owner) owner.score += 1;
            npc.respawnAt = now + 3000;
          }
          break;
        }
      }
    }

    if (!consumed && isNpcOwner) {
      for (const player of arena.players) {
        if (player.hp <= 0) continue;
        if (circlesOverlap(bullet.x, bullet.y, BULLET_RADIUS, player.x, player.y, PLAYER_RADIUS)) {
          player.hp -= bullet.damage;
          consumed = true;
          break;
        }
      }
    }

    if (!consumed) {
      for (const player of arena.players) {
        if (player.hp <= 0 || player.id === bullet.ownerId) continue;
        if (circlesOverlap(bullet.x, bullet.y, BULLET_RADIUS, player.x, player.y, PLAYER_RADIUS)) {
          player.hp -= bullet.damage;
          consumed = true;
          break;
        }
      }
    }

    if (!consumed) remaining.push(bullet);
  }

  arena.bullets = remaining;
}

/**
 * Respawns dead players after a delay via full HP restore (simple arcade).
 * NPCs handle their own delayed respawn in `updateNpcs`.
 */
function cleanupAndRespawn(arena: GameArenaDocument, now: number): void {
  // Remove players that likely left the game (closed tab, lost connection).
  // Their clients stop calling `/api/game/sync`, so `lastSeenAt` stops updating.
  const PLAYER_TTL_MS = 15_000;
  arena.players = arena.players.filter((p) => now - p.lastSeenAt <= PLAYER_TTL_MS);

  for (const p of arena.players) {
    if (p.hp <= 0) {
      const spawn = randomSpawn();
      p.x = spawn.x;
      p.y = spawn.y;
      p.hp = PLAYER_MAX_HP;
      p.lastShotAt = now;
    }
  }
}

/**
 * Advances the arena by dt (seconds), applying one player's input.
 */
export function simulateArenaTick(
  arena: GameArenaDocument,
  dtRaw: number,
  playerId: string,
  input: PlayerSyncInput,
  now: number,
): void {
  const dt = Math.min(SIM_DT_CAP_S, Math.max(0, dtRaw));
  const player = arena.players.find((p) => p.id === playerId);
  if (player && player.hp > 0) {
    applyPlayerInput(player, input, dt, now, arena.bullets);
  }

  updateNpcs(arena, dt, now);
  updateBullets(arena.bullets, dt, now);
  resolveHits(arena, now);
  cleanupAndRespawn(arena, now);

  arena.lastSimAt = now;
  arena.updatedAt = now;
}
