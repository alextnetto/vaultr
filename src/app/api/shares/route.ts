import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import bcrypt from "bcryptjs";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { fieldIds, password, expiresIn } = await req.json();

  // Calculate expiry
  const expiresAt = new Date();
  switch (expiresIn) {
    case "1h": expiresAt.setHours(expiresAt.getHours() + 1); break;
    case "24h": expiresAt.setHours(expiresAt.getHours() + 24); break;
    case "7d": expiresAt.setDate(expiresAt.getDate() + 7); break;
    case "30d": expiresAt.setDate(expiresAt.getDate() + 30); break;
    default: expiresAt.setHours(expiresAt.getHours() + 24);
  }

  const hashedPassword = password ? await bcrypt.hash(password, 10) : null;

  const share = await prisma.share.create({
    data: {
      userId,
      fieldIds: JSON.stringify(fieldIds),
      password: hashedPassword,
      expiresAt,
    },
  });

  return NextResponse.json({ id: share.id, expiresAt: share.expiresAt });
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const shares = await prisma.share.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(shares);
}
