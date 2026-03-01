import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { encrypt } from "@/lib/crypto";
import { saveFile, serializeFileMetadata } from "@/lib/file.service";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const formData = await req.formData();
    const file = formData.get("file") as File | null;
    const label = formData.get("label") as string | null;

    if (!file || !label?.trim()) {
      return NextResponse.json({ error: "File and label are required" }, { status: 400 });
    }

    const buffer = Buffer.from(await file.arrayBuffer());

    const metadata = serializeFileMetadata({
      fileName: file.name,
      fileSize: buffer.length,
      mimeType: file.type || "application/octet-stream",
    });

    const item = await prisma.vaultItem.create({
      data: {
        userId: session.user.id,
        label: label.trim(),
        value: encrypt(metadata),
        type: "document",
      },
    });

    await saveFile(item.id, buffer, {
      fileName: file.name,
      fileSize: buffer.length,
      mimeType: file.type || "application/octet-stream",
    });

    return NextResponse.json(
      {
        id: item.id,
        label: item.label,
        value: metadata,
        type: item.type,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt,
      },
      { status: 201 },
    );
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}
