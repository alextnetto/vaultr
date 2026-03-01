import fs from "fs/promises";
import path from "path";
import { encryptBuffer, decryptBuffer } from "./crypto";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");
const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB

export type FileMetadata = {
  fileName: string;
  fileSize: number;
  mimeType: string;
};

async function ensureUploadsDir() {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
}

export async function saveFile(
  itemId: string,
  buffer: Buffer,
  metadata: FileMetadata,
): Promise<void> {
  if (buffer.length > MAX_FILE_SIZE) {
    throw new Error("File too large (max 5MB)");
  }

  if (buffer.length === 0) {
    throw new Error("File is empty");
  }

  await ensureUploadsDir();
  const encrypted = encryptBuffer(buffer);
  await fs.writeFile(path.join(UPLOADS_DIR, itemId), encrypted);
}

export async function readFile(itemId: string): Promise<Buffer> {
  const filePath = path.join(UPLOADS_DIR, itemId);
  const encrypted = await fs.readFile(filePath);
  return decryptBuffer(encrypted);
}

export async function deleteFile(itemId: string): Promise<void> {
  const filePath = path.join(UPLOADS_DIR, itemId);
  try {
    await fs.unlink(filePath);
  } catch {
    // File may not exist, that's ok
  }
}

export function parseFileMetadata(value: string): FileMetadata {
  return JSON.parse(value) as FileMetadata;
}

export function serializeFileMetadata(metadata: FileMetadata): string {
  return JSON.stringify(metadata);
}
