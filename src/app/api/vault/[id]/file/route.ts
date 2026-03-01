import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { readFile, parseFileMetadata } from "@/lib/file.service";

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-() ]/g, "_");
}

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const item = await prisma.vaultItem.findUnique({ where: { id: params.id } });

    if (!item || item.type !== "document" || item.userId !== session.user.id) {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const metadata = parseFileMetadata(decrypt(item.value));
    const fileBuffer = await readFile(item.id);
    const safeName = sanitizeFilename(metadata.fileName);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": metadata.mimeType,
        "Content-Disposition": `attachment; filename="${safeName}"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
