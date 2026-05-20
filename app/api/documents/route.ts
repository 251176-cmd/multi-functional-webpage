import { NextResponse } from "next/server";
import { getDb } from "@/src/lib/mongodb";
import { ObjectId } from "mongodb";

// GET: List all OR Get single for download
export async function GET(request: Request) {
  const db = await getDb();
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const isDownload = url.searchParams.get("download");

  if (id && isDownload) {
    const file = await db.collection("documents").findOne({ _id: new ObjectId(id) });
    return NextResponse.json(file);
  }

  const files = await db.collection("documents").find({}).project({ content: 0 }).toArray();
  return NextResponse.json({ files });
}

// POST: Create new
export async function POST(request: Request) {
  const db = await getDb();
  const body = await request.json();
  const result = await db.collection("documents").insertOne({
    ...body,
    createdAt: new Date(),
  });
  return NextResponse.json({ success: true });
}

// PUT: Rewrite (Update) existing
export async function PUT(request: Request) {
  const db = await getDb();
  const body = await request.json();
  const { id, ...updateData } = body;

  await db.collection("documents").updateOne(
    { _id: new ObjectId(id) },
    { $set: { ...updateData, updatedAt: new Date() } }
  );
  return NextResponse.json({ success: true });
}

// DELETE: Remove
export async function DELETE(request: Request) {
  const url = new URL(request.url);
  const id = url.searchParams.get("id");
  const db = await getDb();
  await db.collection("documents").deleteOne({ _id: new ObjectId(id!) });
  return NextResponse.json({ success: true });
}