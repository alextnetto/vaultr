import { describe, it, expect, vi, beforeEach } from "vitest";
import { POST } from "./route";

const mockGetServerSession = vi.fn();
vi.mock("next-auth", () => ({
  getServerSession: (...args: unknown[]) => mockGetServerSession(...args),
}));

vi.mock("@/lib/auth", () => ({ authOptions: {} }));

const mockCreate = vi.fn();
vi.mock("@/lib/db", () => ({
  prisma: {
    vaultItem: { create: (...args: unknown[]) => mockCreate(...args) },
  },
}));

vi.mock("@/lib/crypto", () => ({
  encrypt: vi.fn(() => "encrypted-value"),
}));

const mockSaveFile = vi.fn();
vi.mock("@/lib/file.service", () => ({
  saveFile: (...args: unknown[]) => mockSaveFile(...args),
  serializeFileMetadata: vi.fn((meta: Record<string, unknown>) => JSON.stringify(meta)),
}));

beforeEach(() => {
  vi.clearAllMocks();
});

function makeUploadRequest(fields: Record<string, string | File>) {
  const formData = new FormData();
  for (const [key, value] of Object.entries(fields)) {
    formData.append(key, value);
  }
  return new Request("http://localhost/api/vault/upload", {
    method: "POST",
    body: formData,
  });
}

function makeTestFile(name = "report.pdf", content = "pdf-content", type = "application/pdf") {
  return new File([content], name, { type });
}

describe("Document Upload", () => {
  it("unauthenticated users cannot upload documents", async () => {
    mockGetServerSession.mockResolvedValue(null);

    const res = await POST(makeUploadRequest({ file: makeTestFile(), label: "Report" }));
    expect(res.status).toBe(401);
  });

  it("user can upload a document with a label", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockCreate.mockResolvedValue({
      id: "item_1", userId: "user_1", label: "Report", value: "encrypted-value",
      type: "document", createdAt: new Date(), updatedAt: new Date(),
    });
    mockSaveFile.mockResolvedValue(undefined);

    const res = await POST(makeUploadRequest({ file: makeTestFile(), label: "Report" }));
    const data = await res.json();

    expect(res.status).toBe(201);
    expect(data.label).toBe("Report");
    expect(data.type).toBe("document");
    expect(mockSaveFile).toHaveBeenCalledOnce();
  });

  it("upload requires a file to be attached", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });

    const res = await POST(makeUploadRequest({ label: "Report" }));
    expect(res.status).toBe(400);
  });

  it("upload requires a label", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });

    const res = await POST(makeUploadRequest({ file: makeTestFile() }));
    expect(res.status).toBe(400);
  });

  it("rejects files that are too large", async () => {
    mockGetServerSession.mockResolvedValue({ user: { id: "user_1" } });
    mockCreate.mockResolvedValue({
      id: "item_1", userId: "user_1", label: "Big File", value: "encrypted-value",
      type: "document", createdAt: new Date(), updatedAt: new Date(),
    });
    mockSaveFile.mockRejectedValue(new Error("File too large (max 5MB)"));

    const res = await POST(makeUploadRequest({ file: makeTestFile(), label: "Big File" }));
    expect(res.status).toBe(400);
  });
});
