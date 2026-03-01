import { describe, it, expect } from "vitest";
import {
  registerSchema,
  vaultItemSchema,
  vaultItemUpdateSchema,
  createShareSchema,
} from "./validation";

describe("Registration Rules", () => {
  it("accepts valid email and password (8+ chars)", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "securepass",
    });
    expect(result.success).toBe(true);
  });

  it("requires a valid email address", () => {
    const result = registerSchema.safeParse({
      email: "not-an-email",
      password: "securepass",
    });
    expect(result.success).toBe(false);
  });

  it("enforces minimum 8-character password", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
      password: "short",
    });
    expect(result.success).toBe(false);
  });

  it("email is required", () => {
    const result = registerSchema.safeParse({
      password: "securepass",
    });
    expect(result.success).toBe(false);
  });

  it("password is required", () => {
    const result = registerSchema.safeParse({
      email: "user@example.com",
    });
    expect(result.success).toBe(false);
  });
});

describe("Vault Item Rules", () => {
  it("items default to type 'text' when not specified", () => {
    const result = vaultItemSchema.safeParse({
      label: "My Item",
      value: "Some value",
    });
    expect(result.success).toBe(true);
    if (result.success) {
      expect(result.data.type).toBe("text");
    }
  });

  it("every item must have a label", () => {
    const result = vaultItemSchema.safeParse({
      label: "",
      value: "Some value",
    });
    expect(result.success).toBe(false);
  });

  it("every item must have a value", () => {
    const result = vaultItemSchema.safeParse({
      label: "My Item",
      value: "",
    });
    expect(result.success).toBe(false);
  });

  it("only allows supported item types", () => {
    const result = vaultItemSchema.safeParse({
      label: "My Item",
      value: "Some value",
      type: "invalid",
    });
    expect(result.success).toBe(false);
  });

  it.each(["text", "url", "number", "document"] as const)(
    "accepts valid type: %s",
    (type) => {
      const result = vaultItemSchema.safeParse({
        label: "My Item",
        value: "Some value",
        type,
      });
      expect(result.success).toBe(true);
      if (result.success) {
        expect(result.data.type).toBe(type);
      }
    }
  );
});

describe("Vault Item Update Rules", () => {
  it("users can update just the label", () => {
    const result = vaultItemUpdateSchema.safeParse({
      label: "Updated Label",
    });
    expect(result.success).toBe(true);
  });

  it("users can update just the value", () => {
    const result = vaultItemUpdateSchema.safeParse({
      value: "Updated Value",
    });
    expect(result.success).toBe(true);
  });

  it("users can change the item type", () => {
    const result = vaultItemUpdateSchema.safeParse({
      type: "url",
    });
    expect(result.success).toBe(true);
  });

  it("a no-op update is valid (all fields optional)", () => {
    const result = vaultItemUpdateSchema.safeParse({});
    expect(result.success).toBe(true);
  });

  it("only allows supported item types on update", () => {
    const result = vaultItemUpdateSchema.safeParse({
      type: "invalid",
    });
    expect(result.success).toBe(false);
  });
});

describe("Share Link Rules", () => {
  it("a share with items and valid expiry is accepted", () => {
    const result = createShareSchema.safeParse({
      itemIds: ["item-1", "item-2"],
      expiresIn: "24h",
    });
    expect(result.success).toBe(true);
  });

  it("must select at least one item to share", () => {
    const result = createShareSchema.safeParse({
      itemIds: [],
      expiresIn: "24h",
    });
    expect(result.success).toBe(false);
  });

  it("only allows predefined expiry durations", () => {
    const result = createShareSchema.safeParse({
      itemIds: ["item-1"],
      expiresIn: "2h",
    });
    expect(result.success).toBe(false);
  });

  it.each(["1h", "24h", "7d", "30d"] as const)(
    "accepts valid expiresIn: %s",
    (expiresIn) => {
      const result = createShareSchema.safeParse({
        itemIds: ["item-1"],
        expiresIn,
      });
      expect(result.success).toBe(true);
    }
  );

  it("password protection is optional", () => {
    const withoutPassword = createShareSchema.safeParse({
      itemIds: ["item-1"],
      expiresIn: "1h",
    });
    expect(withoutPassword.success).toBe(true);

    const withPassword = createShareSchema.safeParse({
      itemIds: ["item-1"],
      expiresIn: "1h",
      password: "secret123",
    });
    expect(withPassword.success).toBe(true);
  });
});
