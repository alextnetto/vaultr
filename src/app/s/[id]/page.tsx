"use client";

import { useEffect, useState, useCallback } from "react";
import { useParams } from "next/navigation";
import {
  Shield,
  Lock,
  Clock,
  AlertTriangle,
  Eye,
  EyeOff,
  Copy,
  Check,
  XCircle,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

interface ShareField {
  label: string;
  value: string;
  type: string;
}

interface ShareData {
  fields: ShareField[];
  expiresAt: number;
  createdAt: number;
  viewCount: number;
}

function useCountdown(expiresAt: number) {
  const [now, setNow] = useState(Math.floor(Date.now() / 1000));

  useEffect(() => {
    const interval = setInterval(() => {
      setNow(Math.floor(Date.now() / 1000));
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const remaining = Math.max(0, expiresAt - now);
  const expired = remaining <= 0;

  const days = Math.floor(remaining / 86400);
  const hours = Math.floor((remaining % 86400) / 3600);
  const minutes = Math.floor((remaining % 3600) / 60);
  const seconds = remaining % 60;

  let label = "";
  if (days > 0) label = `${days}d ${hours}h ${minutes}m`;
  else if (hours > 0) label = `${hours}h ${minutes}m ${seconds}s`;
  else if (minutes > 0) label = `${minutes}m ${seconds}s`;
  else label = `${seconds}s`;

  return { remaining, expired, label };
}

export default function ViewSharePage() {
  const params = useParams();
  const id = params.id as string;

  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [requiresPassword, setRequiresPassword] = useState(false);
  const [expiresAt, setExpiresAt] = useState(0);
  const [data, setData] = useState<ShareData | null>(null);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [passwordError, setPasswordError] = useState("");
  const [copiedField, setCopiedField] = useState<string | null>(null);
  const [submittingPassword, setSubmittingPassword] = useState(false);

  const countdown = useCountdown(expiresAt);

  const fetchShare = useCallback(async (pw?: string) => {
    const key = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (!key) {
      setError("Invalid link — decryption key missing.");
      setLoading(false);
      return;
    }

    try {
      const res = await fetch(`/api/shares/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, password: pw }),
      });
      const json = await res.json();

      if (res.status === 410) {
        setExpired(true);
        setLoading(false);
        return;
      }

      if (res.status === 401 && json.requiresPassword) {
        setRequiresPassword(true);
        setExpiresAt(json.expiresAt);
        setLoading(false);
        return;
      }

      if (res.status === 403) {
        if (pw) {
          setPasswordError("Incorrect password");
          setSubmittingPassword(false);
          return;
        }
        setError(json.error || "Access denied");
        setLoading(false);
        return;
      }

      if (!res.ok) {
        setError(json.error || "Failed to load share");
        setLoading(false);
        return;
      }

      setData(json);
      setExpiresAt(json.expiresAt);
      setRequiresPassword(false);
    } catch {
      setError("Failed to load share");
    } finally {
      setLoading(false);
      setSubmittingPassword(false);
    }
  }, [id]);

  useEffect(() => {
    fetchShare();
  }, [fetchShare]);

  async function submitPassword() {
    setPasswordError("");
    setSubmittingPassword(true);
    await fetchShare(password);
  }

  async function copyValue(label: string, value: string) {
    await navigator.clipboard.writeText(value);
    setCopiedField(label);
    setTimeout(() => setCopiedField(null), 2000);
  }

  if (loading) {
    return (
      <div className="min-h-screen flex flex-col">
        <ViewHeader />
        <main className="flex-1 flex items-center justify-center">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 animate-spin rounded-full border-4 border-primary border-t-transparent" />
            <p className="text-muted-foreground">Decrypting...</p>
          </div>
        </main>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex flex-col">
        <ViewHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-orange-100 dark:bg-orange-900/30">
                <AlertTriangle className="h-8 w-8 text-orange-600 dark:text-orange-400" />
              </div>
              <CardTitle className="text-2xl">Link Expired</CardTitle>
              <CardDescription>
                This shared data has expired and been permanently deleted.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                className="w-full"
                variant="outline"
                onClick={() => (window.location.href = "/")}
              >
                Create New Share
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen flex flex-col">
        <ViewHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
                <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
              </div>
              <CardTitle className="text-2xl">Error</CardTitle>
              <CardDescription>{error}</CardDescription>
            </CardHeader>
          </Card>
        </main>
      </div>
    );
  }

  if (requiresPassword) {
    return (
      <div className="min-h-screen flex flex-col">
        <ViewHeader />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-md">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
                <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
              </div>
              <CardTitle className="text-2xl">Password Required</CardTitle>
              <CardDescription>
                This share is protected. Enter the password to view.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {expiresAt > 0 && !countdown.expired && (
                <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Expires in {countdown.label}</span>
                </div>
              )}
              <div className="relative">
                <Input
                  type={showPassword ? "text" : "password"}
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && submitPassword()}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="icon"
                  className="absolute right-1 top-1/2 -translate-y-1/2 h-7 w-7"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              <Button
                className="w-full"
                onClick={submitPassword}
                disabled={submittingPassword || !password}
              >
                {submittingPassword ? "Unlocking..." : "Unlock"}
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  if (!data) return null;

  return (
    <div className="min-h-screen flex flex-col">
      <ViewHeader />
      <main className="flex-1 flex items-start justify-center p-4 pt-8">
        <div className="w-full max-w-lg space-y-4">
          <Card>
            <CardHeader>
              <div className="flex items-center justify-between">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Shield className="h-5 w-5 text-green-600 dark:text-green-400" />
                  Shared Data
                </CardTitle>
                <Badge
                  variant={countdown.expired ? "destructive" : "secondary"}
                  className="gap-1"
                >
                  <Clock className="h-3 w-3" />
                  {countdown.expired ? "Expired" : countdown.label}
                </Badge>
              </div>
              <CardDescription>
                Viewed {data.viewCount} time{data.viewCount !== 1 ? "s" : ""}
                {" · "}
                Created{" "}
                {new Date(data.createdAt * 1000).toLocaleDateString()}
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {data.fields.map((field, i) => (
                  <div key={i}>
                    {i > 0 && <Separator className="mb-3" />}
                    <div className="flex items-start justify-between gap-2">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">
                          {field.label}
                        </p>
                        <p className="mt-1 text-sm font-medium break-all">
                          {field.value}
                        </p>
                      </div>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="shrink-0 h-8 w-8"
                        onClick={() => copyValue(field.label, field.value)}
                      >
                        {copiedField === field.label ? (
                          <Check className="h-3.5 w-3.5 text-green-500" />
                        ) : (
                          <Copy className="h-3.5 w-3.5" />
                        )}
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          <div className="rounded-lg border bg-muted/50 p-3 space-y-1.5 text-xs text-muted-foreground">
            <div className="flex items-center gap-1.5">
              <Lock className="h-3 w-3" />
              Data was encrypted with AES-256-GCM and decrypted on the server
            </div>
            <div className="flex items-center gap-1.5">
              <Clock className="h-3 w-3" />
              This link will expire on{" "}
              {new Date(data.expiresAt * 1000).toLocaleString()}
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function ViewHeader() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <a href="/" className="flex items-center gap-2 hover:opacity-80 transition-opacity">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Vaultr</span>
        </a>
        <ThemeToggle />
      </div>
    </header>
  );
}
