import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { authOptions } from "@/lib/auth";
import { createShare, listShares } from "@/lib/share.service";
import { createShareSchema } from "@/lib/validation";

export async function POST(req: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const body = await req.json();
    const parsed = createShareSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message || "Invalid input";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const share = await createShare({
      userId: session.user.id,
      itemIds: parsed.data.itemIds,
      expiresIn: parsed.data.expiresIn,
      password: parsed.data.password,
    });
    return NextResponse.json(share, { status: 201 });
  } catch (error) {
    const message = error instanceof Error ? error.message : "Something went wrong";
    return NextResponse.json({ error: message }, { status: 400 });
  }
}

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const shares = await listShares(session.user.id);
  return NextResponse.json(shares);
}
