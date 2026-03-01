import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

const mockRegisterUser = vi.fn();
vi.mock("@/lib/auth.service", () => ({
  registerUser: (...args: unknown[]) => mockRegisterUser(...args),
}));

vi.mock("@/lib/validation", () => ({
  registerSchema: {
    safeParse: (data: { email?: string; password?: string }) => {
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!data.email || !emailRegex.test(data.email)) {
        return {
          success: false as const,
          error: { errors: [{ message: "Invalid email address" }] },
        };
      }
      if (!data.password || data.password.length < 8) {
        return {
          success: false as const,
          error: { errors: [{ message: "Password must be at least 8 characters" }] },
        };
      }
      return { success: true as const, data };
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest(body: unknown) {
  return new Request("http://localhost/api/register", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("POST /api/register", () => {
  it("returns user data on valid registration", async () => {
    const user = { id: "user_1", email: "test@example.com" };
    mockRegisterUser.mockResolvedValue({ success: true, user });

    const res = await POST(makeRequest({ email: "test@example.com", password: "password123" }));
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(user);
    expect(mockRegisterUser).toHaveBeenCalledWith({
      email: "test@example.com",
      password: "password123",
    });
  });

  it("returns 400 with error message for invalid email", async () => {
    const res = await POST(makeRequest({ email: "not-an-email", password: "password123" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Invalid email address");
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });

  it("returns 400 for password too short", async () => {
    const res = await POST(makeRequest({ email: "test@example.com", password: "short" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Password must be at least 8 characters");
    expect(mockRegisterUser).not.toHaveBeenCalled();
  });

  it("returns the error with correct status when registerUser returns success:false", async () => {
    mockRegisterUser.mockResolvedValue({
      success: false,
      error: "Unable to create account",
      status: 400,
    });

    const res = await POST(makeRequest({ email: "existing@example.com", password: "password123" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Unable to create account");
  });

  it("returns 500 when req.json() throws (invalid JSON)", async () => {
    const badRequest = new Request("http://localhost/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: "not valid json{{{",
    });

    const res = await POST(badRequest);
    const json = await res.json();

    expect(res.status).toBe(500);
    expect(json.error).toBe("Something went wrong");
  });
});
