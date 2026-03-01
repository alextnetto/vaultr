import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth.service";

export async function POST(req: Request) {
  try {
    const { email, password } = await req.json();
    const result = await registerUser({ email, password });

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.user);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
