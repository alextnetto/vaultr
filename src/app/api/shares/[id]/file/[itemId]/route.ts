import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { readFile, parseFileMetadata } from "@/lib/file.service";

function sanitizeFilename(name: string): string {
  return name.replace(/[^\w.\-() ]/g, "_");
}

export async function GET(
  req: Request,
  { params }: { params: { id: string; itemId: string } },
) {
  const { id: shareId, itemId } = params;

  const share = await prisma.share.findUnique({ where: { id: shareId } });

  if (!share || share.revoked || new Date() > share.expiresAt) {
    return NextResponse.json({ error: "Share not found or expired" }, { status: 404 });
  }

  const itemIds = JSON.parse(share.itemIds) as string[];
  if (!itemIds.includes(itemId)) {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }

  try {
    const item = await prisma.vaultItem.findUnique({ where: { id: itemId } });

    if (!item || item.type !== "document") {
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
