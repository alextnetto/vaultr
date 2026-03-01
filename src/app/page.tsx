import Link from "next/link";
import { Shield, Lock, Share2, Clock, ArrowRight, FileText, Zap } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Vaultr — Store Your Data Once, Share Selectively",
  description:
    "A free, encrypted personal data vault. Store links, numbers, documents as key-value pairs. Share via expiring links. AES-256-GCM encryption. No tracking.",
  keywords: ["personal data vault", "encrypted storage", "expiring links", "secure sharing", "key-value store"],
  openGraph: {
    title: "Vaultr — Your Personal Data Vault",
    description: "Store your data once. Share selectively with expiring links.",
    type: "website",
  },
};

const FEATURES = [
  {
    icon: Lock,
    title: "Encrypted Vault",
    description: "AES-256-GCM encryption at rest. Your data is unreadable without your key.",
  },
  {
    icon: Share2,
    title: "Selective Sharing",
    description: "Pick exactly which items to share. Generate a unique link in seconds.",
  },
  {
    icon: Clock,
    title: "Expiring Links",
    description: "Links expire automatically. 1 hour, 7 days, or 30. Revoke anytime.",
  },
  {
    icon: FileText,
    title: "Any Data Type",
    description: "Text, URLs, numbers, or files. Store anything as a labeled key-value pair.",
  },
  {
    icon: Zap,
    title: "Zero Friction",
    description: "No categories, no folders. A flat list with search. Add an item in 2 clicks.",
  },
  {
    icon: Shield,
    title: "Free & Private",
    description: "No tracking, no ads. Your data stays yours. Free to use.",
  },
] as const;

const STEPS = [
  { step: "1", title: "Create your vault", description: "Sign up with email. Takes 10 seconds." },
  { step: "2", title: "Store your data", description: "Add any piece of info — bank details, passport number, API keys." },
  { step: "3", title: "Share with a link", description: "Pick items, set expiry, get a link. Recipients can copy or download." },
] as const;

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-14 sm:h-16 items-center justify-between px-4 mx-auto max-w-6xl">
          <div className="flex items-center gap-2">
            <Shield className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
            <span className="text-lg sm:text-xl font-bold">Vaultr</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost" size="sm">
                Sign In
              </Button>
            </Link>
            <Link href="/register">
              <Button size="sm">Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      <main className="flex-1">
        {/* Hero */}
        <section className="container px-4 mx-auto max-w-6xl py-16 sm:py-24 md:py-32 space-y-6 sm:space-y-8">
          <div className="flex flex-col items-center text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-3 py-1 sm:px-4 sm:py-1.5 text-xs sm:text-sm">
              <Lock className="h-3 w-3 sm:h-3.5 sm:w-3.5" />
              <span>AES-256 encrypted</span>
            </div>
            <h1 className="text-3xl sm:text-4xl md:text-6xl font-bold tracking-tight max-w-3xl leading-tight">
              Your personal data.{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Stored once.
              </span>{" "}
              Shared selectively.
            </h1>
            <p className="text-base sm:text-lg md:text-xl text-muted-foreground max-w-2xl">
              Stop filling out the same forms. Store your data in an encrypted
              vault and share exactly what you want with expiring links.
            </p>
            <div className="flex flex-col sm:flex-row gap-3 pt-4 w-full sm:w-auto">
              <Link href="/register" className="w-full sm:w-auto">
                <Button size="lg" className="gap-2 w-full sm:w-auto">
                  Create Your Vault <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login" className="w-full sm:w-auto">
                <Button size="lg" variant="outline" className="w-full sm:w-auto">
                  Sign In
                </Button>
              </Link>
            </div>
            <p className="text-xs text-muted-foreground pt-2">
              Free to use. No credit card required.
            </p>
          </div>
        </section>

        {/* How it works */}
        <section className="border-t bg-muted/30">
          <div className="container px-4 mx-auto max-w-6xl py-16 sm:py-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-12">
              How it works
            </h2>
            <div className="grid sm:grid-cols-3 gap-6 sm:gap-8">
              {STEPS.map((item) => (
                <div key={item.step} className="flex flex-col items-center text-center space-y-3">
                  <div className="flex items-center justify-center h-10 w-10 sm:h-12 sm:w-12 rounded-full bg-primary text-primary-foreground font-bold text-lg">
                    {item.step}
                  </div>
                  <h3 className="text-lg font-semibold">{item.title}</h3>
                  <p className="text-sm text-muted-foreground max-w-xs">
                    {item.description}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="border-t">
          <div className="container px-4 mx-auto max-w-6xl py-16 sm:py-20">
            <h2 className="text-2xl sm:text-3xl font-bold text-center mb-10 sm:mb-12">
              Built for simplicity and security
            </h2>
            <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {FEATURES.map((feature, i) => (
                <div
                  key={i}
                  className="flex flex-col items-center text-center space-y-3 p-6 rounded-lg border bg-card animate-slide-up"
                  style={{ animationDelay: `${i * 80}ms` }}
                >
                  <div className="p-3 rounded-full bg-primary/10">
                    <feature.icon className="h-5 w-5 sm:h-6 sm:w-6 text-primary" />
                  </div>
                  <h3 className="text-lg font-semibold">{feature.title}</h3>
                  <p className="text-sm text-muted-foreground">{feature.description}</p>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* CTA */}
        <section className="border-t bg-muted/30">
          <div className="container px-4 mx-auto max-w-6xl py-16 sm:py-20 text-center">
            <h2 className="text-2xl sm:text-3xl font-bold mb-4">
              Ready to take control of your data?
            </h2>
            <p className="text-muted-foreground mb-8 max-w-lg mx-auto">
              Create your encrypted vault in seconds. It&apos;s free.
            </p>
            <Link href="/register">
              <Button size="lg" className="gap-2">
                Get Started <ArrowRight className="h-4 w-4" />
              </Button>
            </Link>
          </div>
        </section>
      </main>

      <footer className="border-t py-6 sm:py-8">
        <div className="container px-4 mx-auto max-w-6xl text-center text-xs sm:text-sm text-muted-foreground">
          <p>&copy; {new Date().getFullYear()} Vaultr. Your data, your rules.</p>
        </div>
      </footer>
    </div>
  );
}
