import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { viewShare, revokeShare } from "@/lib/share.service";

export async function GET(req: Request, { params }: { params: { id: string } }) {
  const url = new URL(req.url);
  const password = url.searchParams.get("password") || undefined;

  const result = await viewShare(params.id, password);

  switch (result.status) {
    case "not_found":
      return NextResponse.json({ error: "Share not found" }, { status: 404 });
    case "expired":
      return NextResponse.json({ error: "This share has expired", expired: true }, { status: 410 });
    case "password_required":
      return NextResponse.json({ passwordRequired: true, expiresAt: result.expiresAt });
    case "invalid_password":
      return NextResponse.json({ error: "Invalid password", passwordRequired: true }, { status: 401 });
    case "ok":
      return NextResponse.json(result.data);
  }
}

export async function DELETE(_req: Request, { params }: { params: { id: string } }) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    await revokeShare(params.id, session.user.id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Not found" }, { status: 404 });
  }
}
