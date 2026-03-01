import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockShareFindUnique = vi.fn();
const mockItemFindUnique = vi.fn();

vi.mock("@/lib/db", () => ({
  prisma: {
    share: { findUnique: (...args: unknown[]) => mockShareFindUnique(...args) },
    vaultItem: { findUnique: (...args: unknown[]) => mockItemFindUnique(...args) },
  },
}));

vi.mock("@/lib/crypto", () => ({
  decrypt: vi.fn(() => JSON.stringify({ fileName: "report.pdf", fileSize: 200, mimeType: "application/pdf" })),
}));

vi.mock("@/lib/file.service", () => ({
  readFile: vi.fn(async () => Buffer.from("file-content")),
  parseFileMetadata: vi.fn((value: string) => JSON.parse(value)),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

const validShare = {
  id: "share_1",
  userId: "user_1",
  itemIds: JSON.stringify(["item_1", "item_2"]),
  revoked: false,
  expiresAt: new Date(Date.now() + 86400000),
  viewCount: 0,
  createdAt: new Date(),
};

const documentItem = {
  id: "item_1",
  userId: "user_1",
  type: "document",
  label: "Report",
  value: "encrypted",
};

function makeRequest() {
  return new Request("http://localhost/api/shares/share_1/file/item_1");
}

describe("GET /api/shares/[id]/file/[itemId]", () => {
  it("returns 404 when share does not exist", async () => {
    mockShareFindUnique.mockResolvedValue(null);

    const res = await GET(makeRequest(), {
      params: { id: "share_1", itemId: "item_1" },
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when share is revoked", async () => {
    mockShareFindUnique.mockResolvedValue({ ...validShare, revoked: true });

    const res = await GET(makeRequest(), {
      params: { id: "share_1", itemId: "item_1" },
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when share is expired", async () => {
    mockShareFindUnique.mockResolvedValue({
      ...validShare,
      expiresAt: new Date(Date.now() - 1000),
    });

    const res = await GET(makeRequest(), {
      params: { id: "share_1", itemId: "item_1" },
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when item is not in the share", async () => {
    mockShareFindUnique.mockResolvedValue(validShare);

    const res = await GET(makeRequest(), {
      params: { id: "share_1", itemId: "item_999" },
    });
    expect(res.status).toBe(404);
  });

  it("returns 404 when item is not a document", async () => {
    mockShareFindUnique.mockResolvedValue(validShare);
    mockItemFindUnique.mockResolvedValue({ ...documentItem, type: "text" });

    const res = await GET(makeRequest(), {
      params: { id: "share_1", itemId: "item_1" },
    });
    expect(res.status).toBe(404);
  });

  it("returns file without requiring auth when share is valid", async () => {
    mockShareFindUnique.mockResolvedValue(validShare);
    mockItemFindUnique.mockResolvedValue(documentItem);

    const res = await GET(makeRequest(), {
      params: { id: "share_1", itemId: "item_1" },
    });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("report.pdf");
  });

  it("sanitizes filename in Content-Disposition header", async () => {
    const { decrypt } = await import("@/lib/crypto");
    vi.mocked(decrypt).mockReturnValueOnce(
      JSON.stringify({ fileName: 'mal"icious;file.pdf', fileSize: 100, mimeType: "application/pdf" }),
    );
    mockShareFindUnique.mockResolvedValue(validShare);
    mockItemFindUnique.mockResolvedValue(documentItem);

    const res = await GET(makeRequest(), {
      params: { id: "share_1", itemId: "item_1" },
    });
    expect(res.status).toBe(200);
    const disposition = res.headers.get("Content-Disposition") || "";
    expect(disposition).not.toContain('"icious');
    expect(disposition).not.toContain(";file");
  });
});
