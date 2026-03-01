import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import fs from "fs/promises";
import path from "path";
import { saveFile, readFile, deleteFile, parseFileMetadata, serializeFileMetadata } from "./file.service";

const UPLOADS_DIR = path.join(process.cwd(), "uploads");

beforeEach(async () => {
  await fs.mkdir(UPLOADS_DIR, { recursive: true });
});

afterEach(async () => {
  try {
    const files = await fs.readdir(UPLOADS_DIR);
    for (const file of files) {
      if (file.startsWith("test_")) {
        await fs.unlink(path.join(UPLOADS_DIR, file));
      }
    }
  } catch {
    // directory may not exist
  }
});

describe("saveFile", () => {
  it("saves an encrypted file to disk", async () => {
    const content = Buffer.from("hello world");
    await saveFile("test_save", content, {
      fileName: "test.txt",
      fileSize: content.length,
      mimeType: "text/plain",
    });

    const onDisk = await fs.readFile(path.join(UPLOADS_DIR, "test_save"));
    // Encrypted content should differ from the original
    expect(onDisk.equals(content)).toBe(false);
    // Should be larger (IV + authTag overhead)
    expect(onDisk.length).toBeGreaterThan(content.length);
  });

  it("rejects files larger than 5MB", async () => {
    const large = Buffer.alloc(6 * 1024 * 1024);
    await expect(
      saveFile("test_large", large, {
        fileName: "big.bin",
        fileSize: large.length,
        mimeType: "application/octet-stream",
      }),
    ).rejects.toThrow("File too large");
  });

  it("rejects empty files", async () => {
    await expect(
      saveFile("test_empty", Buffer.alloc(0), {
        fileName: "empty.txt",
        fileSize: 0,
        mimeType: "text/plain",
      }),
    ).rejects.toThrow("File is empty");
  });
});

describe("readFile", () => {
  it("reads and decrypts a file", async () => {
    const content = Buffer.from("secret file content");
    await saveFile("test_read", content, {
      fileName: "secret.txt",
      fileSize: content.length,
      mimeType: "text/plain",
    });

    const result = await readFile("test_read");
    expect(result.equals(content)).toBe(true);
  });

  it("preserves binary data", async () => {
    const binary = Buffer.from([0x00, 0xff, 0x80, 0x7f, 0x01, 0xfe]);
    await saveFile("test_binary", binary, {
      fileName: "data.bin",
      fileSize: binary.length,
      mimeType: "application/octet-stream",
    });

    const result = await readFile("test_binary");
    expect(result.equals(binary)).toBe(true);
  });

  it("throws for non-existent file", async () => {
    await expect(readFile("test_nonexistent")).rejects.toThrow();
  });
});

describe("deleteFile", () => {
  it("removes a file from disk", async () => {
    const content = Buffer.from("to delete");
    await saveFile("test_delete", content, {
      fileName: "bye.txt",
      fileSize: content.length,
      mimeType: "text/plain",
    });

    await deleteFile("test_delete");

    await expect(
      fs.access(path.join(UPLOADS_DIR, "test_delete")),
    ).rejects.toThrow();
  });

  it("does not throw for non-existent file", async () => {
    await expect(deleteFile("test_nonexistent")).resolves.not.toThrow();
  });
});

describe("metadata serialization", () => {
  it("round-trips file metadata", () => {
    const meta = { fileName: "report.pdf", fileSize: 12345, mimeType: "application/pdf" };
    const serialized = serializeFileMetadata(meta);
    const parsed = parseFileMetadata(serialized);
    expect(parsed).toEqual(meta);
  });
});
