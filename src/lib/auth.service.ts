import bcrypt from "bcryptjs";
import { prisma } from "./db";

export type RegisterInput = {
  email: string;
  password: string;
};

export type RegisterResult =
  | { success: true; user: { id: string; email: string } }
  | { success: false; error: string; status: number };

export async function registerUser(input: RegisterInput): Promise<RegisterResult> {
  const { email, password } = input;

  if (!email || !password) {
    return { success: false, error: "Email and password required", status: 400 };
  }

  if (password.length < 6) {
    return { success: false, error: "Password must be at least 6 characters", status: 400 };
  }

  const existing = await prisma.user.findUnique({ where: { email } });
  if (existing) {
    return { success: false, error: "Email already registered", status: 400 };
  }

  const hashedPassword = await bcrypt.hash(password, 12);
  const user = await prisma.user.create({
    data: { email, password: hashedPassword },
  });

  return { success: true, user: { id: user.id, email: user.email } };
}

export async function verifyCredentials(
  email: string,
  password: string,
): Promise<{ id: string; email: string } | null> {
  const user = await prisma.user.findUnique({ where: { email } });
  if (!user) return null;

  const isValid = await bcrypt.compare(password, user.password);
  if (!isValid) return null;

  return { id: user.id, email: user.email };
}
