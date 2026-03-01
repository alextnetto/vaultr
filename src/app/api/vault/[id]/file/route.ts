import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { decrypt } from "@/lib/crypto";
import { readFile, parseFileMetadata } from "@/lib/file.service";

export async function GET(_req: Request, { params }: { params: { id: string } }) {
  try {
    const item = await prisma.vaultItem.findUnique({ where: { id: params.id } });

    if (!item || item.type !== "document") {
      return NextResponse.json({ error: "File not found" }, { status: 404 });
    }

    const metadata = parseFileMetadata(decrypt(item.value));
    const fileBuffer = await readFile(item.id);

    return new NextResponse(fileBuffer, {
      headers: {
        "Content-Type": metadata.mimeType,
        "Content-Disposition": `attachment; filename="${metadata.fileName}"`,
        "Content-Length": String(fileBuffer.length),
      },
    });
  } catch {
    return NextResponse.json({ error: "File not found" }, { status: 404 });
  }
}
