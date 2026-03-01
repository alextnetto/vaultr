import { describe, it, expect, vi, beforeEach } from "vitest";
import { GET } from "./route";

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/auth", () => ({
  authOptions: {},
}));

const mockFindUnique = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    vaultItem: { findUnique: (...args: unknown[]) => mockFindUnique(...args) },
  },
}));

vi.mock("@/lib/crypto", () => ({
  decrypt: vi.fn(() => JSON.stringify({ fileName: "test.pdf", fileSize: 100, mimeType: "application/pdf" })),
}));

vi.mock("@/lib/file.service", () => ({
  readFile: vi.fn(async () => Buffer.from("file-content")),
  parseFileMetadata: vi.fn((value: string) => JSON.parse(value)),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makeRequest() {
  return new Request("http://localhost/api/vault/item_1/file");
}

describe("GET /api/vault/[id]/file", () => {
  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await GET(makeRequest(), { params: { id: "item_1" } });
    expect(res.status).toBe(401);
  });

  it("returns 404 when item does not belong to user", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockFindUnique.mockResolvedValue({
      id: "item_1",
      userId: "user_2",
      type: "document",
      value: "encrypted",
    });

    const res = await GET(makeRequest(), { params: { id: "item_1" } });
    expect(res.status).toBe(404);
  });

  it("returns 404 when item is not a document", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockFindUnique.mockResolvedValue({
      id: "item_1",
      userId: "user_1",
      type: "text",
      value: "encrypted",
    });

    const res = await GET(makeRequest(), { params: { id: "item_1" } });
    expect(res.status).toBe(404);
  });

  it("returns file with correct headers when authorized", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockFindUnique.mockResolvedValue({
      id: "item_1",
      userId: "user_1",
      type: "document",
      value: "encrypted",
    });

    const res = await GET(makeRequest(), { params: { id: "item_1" } });
    expect(res.status).toBe(200);
    expect(res.headers.get("Content-Type")).toBe("application/pdf");
    expect(res.headers.get("Content-Disposition")).toContain("test.pdf");
  });
});
