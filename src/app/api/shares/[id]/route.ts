import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import bcrypt from "bcryptjs";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const { id } = params;
  const url = new URL(req.url);
  const password = url.searchParams.get("password");

  const share = await prisma.share.findUnique({ where: { id } });

  if (!share) {
    return NextResponse.json({ error: "Share not found" }, { status: 404 });
  }

  if (share.revoked) {
    return NextResponse.json({ error: "This share has been revoked", expired: true }, { status: 410 });
  }

  if (new Date() > share.expiresAt) {
    return NextResponse.json({ error: "This share has expired", expired: true }, { status: 410 });
  }

  if (share.password) {
    if (!password) {
      return NextResponse.json({ passwordRequired: true, expiresAt: share.expiresAt });
    }
    const valid = await bcrypt.compare(password, share.password);
    if (!valid) {
      return NextResponse.json({ error: "Invalid password", passwordRequired: true }, { status: 401 });
    }
  }

  // Increment view count
  await prisma.share.update({
    where: { id },
    data: { viewCount: { increment: 1 } },
  });

  // Fetch fields
  const fieldIds = JSON.parse(share.fieldIds) as string[];
  const fields = await prisma.vaultField.findMany({
    where: { id: { in: fieldIds } },
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });

  const decryptedFields = fields.map((f) => ({
    id: f.id,
    category: f.category,
    label: f.label,
    value: decrypt(f.value),
  }));

  return NextResponse.json({
    fields: decryptedFields,
    expiresAt: share.expiresAt,
    createdAt: share.createdAt,
  });
}

export async function DELETE(req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const share = await prisma.share.findUnique({ where: { id: params.id } });

  if (!share || share.userId !== userId) {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }

  await prisma.share.update({
    where: { id: params.id },
    data: { revoked: true },
  });

  return NextResponse.json({ success: true });
}
