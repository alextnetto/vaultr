import { describe, it, expect } from "vitest";
import { encrypt, decrypt, encryptBuffer, decryptBuffer } from "./crypto";

describe("crypto", () => {
  describe("encrypt", () => {
    it("returns a string with three colon-separated segments", () => {
      const result = encrypt("hello");
      const parts = result.split(":");
      expect(parts).toHaveLength(3);
    });

    it("produces different ciphertext for the same input (random IV)", () => {
      const a = encrypt("same input");
      const b = encrypt("same input");
      expect(a).not.toBe(b);
    });

    it("handles empty strings", () => {
      const result = encrypt("");
      expect(result).toBeDefined();
      expect(result.split(":")).toHaveLength(3);
    });

    it("handles unicode text", () => {
      const result = encrypt("Hello, the world! 42");
      expect(result).toBeDefined();
    });
  });

  describe("decrypt", () => {
    it("recovers the original plaintext", () => {
      const plaintext = "my secret value";
      const encrypted = encrypt(plaintext);
      expect(decrypt(encrypted)).toBe(plaintext);
    });

    it("recovers empty strings", () => {
      const encrypted = encrypt("");
      expect(decrypt(encrypted)).toBe("");
    });

    it("recovers unicode text", () => {
      const text = "Hello, the world! 42";
      const encrypted = encrypt(text);
      expect(decrypt(encrypted)).toBe(text);
    });

    it("recovers long text", () => {
      const text = "a".repeat(10000);
      const encrypted = encrypt(text);
      expect(decrypt(encrypted)).toBe(text);
    });

    it("throws on tampered ciphertext", () => {
      const encrypted = encrypt("secret");
      const parts = encrypted.split(":");
      parts[2] = "0000" + parts[2].slice(4);
      expect(() => decrypt(parts.join(":"))).toThrow();
    });
  });

  describe("encryptBuffer", () => {
    it("returns a buffer larger than the input (IV + authTag + ciphertext)", () => {
      const input = Buffer.from("hello world");
      const encrypted = encryptBuffer(input);
      expect(encrypted.length).toBeGreaterThan(input.length);
      // At least 16 (IV) + 16 (authTag) + input length
      expect(encrypted.length).toBeGreaterThanOrEqual(32 + input.length);
    });

    it("produces different output for the same input (random IV)", () => {
      const input = Buffer.from("same content");
      const a = encryptBuffer(input);
      const b = encryptBuffer(input);
      expect(a.equals(b)).toBe(false);
    });
  });

  describe("decryptBuffer", () => {
    it("recovers the original buffer", () => {
      const original = Buffer.from("my secret file content");
      const encrypted = encryptBuffer(original);
      const decrypted = decryptBuffer(encrypted);
      expect(decrypted.equals(original)).toBe(true);
    });

    it("recovers binary data", () => {
      const original = Buffer.from([0x00, 0xff, 0x80, 0x7f, 0x01]);
      const encrypted = encryptBuffer(original);
      const decrypted = decryptBuffer(encrypted);
      expect(decrypted.equals(original)).toBe(true);
    });

    it("recovers large buffers", () => {
      const original = Buffer.alloc(100_000, 0xab);
      const encrypted = encryptBuffer(original);
      const decrypted = decryptBuffer(encrypted);
      expect(decrypted.equals(original)).toBe(true);
    });

    it("throws on tampered data", () => {
      const encrypted = encryptBuffer(Buffer.from("secret"));
      encrypted[33] = encrypted[33] ^ 0xff; // flip a byte in the ciphertext
      expect(() => decryptBuffer(encrypted)).toThrow();
    });
  });
});
