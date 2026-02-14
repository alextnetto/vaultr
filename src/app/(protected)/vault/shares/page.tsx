"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, ArrowLeft, Eye, Trash2, ExternalLink,
  Clock, XCircle, CheckCircle2, Share2
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";

type Share = {
  id: string;
  fieldIds: string;
  expiresAt: string;
  viewCount: number;
  revoked: boolean;
  createdAt: string;
  password: string | null;
};

export default function SharesPage() {
  const { status } = useSession();
  const router = useRouter();
  const [shares, setShares] = useState<Share[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/shares").then(r => r.json()).then(data => {
        setShares(data);
        setLoading(false);
      });
    }
  }, [status]);

  const revokeShare = async (id: string) => {
    await fetch(`/api/shares/${id}`, { method: "DELETE" });
    setShares(shares.map(s => s.id === id ? { ...s, revoked: true } : s));
  };

  const getStatus = (share: Share) => {
    if (share.revoked) return "revoked";
    if (new Date(share.expiresAt) < new Date()) return "expired";
    return "active";
  };

  const getTimeLeft = (expiresAt: string) => {
    const diff = new Date(expiresAt).getTime() - Date.now();
    if (diff <= 0) return "Expired";
    const hours = Math.floor(diff / 3600000);
    const days = Math.floor(hours / 24);
    if (days > 0) return `${days}d ${hours % 24}h left`;
    const mins = Math.floor((diff % 3600000) / 60000);
    return `${hours}h ${mins}m left`;
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
          <Shield className="h-6 w-6" />
          <span>Loading shares...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-4xl">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Vaultr</span>
          </div>
          <ThemeToggle />
        </div>
      </header>

      <main className="container px-4 mx-auto max-w-4xl py-8 space-y-6">
        <div className="flex items-center gap-4">
          <Link href="/vault">
            <Button variant="ghost" size="icon">
              <ArrowLeft className="h-4 w-4" />
            </Button>
          </Link>
          <div className="flex-1">
            <h1 className="text-3xl font-bold">Active Shares</h1>
            <p className="text-muted-foreground mt-1">Manage your shared links</p>
          </div>
          <Link href="/vault/share">
            <Button className="gap-2">
              <Share2 className="h-4 w-4" />
              New Share
            </Button>
          </Link>
        </div>

        {shares.length === 0 ? (
          <Card>
            <CardContent className="py-12 text-center">
              <Share2 className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No shares yet</p>
              <Link href="/vault/share">
                <Button className="mt-4">Create Your First Share</Button>
              </Link>
            </CardContent>
          </Card>
        ) : (
          <div className="space-y-3">
            {shares.map((share, i) => {
              const status = getStatus(share);
              const fieldCount = JSON.parse(share.fieldIds).length;

              return (
                <Card
                  key={share.id}
                  className={`animate-slide-up transition-all ${status !== "active" ? "opacity-60" : ""}`}
                  style={{ animationDelay: `${i * 60}ms` }}
                >
                  <CardContent className="py-4">
                    <div className="flex items-center justify-between gap-4">
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          {status === "active" && (
                            <Badge variant="success" className="gap-1">
                              <CheckCircle2 className="h-3 w-3" />
                              Active
                            </Badge>
                          )}
                          {status === "expired" && (
                            <Badge variant="secondary" className="gap-1">
                              <Clock className="h-3 w-3" />
                              Expired
                            </Badge>
                          )}
                          {status === "revoked" && (
                            <Badge variant="destructive" className="gap-1">
                              <XCircle className="h-3 w-3" />
                              Revoked
                            </Badge>
                          )}
                          {share.password && (
                            <Badge variant="outline" className="gap-1 text-xs">
                              🔒 Password
                            </Badge>
                          )}
                        </div>
                        <p className="text-sm text-muted-foreground">
                          {fieldCount} field{fieldCount !== 1 ? "s" : ""} · {getTimeLeft(share.expiresAt)} ·{" "}
                          <span className="inline-flex items-center gap-1">
                            <Eye className="h-3 w-3" /> {share.viewCount} view{share.viewCount !== 1 ? "s" : ""}
                          </span>
                        </p>
                        <p className="text-xs text-muted-foreground mt-1 font-mono truncate">
                          /s/{share.id}
                        </p>
                      </div>
                      <div className="flex items-center gap-1">
                        {status === "active" && (
                          <>
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => {
                                navigator.clipboard.writeText(`${window.location.origin}/s/${share.id}`);
                              }}
                            >
                              <ExternalLink className="h-3.5 w-3.5" />
                            </Button>
                            <Button
                              size="sm"
                              variant="ghost"
                              className="text-destructive hover:text-destructive"
                              onClick={() => revokeShare(share.id)}
                            >
                              <Trash2 className="h-3.5 w-3.5" />
                            </Button>
                          </>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}
      </main>
    </div>
  );
}
