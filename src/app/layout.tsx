import type { Metadata } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { ThemeProvider } from "@/components/theme-provider";
import AuthProvider from "@/components/session-provider";
import { Toaster } from "sonner";

const inter = Inter({ subsets: ["latin"] });

export const metadata: Metadata = {
  title: {
    default: "Vaultr — Your Personal Data Vault",
    template: "%s | Vaultr",
  },
  description:
    "A free, encrypted personal data vault. Store links, numbers, documents as key-value pairs. Share via expiring links. AES-256-GCM encryption. No tracking.",
  keywords: [
    "personal data vault",
    "encrypted storage",
    "expiring links",
    "secure sharing",
    "key-value store",
  ],
  metadataBase: new URL(process.env.NEXTAUTH_URL || "https://vaultr.app"),
  openGraph: {
    title: "Vaultr — Your Personal Data Vault",
    description: "Store your data once. Share selectively with expiring links.",
    type: "website",
    siteName: "Vaultr",
  },
  robots: {
    index: true,
    follow: true,
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body className={inter.className}>
        <AuthProvider>
          <ThemeProvider defaultTheme="dark" storageKey="vaultr-theme">
            {children}
            <Toaster richColors position="bottom-right" />
          </ThemeProvider>
        </AuthProvider>
      </body>
    </html>
  );
}
