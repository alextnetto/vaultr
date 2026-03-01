import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST, GET } from "./route";

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockCreateShare = vi.fn();
const mockListShares = vi.fn();
vi.mock("@/lib/share.service", () => ({
  createShare: (...args: unknown[]) => mockCreateShare(...args),
  listShares: (...args: unknown[]) => mockListShares(...args),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/shares", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("Share Links — Creation", () => {
  it("unauthenticated users cannot create share links", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(makePostRequest({ itemIds: ["item_1"], expiresIn: "1h" }));
    expect(res.status).toBe(401);
  });

  it("user can create a share link with selected items and expiry", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockCreateShare.mockResolvedValue({ id: "share_1", expiresAt: new Date() });

    const res = await POST(makePostRequest({ itemIds: ["item_1", "item_2"], expiresIn: "24h" }));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.id).toBeDefined();
  });

  it("must select at least one item to share", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });

    const res = await POST(makePostRequest({ itemIds: [], expiresIn: "1h" }));
    expect(res.status).toBe(400);
    expect(mockCreateShare).not.toHaveBeenCalled();
  });

  it("only allows valid expiry durations (1h, 24h, 7d, 30d)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });

    const res = await POST(makePostRequest({ itemIds: ["item_1"], expiresIn: "999d" }));
    expect(res.status).toBe(400);
    expect(mockCreateShare).not.toHaveBeenCalled();
  });

  it("cannot share items that do not belong to the user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockCreateShare.mockRejectedValue(new Error("One or more items not found"));

    const res = await POST(makePostRequest({ itemIds: ["stolen_item"], expiresIn: "1h" }));
    expect(res.status).toBe(400);
  });

  it("password protection is optional", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockCreateShare.mockResolvedValue({ id: "share_1", expiresAt: new Date() });

    const res = await POST(makePostRequest({ itemIds: ["item_1"], expiresIn: "1h" }));
    expect(res.status).toBe(201);
  });
});

describe("Share Links — Listing", () => {
  it("unauthenticated users cannot list share links", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET();
    expect(res.status).toBe(401);
  });

  it("user sees all their active and past share links", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockListShares.mockResolvedValue([
      { id: "share_1", expiresAt: new Date() },
      { id: "share_2", expiresAt: new Date() },
    ]);

    const res = await GET();
    const data = await res.json();

    expect(res.status).toBe(200);
    expect(data).toHaveLength(2);
    expect(mockListShares).toHaveBeenCalledWith("user_1");
  });
});
