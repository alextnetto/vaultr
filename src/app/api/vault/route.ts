import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encrypt, decrypt } from "@/lib/crypto";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const fields = await prisma.vaultField.findMany({
    where: { userId },
    orderBy: [{ category: "asc" }, { order: "asc" }],
  });

  const decryptedFields = fields.map((f) => ({
    ...f,
    value: decrypt(f.value),
  }));

  return NextResponse.json(decryptedFields);
}

export async function PUT(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = (session.user as any).id;
  const { fields } = await req.json();

  // Upsert all fields
  const results = [];
  for (const field of fields) {
    if (field.id && field._delete) {
      await prisma.vaultField.delete({ where: { id: field.id } });
      continue;
    }

    const data = {
      userId,
      category: field.category,
      label: field.label,
      value: encrypt(field.value),
      order: field.order || 0,
    };

    if (field.id) {
      const updated = await prisma.vaultField.update({
        where: { id: field.id },
        data,
      });
      results.push({ ...updated, value: field.value });
    } else {
      const created = await prisma.vaultField.create({ data });
      results.push({ ...created, value: field.value });
    }
  }

  return NextResponse.json(results);
}
