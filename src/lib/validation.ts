import { z } from "zod";

export const registerSchema = z.object({
  email: z.string().email("Invalid email address"),
  password: z.string().min(8, "Password must be at least 8 characters"),
});

export const vaultItemSchema = z.object({
  label: z.string().min(1, "Label is required").max(256, "Label too long"),
  value: z.string().min(1, "Value is required").max(1_000_000, "Value too long"),
  type: z.enum(["text", "url", "number", "document"]).default("text"),
});

export const vaultItemUpdateSchema = z.object({
  label: z.string().min(1).max(256).optional(),
  value: z.string().min(1).max(1_000_000).optional(),
  type: z.enum(["text", "url", "number", "document"]).optional(),
});

export const createShareSchema = z.object({
  itemIds: z.array(z.string()).min(1, "At least one item must be selected").max(100),
  expiresIn: z.enum(["1h", "24h", "7d", "30d"]),
  password: z.string().min(1).max(128).optional(),
});
