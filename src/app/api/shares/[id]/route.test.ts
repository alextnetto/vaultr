import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, DELETE } from "./route";

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockViewShare = vi.fn();
const mockRevokeShare = vi.fn();
vi.mock("@/lib/share.service", () => ({
  viewShare: (...args: unknown[]) => mockViewShare(...args),
  revokeShare: (...args: unknown[]) => mockRevokeShare(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makeGetRequest(id: string, password?: string) {
  const url = password
    ? `http://localhost/api/shares/${id}?password=${password}`
    : `http://localhost/api/shares/${id}`;
  return new Request(url);
}

describe("Viewing a Shared Link (public, no auth required)", () => {
  it("returns 404 when the share link does not exist", async () => {
    mockViewShare.mockResolvedValue({ status: "not_found" });

    const res = await GET(makeGetRequest("bad_id"), { params: { id: "bad_id" } });
    expect(res.status).toBe(404);
  });

  it("tells the viewer when a share has expired", async () => {
    mockViewShare.mockResolvedValue({ status: "expired" });

    const res = await GET(makeGetRequest("share_1"), { params: { id: "share_1" } });
    const data = await res.json();

    expect(res.status).toBe(410);
    expect(data.expired).toBe(true);
  });

  it("prompts for password when the share is password-protected", async () => {
    mockViewShare.mockResolvedValue({
      status: "password_required",
      expiresAt: new Date("2026-04-01"),
    });

    const res = await GET(makeGetRequest("share_1"), { params: { id: "share_1" } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.passwordRequired).toBe(true);
    expect(data.expiresAt).toBeDefined();
  });

  it("rejects incorrect password with 401", async () => {
    mockViewShare.mockResolvedValue({ status: "invalid_password" });

    const res = await GET(makeGetRequest("share_1", "wrong"), { params: { id: "share_1" } });
    const data = await res.json();

    expect(res.status).toBe(401);
    expect(data.passwordRequired).toBe(true);
  });

  it("shows shared items when access is granted", async () => {
    mockViewShare.mockResolvedValue({
      status: "ok",
      data: {
        items: [{ id: "item_1", label: "My API Key", value: "sk-123", type: "text" }],
        expiresAt: new Date(),
        createdAt: new Date(),
      },
    });

    const res = await GET(makeGetRequest("share_1"), { params: { id: "share_1" } });
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.items).toHaveLength(1);
    expect(data.items[0].label).toBe("My API Key");
  });
});

describe("Revoking a Share Link", () => {
  it("unauthenticated users cannot revoke share links", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await DELETE(
      new Request("http://localhost/api/shares/share_1", { method: "DELETE" }),
      { params: { id: "share_1" } },
    );
    expect(res.status).toBe(401);
  });

  it("owner can revoke their share link", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockRevokeShare.mockResolvedValue(undefined);

    const res = await DELETE(
      new Request("http://localhost/api/shares/share_1", { method: "DELETE" }),
      { params: { id: "share_1" } },
    );
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data.success).toBe(true);
    expect(mockRevokeShare).toHaveBeenCalledWith("share_1", "user_1");
  });

  it("cannot revoke a share that does not belong to the user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockRevokeShare.mockRejectedValue(new Error("Share not found"));

    const res = await DELETE(
      new Request("http://localhost/api/shares/share_1", { method: "DELETE" }),
      { params: { id: "share_1" } },
    );
    expect(res.status).toBe(404);
  });
});
