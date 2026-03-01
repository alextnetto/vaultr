import bcrypt from "bcryptjs";
import { prisma } from "./db";
import { decrypt } from "./crypto";

export type ExpiryOption = "1h" | "24h" | "7d" | "30d";

export type CreateShareInput = {
  userId: string;
  itemIds: string[];
  expiresIn: ExpiryOption;
  password?: string;
};

export type ShareResponse = {
  id: string;
  expiresAt: Date;
};

export type ShareViewResponse = {
  items: Array<{ id: string; label: string; value: string; type: string }>;
  expiresAt: Date;
  createdAt: Date;
};

export type ShareListItem = {
  id: string;
  itemIds: string[];
  expiresAt: Date;
  viewCount: number;
  revoked: boolean;
  hasPassword: boolean;
  createdAt: Date;
};

function computeExpiry(expiresIn: ExpiryOption): Date {
  const expiresAt = new Date();
  switch (expiresIn) {
    case "1h":
      expiresAt.setHours(expiresAt.getHours() + 1);
      break;
    case "24h":
      expiresAt.setHours(expiresAt.getHours() + 24);
      break;
    case "7d":
      expiresAt.setDate(expiresAt.getDate() + 7);
      break;
    case "30d":
      expiresAt.setDate(expiresAt.getDate() + 30);
      break;
  }
  return expiresAt;
}

export async function createShare(input: CreateShareInput): Promise<ShareResponse> {
  const { userId, itemIds, expiresIn, password } = input;

  if (itemIds.length === 0) {
    throw new Error("At least one item must be selected");
  }

  const expiresAt = computeExpiry(expiresIn);
  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  const share = await prisma.share.create({
    data: {
      userId,
      itemIds: JSON.stringify(itemIds),
      password: hashedPassword,
      expiresAt,
    },
  });

  return { id: share.id, expiresAt: share.expiresAt };
}

export async function listShares(userId: string): Promise<ShareListItem[]> {
  const shares = await prisma.share.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return shares.map((s) => ({
    id: s.id,
    itemIds: JSON.parse(s.itemIds) as string[],
    expiresAt: s.expiresAt,
    viewCount: s.viewCount,
    revoked: s.revoked,
    hasPassword: !!s.password,
    createdAt: s.createdAt,
  }));
}

export type ViewShareResult =
  | { status: "ok"; data: ShareViewResponse }
  | { status: "expired" }
  | { status: "not_found" }
  | { status: "password_required"; expiresAt: Date }
  | { status: "invalid_password" };

export async function viewShare(
  shareId: string,
  password?: string,
): Promise<ViewShareResult> {
  const share = await prisma.share.findUnique({ where: { id: shareId } });

  if (!share) {
    return { status: "not_found" };
  }

  if (share.revoked || new Date() > share.expiresAt) {
    return { status: "expired" };
  }

  if (share.password) {
    if (!password) {
      return { status: "password_required", expiresAt: share.expiresAt };
    }
    const valid = await bcrypt.compare(password, share.password);
    if (!valid) {
      return { status: "invalid_password" };
    }
  }

  await prisma.share.update({
    where: { id: shareId },
    data: { viewCount: { increment: 1 } },
  });

  const itemIds = JSON.parse(share.itemIds) as string[];
  const items = await prisma.vaultItem.findMany({
    where: { id: { in: itemIds } },
    orderBy: { createdAt: "asc" },
  });

  const decryptedItems = items.map((item) => ({
    id: item.id,
    label: item.label,
    value: decrypt(item.value),
    type: item.type,
  }));

  return {
    status: "ok",
    data: {
      items: decryptedItems,
      expiresAt: share.expiresAt,
      createdAt: share.createdAt,
    },
  };
}

export async function revokeShare(shareId: string, userId: string): Promise<void> {
  const share = await prisma.share.findUnique({ where: { id: shareId } });

  if (!share || share.userId !== userId) {
    throw new Error("Share not found");
  }

  await prisma.share.update({
    where: { id: shareId },
    data: { revoked: true },
  });
}
