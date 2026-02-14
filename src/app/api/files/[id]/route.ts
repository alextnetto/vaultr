import { NextRequest, NextResponse } from "next/server";
import { getDb, getOne, FileRow } from "@/lib/db";

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  const db = await getDb();
  const file = getOne<FileRow>(db, "SELECT * FROM files WHERE id = ?", [params.id]);

  if (!file) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  const buffer = Buffer.from(file.data, "base64");
  return new NextResponse(buffer, {
    headers: {
      "Content-Type": file.mimetype,
      "Content-Disposition": `attachment; filename="${file.filename}"`,
    },
  });
}
