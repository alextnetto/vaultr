import { NextRequest, NextResponse } from "next/server";
import { getDb, saveDb } from "@/lib/db";
import { generateId, encrypt, hashPassword } from "@/lib/crypto";
import { randomBytes } from "crypto";

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { fields, expiresIn, password, files } = body;

    if (!fields || !Array.isArray(fields) || fields.length === 0) {
      return NextResponse.json({ error: "At least one field is required" }, { status: 400 });
    }

    const id = generateId();
    const encryptionKey = randomBytes(32).toString("hex");

    const dataToEncrypt = JSON.stringify(fields);
    const { encrypted, iv, tag } = encrypt(dataToEncrypt, encryptionKey);

    const now = Math.floor(Date.now() / 1000);
    const expiresAt = now + (expiresIn || 3600);
    const passwordHash = password ? hashPassword(password) : null;

    const db = await getDb();
    db.run(
      `INSERT INTO shares (id, encrypted_data, iv, auth_tag, password_hash, expires_at, created_at)
       VALUES (?, ?, ?, ?, ?, ?, ?)`,
      [id, encrypted, iv, tag, passwordHash, expiresAt, now]
    );

    if (files && Array.isArray(files)) {
      for (const file of files) {
        const fileId = generateId();
        db.run(
          `INSERT INTO files (id, share_id, filename, mimetype, data) VALUES (?, ?, ?, ?, ?)`,
          [fileId, id, file.filename, file.mimetype, file.data]
        );
      }
    }

    saveDb(db);

    return NextResponse.json({
      id,
      key: encryptionKey,
      expiresAt,
      hasPassword: !!password,
    });
  } catch (error) {
    console.error("Error creating share:", error);
    return NextResponse.json({ error: "Failed to create share" }, { status: 500 });
  }
}
