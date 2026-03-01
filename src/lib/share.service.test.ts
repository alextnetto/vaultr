import { describe, it, expect, vi, beforeEach } from "vitest";
import { createShare, listShares, viewShare, revokeShare } from "./share.service";

type MockShare = {
  id: string;
  userId: string;
  itemIds: string;
  password: string | null;
  expiresAt: Date;
  viewCount: number;
  revoked: boolean;
  createdAt: Date;
};

type MockItem = {
  id: string;
  userId: string;
  label: string;
  value: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
};

const shares: MockShare[] = [];
const vaultItems: MockItem[] = [];
let shareIdCounter = 0;

vi.mock("./db", () => ({
  prisma: {
    share: {
      findUnique: vi.fn(async ({ where }: { where: { id: string } }) => {
        return shares.find((s) => s.id === where.id) || null;
      }),
      findMany: vi.fn(async ({ where }: { where: { userId: string } }) => {
        return shares
          .filter((s) => s.userId === where.userId)
          .sort((a, b) => b.createdAt.getTime() - a.createdAt.getTime());
      }),
      create: vi.fn(async ({ data }: { data: Omit<MockShare, "id" | "viewCount" | "revoked" | "createdAt"> }) => {
        const share: MockShare = {
          id: `share_${++shareIdCounter}`,
          viewCount: 0,
          revoked: false,
          createdAt: new Date(),
          ...data,
        };
        shares.push(share);
        return share;
      }),
      update: vi.fn(async ({ where, data }: { where: { id: string }; data: Record<string, unknown> }) => {
        const idx = shares.findIndex((s) => s.id === where.id);
        if (idx === -1) throw new Error("Not found");
        if (data.viewCount && typeof data.viewCount === "object") {
          shares[idx].viewCount += 1;
        } else {
          Object.assign(shares[idx], data);
        }
        return shares[idx];
      }),
    },
    vaultItem: {
      findMany: vi.fn(async ({ where }: { where: { id: { in: string[] }; userId?: string } }) => {
        return vaultItems
          .filter((i) => where.id.in.includes(i.id) && (!where.userId || i.userId === where.userId))
          .sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
      }),
    },
  },
}));

vi.mock("./crypto", () => ({
  decrypt: vi.fn((text: string) => text.replace("enc_", "")),
}));

beforeEach(() => {
  shares.length = 0;
  vaultItems.length = 0;
  shareIdCounter = 0;
  vi.clearAllMocks();
});

describe("createShare", () => {
  beforeEach(() => {
    vaultItems.push(
      { id: "item_1", userId: "user_1", label: "API Key", value: "enc_sk-123", type: "text", createdAt: new Date(), updatedAt: new Date() },
      { id: "item_2", userId: "user_1", label: "Website", value: "enc_https://example.com", type: "url", createdAt: new Date(), updatedAt: new Date() },
    );
  });

  it("creates a share with correct expiry", async () => {
    const before = new Date();
    const result = await createShare({
      userId: "user_1",
      itemIds: ["item_1", "item_2"],
      expiresIn: "24h",
    });

    expect(result.id).toBeDefined();
    expect(result.expiresAt.getTime()).toBeGreaterThan(before.getTime());
    const hoursDiff = (result.expiresAt.getTime() - before.getTime()) / 3600000;
    expect(hoursDiff).toBeGreaterThanOrEqual(23);
    expect(hoursDiff).toBeLessThanOrEqual(25);
  });

  it("rejects empty item list", async () => {
    await expect(
      createShare({ userId: "user_1", itemIds: [], expiresIn: "24h" }),
    ).rejects.toThrow("At least one item must be selected");
  });

  it("rejects items not owned by user", async () => {
    await expect(
      createShare({ userId: "user_999", itemIds: ["item_1"], expiresIn: "24h" }),
    ).rejects.toThrow("One or more items not found");
  });

  it("hashes password if provided", async () => {
    const { prisma } = await import("./db");
    await createShare({
      userId: "user_1",
      itemIds: ["item_1"],
      expiresIn: "1h",
      password: "secret",
    });

    const createCall = vi.mocked(prisma.share.create).mock.calls[0][0];
    expect(createCall.data.password).not.toBe("secret");
    expect(createCall.data.password?.startsWith("$2")).toBe(true);
  });

  it("stores null password when none provided", async () => {
    const { prisma } = await import("./db");
    await createShare({
      userId: "user_1",
      itemIds: ["item_1"],
      expiresIn: "1h",
    });

    const createCall = vi.mocked(prisma.share.create).mock.calls[0][0];
    expect(createCall.data.password).toBeNull();
  });

  it("computes 7d expiry correctly", async () => {
    const before = new Date();
    const result = await createShare({
      userId: "user_1",
      itemIds: ["item_1"],
      expiresIn: "7d",
    });

    const daysDiff = (result.expiresAt.getTime() - before.getTime()) / 86400000;
    expect(daysDiff).toBeGreaterThanOrEqual(6.9);
    expect(daysDiff).toBeLessThanOrEqual(7.1);
  });
});

