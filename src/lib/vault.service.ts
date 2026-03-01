import { prisma } from "./db";
import { encrypt, decrypt } from "./crypto";
import { deleteFile } from "./file.service";

export type ItemType = "text" | "url" | "number" | "document";

export type CreateItemInput = {
  userId: string;
  label: string;
  value: string;
  type?: ItemType;
};

export type UpdateItemInput = {
  id: string;
  userId: string;
  label?: string;
  value?: string;
  type?: ItemType;
};

export type VaultItemResponse = {
  id: string;
  label: string;
  value: string;
  type: string;
  createdAt: Date;
  updatedAt: Date;
};

export async function listItems(userId: string): Promise<VaultItemResponse[]> {
  const items = await prisma.vaultItem.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return items.map((item) => ({
    ...item,
    value: decrypt(item.value),
  }));
}

export async function createItem(input: CreateItemInput): Promise<VaultItemResponse> {
  const { userId, label, value, type = "text" } = input;

  if (!label.trim()) {
    throw new Error("Label is required");
  }

  if (!value.trim()) {
    throw new Error("Value is required");
  }

  const item = await prisma.vaultItem.create({
    data: {
      userId,
      label: label.trim(),
      value: encrypt(value),
      type,
    },
  });

  return { ...item, value };
}

export async function updateItem(input: UpdateItemInput): Promise<VaultItemResponse> {
  const { id, userId, label, value, type } = input;

  const existing = await prisma.vaultItem.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error("Item not found");
  }

  const data: Record<string, unknown> = {};
  if (label !== undefined) data.label = label.trim();
  if (value !== undefined) data.value = encrypt(value);
  if (type !== undefined) data.type = type;

  const updated = await prisma.vaultItem.update({
    where: { id },
    data,
  });

  return {
    ...updated,
    value: value !== undefined ? value : decrypt(updated.value),
  };
}

export async function deleteItem(id: string, userId: string): Promise<void> {
  const existing = await prisma.vaultItem.findUnique({ where: { id } });
  if (!existing || existing.userId !== userId) {
    throw new Error("Item not found");
  }

  if (existing.type === "document") {
    await deleteFile(id);
  }

  await prisma.vaultItem.delete({ where: { id } });
}
