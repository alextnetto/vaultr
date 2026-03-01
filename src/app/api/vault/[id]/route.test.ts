import { describe, it, expect, vi, beforeEach } from "vitest";
import { PUT, DELETE } from "./route";

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

const mockUpdateItem = vi.fn();
const mockDeleteItem = vi.fn();
vi.mock("@/lib/vault.service", () => ({
  updateItem: (...args: unknown[]) => mockUpdateItem(...args),
  deleteItem: (...args: unknown[]) => mockDeleteItem(...args),
}));

vi.mock("@/lib/validation", () => ({
  vaultItemUpdateSchema: {
    safeParse: (data: { label?: string; value?: string; type?: string }) => {
      const validTypes = ["text", "url", "number", "document"];
      if (data.label !== undefined && data.label.length < 1) {
        return {
          success: false as const,
          error: { errors: [{ message: "String must contain at least 1 character(s)" }] },
        };
      }
      if (data.type !== undefined && !validTypes.includes(data.type)) {
        return {
          success: false as const,
          error: { errors: [{ message: "Invalid enum value" }] },
        };
      }
      const result: Record<string, string> = {};
      if (data.label !== undefined) result.label = data.label;
      if (data.value !== undefined) result.value = data.value;
      if (data.type !== undefined) result.type = data.type;
      return { success: true as const, data: result };
    },
  },
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makePutRequest(body: unknown) {
  return new Request("http://localhost/api/vault/item_1", {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(body),
  });
}

function makeDeleteRequest() {
  return new Request("http://localhost/api/vault/item_1", {
    method: "DELETE",
  });
}

describe("PUT /api/vault/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await PUT(makePutRequest({ label: "New Label" }), { params: { id: "item_1" } });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns 400 on Zod validation failure", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });

    const res = await PUT(makePutRequest({ label: "" }), { params: { id: "item_1" } });
    const json = await res.json();

    expect(res.status).toBe(400);
    expect(json.error).toBeDefined();
    expect(mockUpdateItem).not.toHaveBeenCalled();
  });

  it("returns updated item on successful update", async () => {
    const updatedItem = {
      id: "item_1",
      label: "Updated Label",
      value: "my-value",
      type: "text",
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockUpdateItem.mockResolvedValue(updatedItem);

    const res = await PUT(makePutRequest({ label: "Updated Label" }), { params: { id: "item_1" } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual(updatedItem);
    expect(mockUpdateItem).toHaveBeenCalledWith({
      id: "item_1",
      userId: "user_1",
      label: "Updated Label",
    });
  });

  it("returns 404 on service error (item not found)", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockUpdateItem.mockRejectedValue(new Error("Item not found"));

    const res = await PUT(makePutRequest({ label: "New Label" }), { params: { id: "item_999" } });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Item not found");
  });
});

describe("DELETE /api/vault/[id]", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await DELETE(makeDeleteRequest(), { params: { id: "item_1" } });
    const json = await res.json();

    expect(res.status).toBe(401);
    expect(json.error).toBe("Unauthorized");
  });

  it("returns success on successful delete", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockDeleteItem.mockResolvedValue(undefined);

    const res = await DELETE(makeDeleteRequest(), { params: { id: "item_1" } });
    const json = await res.json();

    expect(res.status).toBe(200);
    expect(json).toEqual({ success: true });
    expect(mockDeleteItem).toHaveBeenCalledWith("item_1", "user_1");
  });

  it("returns 404 on service error", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockDeleteItem.mockRejectedValue(new Error("Item not found"));

    const res = await DELETE(makeDeleteRequest(), { params: { id: "item_1" } });
    const json = await res.json();

    expect(res.status).toBe(404);
    expect(json.error).toBe("Item not found");
  });
});
