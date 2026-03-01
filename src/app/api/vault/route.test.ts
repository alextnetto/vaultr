import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET, POST } from "./route";

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

const mockListItems = vi.fn();
const mockCreateItem = vi.fn();
vi.mock("@/lib/vault.service", () => ({
  listItems: (...args: unknown[]) => mockListItems(...args),
  createItem: (...args: unknown[]) => mockCreateItem(...args),
}));

vi.mock("@/lib/validation", () => ({
  vaultItemSchema: {
    safeParse: (data: { label?: string; value?: string; type?: string }) => {
      if (!data.label || data.label.length < 1) {
        return {
          success: false as const,
          error: { errors: [{ message: "Label is required" }] },
        };
      }
      if (!data.value || data.value.length < 1) {
        return {
          success: false as const,
          error: { errors: [{ message: "Value is required" }] },
        };
      }
      return {
        success: true as const,
        data: { label: data.label, value: data.value, type: data.type || "text" },
      };
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makePostRequest(body: unknown) {
  return new Request("http://localhost/api/vault", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

describe("GET /api/vault", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns items for authenticated user", async () => {
    const items = [
      { id: "item_1", label: "My Link", value: "https://example.com", type: "url", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
      { id: "item_2", label: "My Note", value: "some text", type: "text", createdAt: new Date().toISOString(), updatedAt: new Date().toISOString() },
    ];
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockListItems.mockResolvedValue(items);

    const res = await GET();
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(items);
    expect(mockListItems).toHaveBeenCalledWith("user_1");
  });
});

describe("POST /api/vault", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(makePostRequest({ label: "Test", value: "val" }));
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 on Zod validation failure (missing label)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });

    const res = await POST(makePostRequest({ label: "", value: "some value" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Label is required");
    expect(mockCreateItem).not.toHaveBeenCalled();
  });

  it("returns 201 on successful creation", async () => {
    const item = {
      id: "item_1",
      label: "My Secret",
      value: "secret-value",
      type: "text",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockCreateItem.mockResolvedValue(item);

    const res = await POST(makePostRequest({ label: "My Secret", value: "secret-value" }));
    const json = await res.json();

    expect(res.status).toBe(201);
    expect(json).toEqual(item);
    expect(mockCreateItem).toHaveBeenCalledWith({
      userId: "user_1",
      label: "My Secret",
      value: "secret-value",
      type: "text",
    });
  });

  it("returns 400 on service error", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockCreateItem.mockRejectedValue(new Error("Label is required"));

    const res = await POST(makePostRequest({ label: "Test", value: "val" }));
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBe("Label is required");
  });
});
