import { describe, it, expect } from "vitest";
import { encrypt, decrypt } from "./crypto";

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
});