describe("listShares", () => {
  beforeEach(() => {
    vaultItems.push(
      { id: "item_1", userId: "user_1", label: "API Key", value: "enc_sk-123", type: "text", createdAt: new Date(), updatedAt: new Date() },
      { id: "item_2", userId: "user_1", label: "Website", value: "enc_https://example.com", type: "url", createdAt: new Date(), updatedAt: new Date() },
    );
  });

  it("returns empty array when no shares exist", async () => {
    const result = await listShares("user_1");
    expect(result).toEqual([]);
  });

  it("returns shares for the user", async () => {
    await createShare({ userId: "user_1", itemIds: ["item_1"], expiresIn: "24h" });
    await createShare({ userId: "user_1", itemIds: ["item_2"], expiresIn: "1h" });

    const result = await listShares("user_1");
    expect(result).toHaveLength(2);
    const allItemIds = result.map((s) => s.itemIds).flat();
    expect(allItemIds).toContain("item_1");
    expect(allItemIds).toContain("item_2");
  });

  it("maps hasPassword correctly", async () => {
    await createShare({ userId: "user_1", itemIds: ["item_1"], expiresIn: "1h", password: "pw" });
    await createShare({ userId: "user_1", itemIds: ["item_2"], expiresIn: "1h" });

    const result = await listShares("user_1");
    const withPassword = result.filter((s) => s.hasPassword);
    const withoutPassword = result.filter((s) => !s.hasPassword);
    expect(withPassword).toHaveLength(1);
    expect(withoutPassword).toHaveLength(1);
  });
});

describe("viewShare", () => {
  beforeEach(async () => {
    vaultItems.push(
      { id: "item_1", userId: "user_1", label: "API Key", value: "enc_sk-123", type: "text", createdAt: new Date(), updatedAt: new Date() },
      { id: "item_2", userId: "user_1", label: "Website", value: "enc_https://example.com", type: "url", createdAt: new Date(), updatedAt: new Date() },
    );
  });

  it("returns not_found for non-existent share", async () => {
    const result = await viewShare("nonexistent");
    expect(result.status).toBe("not_found");
  });

  it("returns expired for revoked share", async () => {
    const share = await createShare({ userId: "user_1", itemIds: ["item_1"], expiresIn: "24h" });
    shares[0].revoked = true;

    const result = await viewShare(share.id);
    expect(result.status).toBe("expired");
  });

  it("returns expired for past-due share", async () => {
    await createShare({ userId: "user_1", itemIds: ["item_1"], expiresIn: "1h" });
    shares[0].expiresAt = new Date(Date.now() - 1000);

    const result = await viewShare(shares[0].id);
    expect(result.status).toBe("expired");
  });

  it("returns password_required when share has password", async () => {
    await createShare({ userId: "user_1", itemIds: ["item_1"], expiresIn: "24h", password: "secret" });

    const result = await viewShare(shares[0].id);
    expect(result.status).toBe("password_required");
  });

  it("returns invalid_password for wrong password", async () => {
    await createShare({ userId: "user_1", itemIds: ["item_1"], expiresIn: "24h", password: "correct" });

    const result = await viewShare(shares[0].id, "wrong");
    expect(result.status).toBe("invalid_password");
  });

  it("returns decrypted items for valid share", async () => {
    await createShare({ userId: "user_1", itemIds: ["item_1", "item_2"], expiresIn: "24h" });

    const result = await viewShare(shares[0].id);
    expect(result.status).toBe("ok");
    if (result.status === "ok") {
      expect(result.data.items).toHaveLength(2);
      expect(result.data.items[0].value).toBe("sk-123");
      expect(result.data.items[1].value).toBe("https://example.com");
    }
  });

  it("increments view count on successful view", async () => {
    await createShare({ userId: "user_1", itemIds: ["item_1"], expiresIn: "24h" });

    await viewShare(shares[0].id);
    expect(shares[0].viewCount).toBe(1);

    await viewShare(shares[0].id);
    expect(shares[0].viewCount).toBe(2);
  });

  it("returns items with password when correct password provided", async () => {
    await createShare({ userId: "user_1", itemIds: ["item_1"], expiresIn: "24h", password: "correct" });

    const result = await viewShare(shares[0].id, "correct");
    expect(result.status).toBe("ok");
  });
});

describe("revokeShare", () => {
  beforeEach(() => {
    vaultItems.push(
      { id: "item_1", userId: "user_1", label: "API Key", value: "enc_sk-123", type: "text", createdAt: new Date(), updatedAt: new Date() },
    );
  });

  it("revokes a share", async () => {
    await createShare({ userId: "user_1", itemIds: ["item_1"], expiresIn: "24h" });
    await revokeShare(shares[0].id, "user_1");
    expect(shares[0].revoked).toBe(true);
  });

  it("rejects revoke from wrong user", async () => {
    await createShare({ userId: "user_1", itemIds: ["item_1"], expiresIn: "24h" });
    await expect(revokeShare(shares[0].id, "user_999")).rejects.toThrow("Share not found");
  });

  it("rejects revoke for non-existent share", async () => {
    await expect(revokeShare("nonexistent", "user_1")).rejects.toThrow("Share not found");
  });
});
