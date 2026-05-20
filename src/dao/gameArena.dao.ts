import { getDb } from '@/src/lib/mongodb';
import type { GameArenaDocument, GamePlayer } from '@/src/models/gameArena';
import { createInitialArena } from '@/src/lib/game/simulation';

/**
 * MongoDB access for multiplayer arena state (`game_arenas` collection).
 */
export class GameArenaDao {
  private static readonly COLLECTION_NAME = 'game_arenas';

  private static async getCollection() {
    const db = await getDb();
    return db.collection<GameArenaDocument>(this.COLLECTION_NAME);
  }

  /**
   * Loads an arena by room id, or inserts the default seeded arena if missing.
   */
  static async getOrCreateArena(roomId: string, now: number): Promise<GameArenaDocument> {
    const collection = await this.getCollection();
    const existing = await collection.findOne({ _id: roomId });
    if (existing) {
      return existing;
    }
    const initial = createInitialArena(roomId, now);
    await collection.insertOne(initial);
    return initial;
  }

  /**
   * Persists the full arena document (authoritative snapshot after simulation).
   */
  static async saveArena(arena: GameArenaDocument): Promise<void> {
    const collection = await this.getCollection();
    await collection.replaceOne({ _id: arena._id }, arena, { upsert: true });
  }

  /**
   * Adds a new human player to an arena and saves.
   */
  static async addPlayer(roomId: string, player: GamePlayer, now: number): Promise<GameArenaDocument> {
    const arena = await this.getOrCreateArena(roomId, now);
    const others = arena.players.filter((p) => p.id !== player.id);
    arena.players = [...others, player];
    arena.updatedAt = now;
    await this.saveArena(arena);
    return arena;
  }
}
