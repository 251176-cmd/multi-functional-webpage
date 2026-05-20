import { NextResponse } from "next/server";
import { z } from "zod";
import { ChatMessageDao } from "@/src/dao/chatMessage.dao";

/**
 * GET /api/chatroom/messages
 */
export async function GET(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const room = (url.searchParams.get("room") ?? "lobby").trim() || "lobby";
    const afterRaw = url.searchParams.get("after");
    const limitRaw = url.searchParams.get("limit");

    const after = afterRaw ? Number(afterRaw) : undefined;
    const limit = limitRaw ? Number(limitRaw) : undefined;

    const roomId = room.slice(0, 64);
    const messages = await ChatMessageDao.listMessages({
      roomId,
      afterMs: after,
      limit,
    });

    return NextResponse.json(
      {
        messages: messages.map((m) => ({
          id: m._id.toString(),
          roomId: m.roomId,
          clientId: m.clientId,
          displayName: m.displayName,
          text: m.text,
          createdAt: m.createdAt.getTime(),
        })),
      },
      { status: 200 },
    );
  } catch (error: unknown) {
    console.error("[Chatroom API] GET error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

const PostSchema = z.object({
  roomId: z.string().trim().min(1).max(64).default("lobby"),
  clientId: z.string().trim().min(6).max(80),
  displayName: z.string().trim().min(1).max(32),
  text: z.string().trim().min(1).max(400),
});

type PostBody = z.infer<typeof PostSchema>;

/**
 * POST /api/chatroom/messages
 */
export async function POST(request: Request): Promise<NextResponse> {
  try {
    const body: unknown = await request.json();
    const parsed = PostSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json(
        { message: "Invalid input", errors: parsed.error.format() },
        { status: 400 },
      );
    }

    const payload: PostBody = parsed.data;
    const createdAt = new Date();

    const inserted = await ChatMessageDao.insertMessage({
      roomId: payload.roomId,
      clientId: payload.clientId,
      displayName: payload.displayName,
      text: payload.text,
      createdAt,
    });

    return NextResponse.json(
      {
        message: {
          id: inserted._id.toString(),
          roomId: inserted.roomId,
          clientId: inserted.clientId,
          displayName: inserted.displayName,
          text: inserted.text,
          createdAt: inserted.createdAt.getTime(),
        },
      },
      { status: 201 },
    );
  } catch (error: unknown) {
    console.error("[Chatroom API] POST error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

/**
 * NEW: DELETE /api/chatroom/messages?room=lobby
 * 
 * Purpose:
 * - Wipes all messages for a specific room.
 */
export async function DELETE(request: Request): Promise<NextResponse> {
  try {
    const url = new URL(request.url);
    const room = url.searchParams.get("room");

    if (!room) {
      return NextResponse.json({ message: "Room parameter is required" }, { status: 400 });
    }

    // Assuming you add this method to ChatMessageDao
    // It should perform: await collection.deleteMany({ roomId: room })
    await ChatMessageDao.deleteByRoom(room);

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error: unknown) {
    console.error("[Chatroom API] DELETE error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}