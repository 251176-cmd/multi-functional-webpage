/**
 * Shared world and combat tuning for the arena shooter.
 * Kept in one module so API and simulation stay aligned.
 */
export const ARENA_WIDTH = 960;
export const ARENA_HEIGHT = 540;
export const PLAYER_RADIUS = 14;
export const NPC_RADIUS = 14;
export const BULLET_RADIUS = 5;
export const PLAYER_SPEED = 260;
export const NPC_SPEED = 70;
export const BULLET_SPEED = 440;
export const PLAYER_MAX_HP = 100;
export const NPC_MAX_HP = 40;
export const BULLET_DAMAGE_PLAYER = 18;
export const BULLET_DAMAGE_NPC = 22;
export const FIRE_COOLDOWN_MS = 280;
export const NPC_FIRE_COOLDOWN_MS = 900;
export const TARGET_NPC_COUNT = 7;
export const MAX_BULLETS = 160;
export const SIM_DT_CAP_S = 0.22;
