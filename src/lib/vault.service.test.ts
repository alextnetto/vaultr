import { describe, it, expect, vi, beforeEach } from "vitest";
import { listItems, createItem, updateItem, deleteItem } from "./vault.service";

type MockItem = {
  id: string;
  userId: string;
  label: string;
  value: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
};

const items: MockItem[] = [];
let idCounter = 0;

vi.mock("./db", () => ({
  prisma: {
    vaultItem: {
      findMany: vi.fn(async ({ where }: { where: { userId: string } }) => {
        return items
          .filter((i) => i.userId === where.userId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }),
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return items.find((i) => i.id === where.id) || null;
      }),
      create: vi.fn(async ({ data }: { data: Omit<MockItem, "id" | "createdAt" | "updatedAt"> }) => {
        const item: MockItem = {
          id: `item_${++idCounter}`,
          ...data,
          createdAt: new Date(),
          updatedAt: new Date(),
        };
        items.push(item);
        return item;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const idx = items.findIndex((i) => i.id === where.id);
        if (idx === -1) throw new Error("Not found");
        items[idx] = { ...items[idx], ...data, updatedAt: new Date() };
        return items[idx];
      }),
      delete: vi.fn(async ({ where }: { where: { id: string } }) => {
        const idx = items.findIndex((i) => i.id === where.id);
        if (idx === -1) throw new Error("Not found");
        items.splice(idx, 1);
      }),
    },
  },
}));

vi.mock("./crypto", () => ({
  encrypt: vi.fn((text: string) => `enc_${text}`),
  decrypt: vi.fn((text: string) => text.replace("enc_", "")),
}));

vi.mock("./file.service", () => ({
  deleteFile: vi.fn(async () => {}),
}));

beforeEach(() => {
  items.length = 0;
  idCounter = 0;
  vi.clearAllMocks();
});

describe("listItems", () => {
  it("returns empty array for user with no items", async () => {
    const result = await listItems("user_1");
    expect(result).toEqual([]);
  });

  it("returns decrypted items for the user", async () => {
    items.push({
      id: "item_1",
      userId: "user_1",
      label: "API Key",
      value: "enc_sk-123",
      type: "text",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await listItems("user_1");
    expect(result).toHaveLength(1);
    expect(result[0].label).toBe("API Key");
    expect(result[0].value).toBe("sk-123");
  });

  it("does not return items from other users", async () => {
    items.push({
      id: "item_1",
      userId: "user_2",
      label: "Secret",
      value: "enc_hidden",
      type: "text",
      createdAt: new Date(),
      updatedAt: new Date(),
    });

    const result = await listItems("user_1");
    expect(result).toHaveLength(0);
  });
});

describe("createItem", () => {
  it("creates an item with encrypted value", async () => {
    const result = await createItem({
      userId: "user_1",
      label: "Bank Account",
      value: "1234567890",
    });

    expect(result.label).toBe("Bank Account");
    expect(result.value).toBe("1234567890");
    expect(result.type).toBe("text");
    expect(result.id).toBeDefined();
  });

  it("trims label whitespace", async () => {
    const result = await createItem({
      userId: "user_1",
      label: "  My Label  ",
      value: "value",
    });

    expect(result.label).toBe("My Label");
  });

  it("accepts a type parameter", async () => {
    const result = await createItem({
      userId: "user_1",
      label: "Website",
      value: "https://example.com",
      type: "url",
    });

    expect(result.type).toBe("url");
  });

  it("rejects empty label", async () => {
    await expect(
      createItem({ userId: "user_1", label: "", value: "val" }),
    ).rejects.toThrow("Label is required");
  });

  it("rejects empty value", async () => {
    await expect(
      createItem({ userId: "user_1", label: "Key", value: "" }),
    ).rejects.toThrow("Value is required");
  });

  it("stores encrypted value in database", async () => {
    const { prisma } = await import("./db");
    await createItem({ userId: "user_1", label: "Key", value: "secret" });

    const createCall = vi.mocked(prisma.vaultItem.create).mock.calls[0][0];
    expect(createCall.data.value).toBe("enc_secret");
  });
});

describe("updateItem", () => {
  beforeEach(async () => {
    await createItem({ userId: "user_1", label: "Original", value: "original-value" });
  });

  it("updates the value", async () => {
    const result = await updateItem({
      id: "item_1",
      userId: "user_1",
      value: "new-value",
    });

    expect(result.value).toBe("new-value");
  });

  it("updates the label", async () => {
    const result = await updateItem({
      id: "item_1",
      userId: "user_1",
      label: "Updated Label",
    });

    expect(result.label).toBe("Updated Label");
  });

  it("rejects update from wrong user", async () => {
    await expect(
      updateItem({ id: "item_1", userId: "user_999", value: "hack" }),
    ).rejects.toThrow("Item not found");
  });

  it("rejects update for non-existent item", async () => {
    await expect(
      updateItem({ id: "nonexistent", userId: "user_1", value: "x" }),
    ).rejects.toThrow("Item not found");
  });

  it("trims whitespace on the label field", async () => {
    const result = await updateItem({
      id: "item_1",
      userId: "user_1",
      label: "  My Label  ",
    });

    expect(result.label).toBe("My Label");
  });
});

describe("deleteItem", () => {
  beforeEach(async () => {
    await createItem({ userId: "user_1", label: "To Delete", value: "bye" });
  });

  it("deletes an item", async () => {
    await deleteItem("item_1", "user_1");
    const result = await listItems("user_1");
    expect(result).toHaveLength(0);
  });

  it("rejects deletion from wrong user", async () => {
    await expect(deleteItem("item_1", "user_999")).rejects.toThrow("Item not found");
  });

  it("rejects deletion of non-existent item", async () => {
    await expect(deleteItem("nonexistent", "user_1")).rejects.toThrow("Item not found");
  });

  it("calls deleteFile when deleting a document-type item", async () => {
    const { deleteFile } = await import("./file.service");
    items.length = 0;
    idCounter = 0;
    await createItem({ userId: "user_1", label: "My Doc", value: "file-meta", type: "document" });

    await deleteItem("item_1", "user_1");

    expect(deleteFile).toHaveBeenCalledWith("item_1");
  });
});
