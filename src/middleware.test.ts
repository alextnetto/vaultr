import { describe, it, expect, vi, beforeEach } from "vitest";
import { NextRequest, NextResponse } from "next/server";
import { middleware } from "./middleware";

vi.mock("next-auth/jwt", () => ({
  getToken: vi.fn(),
}));

import { getToken } from "next-auth/jwt";

const mockedGetToken = vi.mocked(getToken);

function createRequest(path: string): NextRequest {
  return new NextRequest(new URL(path, "http://localhost:3000"));
}

describe("Route Protection", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("unauthenticated visitors are redirected to login", async () => {
    mockedGetToken.mockResolvedValue(null);

    const req = createRequest("/vault");
    const response = await middleware(req);

    expect(response.status).toBe(307);
    const location = response.headers.get("location");
    expect(location).toBeDefined();
    const redirectUrl = new URL(location!);
    expect(redirectUrl.pathname).toBe("/login");
  });

  it("redirect preserves the original URL so users return after login", async () => {
    mockedGetToken.mockResolvedValue(null);

    const req = createRequest("/vault/items/123");
    const response = await middleware(req);

    const location = response.headers.get("location");
    expect(location).toBeDefined();
    const redirectUrl = new URL(location!);
    expect(redirectUrl.searchParams.get("callbackUrl")).toBe(
      "/vault/items/123"
    );
  });

  it("authenticated users can access protected routes", async () => {
    mockedGetToken.mockResolvedValue({ sub: "user-1" } as any);

    const req = createRequest("/vault");
    const response = await middleware(req);

    expect(response.status).toBe(200);
    expect(response.headers.get("location")).toBeNull();
  });
});
