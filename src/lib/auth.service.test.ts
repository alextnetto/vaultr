import { describe, it, expect, vi, beforeEach } from "vitest";
import { registerUser, verifyCredentials } from "./auth.service";

vi.mock("./db", () => {
  const users: Array<{ id: string; email: string; password: string }> = [];
  return {
    prisma: {
      user: {
        findUnique: vi.fn(async ({ where }: { where: { email: string } }) => {
          return users.find((u) => u.email === where.email) || null;
        }),
        create: vi.fn(async ({ data }: { data: { email: string; password: string } }) => {
          const user = { id: `user_${users.length + 1}`, ...data };
          users.push(user);
          return user;
        }),
      },
      _users: users,
    },
  };
});

beforeEach(async () => {
  const { prisma } = await import("./db");
  (prisma as any)._users.length = 0;
  vi.clearAllMocks();
});

describe("registerUser", () => {
  it("rejects empty email", async () => {
    const result = await registerUser({ email: "", password: "123456" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Email and password required");
      expect(result.status).toBe(400);
    }
  });

  it("rejects empty password", async () => {
    const result = await registerUser({ email: "test@example.com", password: "" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Email and password required");
    }
  });

  it("rejects password shorter than 6 characters", async () => {
    const result = await registerUser({ email: "test@example.com", password: "12345" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Password must be at least 6 characters");
    }
  });

  it("registers a new user successfully", async () => {
    const result = await registerUser({ email: "new@example.com", password: "securepass" });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.user.email).toBe("new@example.com");
      expect(result.user.id).toBeDefined();
    }
  });

  it("rejects duplicate email", async () => {
    await registerUser({ email: "dupe@example.com", password: "password123" });
    const result = await registerUser({ email: "dupe@example.com", password: "password456" });
    expect(result.success).toBe(false);
    if (!result.success) {
      expect(result.error).toBe("Email already registered");
    }
  });

  it("hashes the password (does not store plaintext)", async () => {
    const { prisma } = await import("./db");
    await registerUser({ email: "hash@example.com", password: "mypassword" });
    const createCall = vi.mocked(prisma.user.create).mock.calls[0][0];
    expect(createCall.data.password).not.toBe("mypassword");
    expect(createCall.data.password.startsWith("$2")).toBe(true);
  });
});

describe("verifyCredentials", () => {
  beforeEach(async () => {
    await registerUser({ email: "user@example.com", password: "correct-password" });
  });

  it("returns user for valid credentials", async () => {
    const user = await verifyCredentials("user@example.com", "correct-password");
    expect(user).not.toBeNull();
    expect(user?.email).toBe("user@example.com");
  });

  it("returns null for wrong password", async () => {
    const user = await verifyCredentials("user@example.com", "wrong-password");
    expect(user).toBeNull();
  });

  it("returns null for non-existent email", async () => {
    const user = await verifyCredentials("nobody@example.com", "correct-password");
    expect(user).toBeNull();
  });
});
