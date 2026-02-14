"use client";

import Link from "next/link";
import { Shield, Lock, Share2, Clock, ArrowRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { ThemeToggle } from "@/components/theme-toggle";

export default function HomePage() {
  return (
    <div className="min-h-screen flex flex-col">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-6xl">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Vaultr</span>
          </div>
          <div className="flex items-center gap-2">
            <ThemeToggle />
            <Link href="/login">
              <Button variant="ghost">Sign In</Button>
            </Link>
            <Link href="/register">
              <Button>Get Started</Button>
            </Link>
          </div>
        </div>
      </header>

      {/* Hero */}
      <main className="flex-1">
        <section className="container px-4 mx-auto max-w-6xl py-24 md:py-32 space-y-8">
          <div className="flex flex-col items-center text-center space-y-4 animate-fade-in">
            <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
              <Lock className="h-3.5 w-3.5" />
              <span>End-to-end encrypted</span>
            </div>
            <h1 className="text-4xl md:text-6xl font-bold tracking-tight max-w-3xl">
              Your personal data.{" "}
              <span className="bg-gradient-to-r from-blue-600 to-cyan-500 bg-clip-text text-transparent">
                Stored once.
              </span>{" "}
              Shared selectively.
            </h1>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Stop filling out the same forms. Store your personal data in a secure vault and share exactly what you want, when you want, with expiring links.
            </p>
            <div className="flex gap-4 pt-4">
              <Link href="/register">
                <Button size="lg" className="gap-2">
                  Create Your Vault <ArrowRight className="h-4 w-4" />
                </Button>
              </Link>
              <Link href="/login">
                <Button size="lg" variant="outline">
                  Sign In
                </Button>
              </Link>
            </div>
          </div>
        </section>

        {/* Features */}
        <section className="container px-4 mx-auto max-w-6xl py-16 border-t">
          <div className="grid md:grid-cols-3 gap-8">
            {[
              {
                icon: Lock,
                title: "Encrypted Vault",
                description: "All your data is encrypted with AES-256-GCM. Only you can access it.",
              },
              {
                icon: Share2,
                title: "Selective Sharing",
                description: "Toggle exactly which fields to share. Full name but not your address? Easy.",
              },
              {
                icon: Clock,
                title: "Expiring Links",
                description: "Links expire automatically. Set 1 hour, 7 days, or custom. Revoke anytime.",
              },
            ].map((feature, i) => (
              <div
                key={i}
                className="flex flex-col items-center text-center space-y-3 p-6 rounded-lg border bg-card animate-slide-up"
                style={{ animationDelay: `${i * 100}ms` }}
              >
                <div className="p-3 rounded-full bg-primary/10">
                  <feature.icon className="h-6 w-6 text-primary" />
                </div>
                <h3 className="text-lg font-semibold">{feature.title}</h3>
                <p className="text-sm text-muted-foreground">{feature.description}</p>
              </div>
            ))}
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t py-8">
        <div className="container px-4 mx-auto max-w-6xl text-center text-sm text-muted-foreground">
          <p>© 2024 Vaultr. Your data, your rules.</p>
        </div>
      </footer>
    </div>
  );
}
