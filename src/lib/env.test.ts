import { describe, it, expect, beforeEach, afterEach } from "vitest";
import { getEncryptionKey, getNextAuthSecret } from "./env";

describe("Encryption Key Configuration", () => {
  const originalEnv = process.env.ENCRYPTION_KEY;

  beforeEach(() => {
    process.env.ENCRYPTION_KEY = originalEnv;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.ENCRYPTION_KEY = originalEnv;
    } else {
      delete process.env.ENCRYPTION_KEY;
    }
  });

  it("provides the encryption key when properly configured", () => {
    process.env.ENCRYPTION_KEY = "my-secret-key";
    expect(getEncryptionKey()).toBe("my-secret-key");
  });

  it("refuses to start without an encryption key", () => {
    delete process.env.ENCRYPTION_KEY;
    expect(() => getEncryptionKey()).toThrow(
      "Missing required environment variable: ENCRYPTION_KEY"
    );
  });
});

describe("Auth Secret Configuration", () => {
  const originalEnv = process.env.NEXTAUTH_SECRET;

  beforeEach(() => {
    process.env.NEXTAUTH_SECRET = originalEnv;
  });

  afterEach(() => {
    if (originalEnv !== undefined) {
      process.env.NEXTAUTH_SECRET = originalEnv;
    } else {
      delete process.env.NEXTAUTH_SECRET;
    }
  });

  it("provides the auth secret when properly configured", () => {
    process.env.NEXTAUTH_SECRET = "my-auth-secret";
    expect(getNextAuthSecret()).toBe("my-auth-secret");
  });

  it("refuses to start without an auth secret", () => {
    delete process.env.NEXTAUTH_SECRET;
    expect(() => getNextAuthSecret()).toThrow(
      "Missing required environment variable: NEXTAUTH_SECRET"
    );
  });
});
