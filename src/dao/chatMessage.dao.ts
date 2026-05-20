import { ObjectId, Collection } from "mongodb";
import { getDb } from "@/src/lib/mongodb"; // Adjust this import to match your DB connection helper

export type ChatMessageDoc = {
  _id: ObjectId;
  roomId: string;
  clientId: string;
  displayName: string;
  text: string;
  createdAt: Date;
};

export class ChatMessageDao {
  private static async getCollection(): Promise<Collection<ChatMessageDoc>> {
    const db = await getDb();
    return db.collection<ChatMessageDoc>("messages");
  }

  /**
   * Existing method: List messages
   */
  static async listMessages(params: {
    roomId: string;
    afterMs?: number;
    limit?: number;
  }): Promise<ChatMessageDoc[]> {
    const col = await this.getCollection();
    const query: any = { roomId: params.roomId };
    
    if (params.afterMs) {
      query.createdAt = { $gt: new Date(params.afterMs) };
    }

    return col
      .find(query)
      .sort({ createdAt: 1 })
      .limit(Math.min(params.limit ?? 100, 100))
      .toArray();
  }

  /**
   * Existing method: Insert message
   */
  static async insertMessage(data: Omit<ChatMessageDoc, "_id">): Promise<ChatMessageDoc> {
    const col = await this.getCollection();
    const result = await col.insertOne(data as ChatMessageDoc);
    return { ...data, _id: result.insertedId } as ChatMessageDoc;
  }

  /**
   * NEW METHOD: Delete by Room
   * 
   * Purpose: Wipes all documents matching the roomId.
   */
  static async deleteByRoom(roomId: string): Promise<void> {
    const col = await this.getCollection();
    
    // This is the core MongoDB operation that clears the data
    await col.deleteMany({ roomId });
  }
}