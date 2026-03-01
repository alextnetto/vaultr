function requireEnv(name: string): string {
  const value = process.env[name];
  if (!value) {
    throw new Error(`Missing required environment variable: ${name}`);
  }
  return value;
}

export function getEncryptionKey(): string {
  return requireEnv("ENCRYPTION_KEY");
}

export function getNextAuthSecret(): string {
  return requireEnv("NEXTAUTH_SECRET");
}
