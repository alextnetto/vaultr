"use client";

import { useState, useEffect, useCallback } from "react";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Shield, Lock, Clock, Download, AlertTriangle, Eye,
  FileText, CheckCircle, XCircle, Loader2,
} from "lucide-react";

type ShareField = { type: string; label: string; value: string };
type ShareFile = { id: string; filename: string; mimetype: string };

export default function ViewShare() {
  const params = useParams();
  const id = params.id as string;

  const [state, setState] = useState<"loading" | "password" | "viewing" | "expired" | "error">("loading");
  const [fields, setFields] = useState<ShareField[]>([]);
  const [files, setFiles] = useState<ShareFile[]>([]);
  const [expiresAt, setExpiresAt] = useState(0);
  const [viewCount, setViewCount] = useState(0);
  const [password, setPassword] = useState("");
  const [passwordError, setPasswordError] = useState("");
  const [countdown, setCountdown] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const fetchShare = useCallback(async (pwd?: string) => {
    const key = typeof window !== "undefined" ? window.location.hash.slice(1) : "";
    if (!key) {
      setErrorMsg("No decryption key found in URL");
      setState("error");
      return;
    }

    try {
      const res = await fetch(`/api/shares/${id}`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ key, password: pwd }),
      });

      const data = await res.json();

      if (res.status === 410) {
        setState("expired");
        return;
      }

      if (res.status === 401 && data.requiresPassword) {
        setExpiresAt(data.expiresAt);
        setState("password");
        return;
      }

      if (res.status === 403) {
        setPasswordError("Incorrect password");
        return;
      }

      if (!res.ok) {
        setErrorMsg(data.error || "Failed to load share");
        setState("error");
        return;
      }

      setFields(data.fields);
      setFiles(data.files || []);
      setExpiresAt(data.expiresAt);
      setViewCount(data.viewCount);
      setState("viewing");
    } catch {
      setErrorMsg("Network error");
      setState("error");
    }
  }, [id]);

  useEffect(() => {
    fetchShare();
  }, [fetchShare]);

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const now = Math.floor(Date.now() / 1000);
      const diff = expiresAt - now;
      if (diff <= 0) {
        setCountdown("Expired");
        setState("expired");
        return;
      }
      const days = Math.floor(diff / 86400);
      const hours = Math.floor((diff % 86400) / 3600);
      const mins = Math.floor((diff % 3600) / 60);
      const secs = diff % 60;
      if (days > 0) setCountdown(`${days}d ${hours}h ${mins}m`);
      else if (hours > 0) setCountdown(`${hours}h ${mins}m ${secs}s`);
      else setCountdown(`${mins}m ${secs}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const handlePasswordSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError("");
    fetchShare(password);
  };

  if (state === "loading") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="text-center space-y-4 animate-fade-in">
          <Loader2 className="h-12 w-12 animate-spin mx-auto text-muted-foreground" />
          <p className="text-muted-foreground">Decrypting shared data...</p>
        </div>
      </main>
    );
  }

  if (state === "expired") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/30">
              <XCircle className="h-8 w-8 text-red-600 dark:text-red-400" />
            </div>
            <CardTitle>Link Expired</CardTitle>
            <CardDescription>This shared data is no longer available. The data has been permanently deleted.</CardDescription>
          </CardHeader>
          <CardContent className="text-center">
            <a href="/">
              <Button variant="outline">Create a New Share</Button>
            </a>
          </CardContent>
        </Card>
      </main>
    );
  }

  if (state === "error") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-amber-100 dark:bg-amber-900/30">
              <AlertTriangle className="h-8 w-8 text-amber-600 dark:text-amber-400" />
            </div>
            <CardTitle>Something Went Wrong</CardTitle>
            <CardDescription>{errorMsg}</CardDescription>
          </CardHeader>
        </Card>
      </main>
    );
  }

  if (state === "password") {
    return (
      <main className="min-h-screen flex items-center justify-center p-4">
        <div className="absolute top-4 right-4"><ThemeToggle /></div>
        <Card className="w-full max-w-md animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-blue-100 dark:bg-blue-900/30">
              <Lock className="h-8 w-8 text-blue-600 dark:text-blue-400" />
            </div>
            <CardTitle>Password Required</CardTitle>
            <CardDescription>This shared data is password protected.</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handlePasswordSubmit} className="space-y-4">
              <Input
                type="password"
                placeholder="Enter password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoFocus
              />
              {passwordError && (
                <p className="text-sm text-destructive">{passwordError}</p>
              )}
              <Button type="submit" className="w-full gap-2">
                <Lock className="h-4 w-4" /> Unlock
              </Button>
            </form>
            {countdown && (
              <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground mt-4">
                <Clock className="h-4 w-4" />
                <span>Expires in {countdown}</span>
              </div>
            )}
          </CardContent>
        </Card>
      </main>
    );
  }

  // Viewing state
  return (
    <main className="min-h-screen py-8 px-4 md:py-16">
      <div className="absolute top-4 right-4"><ThemeToggle /></div>
      <div className="mx-auto max-w-2xl space-y-6 animate-fade-in">
        {/* Header */}
        <div className="text-center space-y-3">
          <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-primary text-primary-foreground">
            <Shield className="h-7 w-7" />
          </div>
          <h1 className="text-3xl font-bold tracking-tight">Shared Data</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-4 w-4" />
              Expires in {countdown}
            </span>
            <span className="flex items-center gap-1">
              <Eye className="h-4 w-4" />
              {viewCount} view{viewCount !== 1 ? "s" : ""}
            </span>
          </div>
        </div>

        {/* Security banner */}
        <div className="rounded-lg bg-green-50 dark:bg-green-950/30 border border-green-200 dark:border-green-800 p-3 text-sm text-green-800 dark:text-green-200 flex items-center gap-2">
          <CheckCircle className="h-4 w-4 shrink-0" />
          <span>This data was encrypted end-to-end. Decryption happened in your browser.</span>
        </div>

        {/* Fields */}
        {fields.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <FileText className="h-5 w-5" /> Information
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="divide-y">
                {fields.map((field, i) => (
                  <div key={i} className="py-3 first:pt-0 last:pb-0 animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                    <p className="text-sm text-muted-foreground mb-1">{field.label}</p>
                    <p className="text-base font-medium">{field.value}</p>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Files */}
        {files.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg flex items-center gap-2">
                <Download className="h-5 w-5" /> Attached Files
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {files.map((file) => (
                <a
                  key={file.id}
                  href={`/api/files/${file.id}`}
                  download={file.filename}
                  className="flex items-center gap-3 p-3 rounded-lg border hover:bg-accent transition-colors"
                >
                  <FileText className="h-5 w-5 text-muted-foreground shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium truncate">{file.filename}</p>
                    <p className="text-xs text-muted-foreground">{file.mimetype}</p>
                  </div>
                  <Download className="h-4 w-4 text-muted-foreground" />
                </a>
              ))}
            </CardContent>
          </Card>
        )}

        {/* Expiry warning */}
        <div className="rounded-lg bg-amber-50 dark:bg-amber-950/30 border border-amber-200 dark:border-amber-800 p-3 text-sm text-amber-800 dark:text-amber-200 flex items-center gap-2">
          <AlertTriangle className="h-4 w-4 shrink-0" />
          <span>This data will be permanently deleted when the link expires. Save what you need now.</span>
        </div>

        <footer className="text-center text-xs text-muted-foreground pb-8">
          <a href="/" className="underline hover:text-foreground transition-colors">Powered by Vaultr</a>
          {" · "}
          <a href="https://github.com/alextnetto/vaultr" className="underline hover:text-foreground transition-colors">Source</a>
        </footer>
      </div>
    </main>
  );
}
