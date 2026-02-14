import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb, getOne, getAll, ShareRow, FileRow } from "@/lib/db";
import { decrypt, verifyPassword } from "@/lib/crypto";

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const body = await request.json();
    const { key, password } = body;

    const db = await getDb();
    const share = getOne<ShareRow>(db, "SELECT * FROM shares WHERE id = ?", [id]);

    if (!share) {
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    }

    const now = Math.floor(Date.now() / 1000);
    if (now > share.expires_at) {
      db.run("DELETE FROM files WHERE share_id = ?", [id]);
      db.run("DELETE FROM shares WHERE id = ?", [id]);
      saveDb(db);
      return NextResponse.json({ error: "This link has expired", expired: true }, { status: 410 });
    }

    if (share.password_hash) {
      if (!password) {
        return NextResponse.json({
          requiresPassword: true,
          expiresAt: share.expires_at,
          createdAt: share.created_at,
        }, { status: 401 });
      }
      if (!verifyPassword(password, share.password_hash)) {
        return NextResponse.json({ error: "Incorrect password" }, { status: 403 });
      }
    }

    if (!key) {
      return NextResponse.json({ error: "Decryption key required" }, { status: 400 });
    }

    let fields;
    try {
      const decrypted = decrypt(share.encrypted_data, key, share.iv, share.auth_tag);
      fields = JSON.parse(decrypted);
    } catch {
      return NextResponse.json({ error: "Invalid decryption key" }, { status: 400 });
    }

    const files = getAll<FileRow>(db, "SELECT id, filename, mimetype FROM files WHERE share_id = ?", [id]);

    db.run("UPDATE shares SET view_count = view_count + 1 WHERE id = ?", [id]);
    saveDb(db);

    return NextResponse.json({
      fields,
      files: files.map(f => ({ id: f.id, filename: f.filename, mimetype: f.mimetype })),
      expiresAt: share.expires_at,
      createdAt: share.created_at,
      viewCount: (share.view_count || 0) + 1,
    });
  } catch (error) {
    console.error("Error fetching share:", error);
    return NextResponse.json({ error: "Failed to fetch share" }, { status: 500 });
  }
}
