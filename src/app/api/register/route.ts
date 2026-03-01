import { NextResponse } from "next/server";
import { registerUser } from "@/lib/auth.service";
import { registerSchema } from "@/lib/validation";

export async function POST(req: Request) {
  try {
    const body = await req.json();
    const parsed = registerSchema.safeParse(body);

    if (!parsed.success) {
      const message = parsed.error.errors[0]?.message || "Invalid input";
      return NextResponse.json({ error: message }, { status: 400 });
    }

    const result = await registerUser(parsed.data);

    if (!result.success) {
      return NextResponse.json({ error: result.error }, { status: result.status });
    }

    return NextResponse.json(result.user);
  } catch {
    return NextResponse.json({ error: "Something went wrong" }, { status: 500 });
  }
}
