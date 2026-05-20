import type { ObjectId } from "mongodb";

/**
 * ChatMessage
 *
 * Purpose:
 * - Define the MongoDB document shape for persisted chatroom messages.
 *
 * Inputs:
 * - Stored by API routes / DAO (not constructed directly by UI).
 *
 * Outputs:
 * - Strongly-typed message objects across DAO/service/API layers.
 *
 * Side effects:
 * - None.
 */
export interface ChatMessage {
  _id?: ObjectId;
  roomId: string;
  clientId: string;
  displayName: string;
  text: string;
  createdAt: Date;
}

