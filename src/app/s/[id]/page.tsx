"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Shield, Lock, Clock, AlertTriangle, Copy, Check, Eye, Download, FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type SharedItem = {
  id: string;
  label: string;
  value: string;
  type: string;
};

function CopyButton({ value }: { value: string }) {
  const [copied, setCopied] = useState(false);

  const copy = () => {
    navigator.clipboard.writeText(value);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <Button variant="ghost" size="sm" onClick={copy} className="shrink-0">
      {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
    </Button>
  );
}

function DocumentValue({ value, itemId }: { value: string; itemId: string }) {
  let fileName = value;
  let fileSize = "";
  try {
    const meta = JSON.parse(value);
    fileName = meta.fileName;
    const size = meta.fileSize;
    fileSize = size < 1024 ? `${size}B` : size < 1048576 ? `${(size / 1024).toFixed(1)}KB` : `${(size / 1048576).toFixed(1)}MB`;
  } catch {
    // value is just a string
  }
  return (
    <div className="flex items-center gap-2 mt-0.5">
      <FileText className="h-4 w-4 text-muted-foreground shrink-0" />
      <span className="text-sm font-medium truncate">{fileName}</span>
      {fileSize && <span className="text-xs text-muted-foreground">({fileSize})</span>}
      <a href={`/api/vault/${itemId}/file`} download>
        <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs">
          <Download className="h-3.5 w-3.5" />
          Download
        </Button>
      </a>
    </div>
  );
}

function formatCountdown(expiresAt: string): string {
  const diff = new Date(expiresAt).getTime() - Date.now();
  if (diff <= 0) return "Expired";
  const d = Math.floor(diff / 86400000);
  const h = Math.floor((diff % 86400000) / 3600000);
  const m = Math.floor((diff % 3600000) / 60000);
  const s = Math.floor((diff % 60000) / 1000);
  if (d > 0) return `${d}d ${h}h ${m}m`;
  if (h > 0) return `${h}h ${m}m ${s}s`;
  return `${m}m ${s}s`;
}

export default function ViewSharePage() {
  const { id } = useParams();
  const [items, setItems] = useState<SharedItem[]>([]);
  const [expiresAt, setExpiresAt] = useState("");
  const [error, setError] = useState("");
  const [expired, setExpired] = useState(false);
  const [passwordRequired, setPasswordRequired] = useState(false);
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(true);
  const [timeLeft, setTimeLeft] = useState("");

  const fetchShare = async (pwd?: string) => {
    setLoading(true);
    setError("");
    try {
      const url = pwd
        ? `/api/shares/${id}?password=${encodeURIComponent(pwd)}`
        : `/api/shares/${id}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.expired) {
        setExpired(true);
        setError(data.error);
      } else if (data.passwordRequired) {
        setPasswordRequired(true);
        if (data.error) setError(data.error);
        if (data.expiresAt) setExpiresAt(data.expiresAt);
      } else if (data.items) {
        setItems(data.items);
        setExpiresAt(data.expiresAt);
        setPasswordRequired(false);
      } else if (data.error) {
        setError(data.error);
      }
    } catch {
      setError("Failed to load share");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchShare();
  }, [id]); // eslint-disable-line

  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const remaining = formatCountdown(expiresAt);
      setTimeLeft(remaining);
      if (remaining === "Expired") setExpired(true);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

  const downloadAll = () => {
    const textItems = items.filter((item) => item.type !== "document");
    const content = textItems
      .map((item) => `${item.label}: ${item.value}`)
      .join("\n");
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "vaultr-share.txt";
    a.click();
    URL.revokeObjectURL(url);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-b from-background to-muted/30">
        <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
          <Shield className="h-6 w-6" />
          <span>Loading shared data...</span>
        </div>
      </div>
    );
  }

  if (expired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-muted/30">
        <Card className="max-w-md w-full text-center animate-fade-in">
          <CardContent className="py-12">
            <AlertTriangle className="h-16 w-16 mx-auto text-muted-foreground mb-4" />
            <h2 className="text-2xl font-bold mb-2">Share Expired</h2>
            <p className="text-muted-foreground mb-6">
              This shared data is no longer available. The link has expired or been revoked.
            </p>
            <Link href="/">
              <Button className="gap-2">
                <Shield className="h-4 w-4" />
                Create Your Own Vault
              </Button>
            </Link>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (passwordRequired) {
    return (
      <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-background to-muted/30">
        <Card className="max-w-md w-full animate-fade-in">
          <CardHeader className="text-center">
            <div className="mx-auto p-3 rounded-full bg-primary/10 w-fit mb-2">
              <Lock className="h-8 w-8 text-primary" />
            </div>
            <CardTitle>Password Protected</CardTitle>
            <CardDescription>This share requires a password to view</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {error && (
              <div className="p-3 rounded-md bg-destructive/10 text-destructive text-sm text-center">
                {error}
              </div>
            )}
            <form
              onSubmit={(e) => {
                e.preventDefault();
                fetchShare(password);
              }}
            >
              <div className="space-y-4">
                <Input
                  type="password"
                  placeholder="Enter password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  autoFocus
                />
                <Button type="submit" className="w-full gap-2">
                  <Eye className="h-4 w-4" />
                  View Data
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4 mx-auto max-w-2xl py-8 space-y-6">
        <div className="text-center space-y-2 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
            <Shield className="h-3.5 w-3.5" />
            Shared via Vaultr
          </div>
          <h1 className="text-2xl font-bold">Shared Data</h1>
          <div className="flex items-center justify-center gap-4 text-sm text-muted-foreground">
            <span className="flex items-center gap-1">
              <Clock className="h-3.5 w-3.5" />
              {timeLeft}
            </span>
            <span className="flex items-center gap-1">
              <Lock className="h-3.5 w-3.5" />
              Encrypted
            </span>
          </div>
        </div>

        <Card className="animate-slide-up">
          <CardContent className="py-2">
            {items.map((item, i) => (
              <div key={item.id}>
                {i > 0 && <Separator />}
                <div className="flex items-center justify-between py-3 gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-xs text-muted-foreground uppercase tracking-wider">
                      {item.label}
                    </p>
                    {item.type === "document" ? (
                      <DocumentValue value={item.value} itemId={item.id} />
                    ) : (
                      <p className="text-sm font-medium mt-0.5 break-all">{item.value}</p>
                    )}
                  </div>
                  {item.type !== "document" && <CopyButton value={item.value} />}
                </div>
              </div>
            ))}
          </CardContent>
        </Card>

        <div className="flex justify-center">
          <Button variant="outline" className="gap-2" onClick={downloadAll}>
            <Download className="h-4 w-4" />
            Download All
          </Button>
        </div>

        <div className="text-center py-8 space-y-3 animate-fade-in">
          <Separator />
          <p className="text-sm text-muted-foreground pt-4">
            Shared securely via <span className="font-semibold">Vaultr</span>
          </p>
          <Link href="/">
            <Button variant="outline" size="sm" className="gap-2">
              <Shield className="h-3.5 w-3.5" />
              Create Your Own Vault
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
