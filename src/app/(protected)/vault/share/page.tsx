"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, Copy, Check, Lock, ArrowLeft, Link2, Clock,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { toast } from "sonner";

type VaultItem = {
  id: string;
  label: string;
  value: string;
  type: string;
};

const EXPIRY_OPTIONS = [
  { value: "1h", label: "1 hour" },
  { value: "24h", label: "24 hours" },
  { value: "7d", label: "7 days" },
  { value: "30d", label: "30 days" },
] as const;

export default function CreateSharePage() {
  const { status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [expiry, setExpiry] = useState("24h");
  const [password, setPassword] = useState("");
  const [creating, setCreating] = useState(false);
  const [shareLink, setShareLink] = useState("");
  const [copied, setCopied] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  useEffect(() => {
    if (status === "authenticated") {
      fetch("/api/vault")
        .then((r) => r.json())
        .then((data) => {
          setItems(data);
          setLoading(false);
        });
    }
  }, [status]);

  const toggleItem = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleAll = () => {
    if (selectedIds.size === items.length) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(items.map((i) => i.id)));
    }
  };

  const createShareHandler = async () => {
    if (selectedIds.size === 0) return;
    setCreating(true);
    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          itemIds: Array.from(selectedIds),
          expiresIn: expiry,
          password: password || undefined,
        }),
      });
      if (res.ok) {
        const data = await res.json();
        const link = `${window.location.origin}/s/${data.id}`;
        setShareLink(link);
      }
    } catch {
      toast.error("Failed to create share");
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
    toast.success("Link copied to clipboard");
    setTimeout(() => setCopied(false), 2000);
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
          <Shield className="h-6 w-6" />
          <span>Loading...</span>
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
          <div>
            <h1 className="text-3xl font-bold">Create Share</h1>
            <p className="text-muted-foreground mt-1">
              Select items to include in your share link
            </p>
          </div>
        </div>

        {shareLink ? (
          <Card className="border-emerald-500/30 bg-emerald-500/5 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Check className="h-5 w-5" />
                Share Link Created!
              </CardTitle>
              <CardDescription>
                Your share link is ready. Copy it and send it to anyone.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input value={shareLink} readOnly className="font-mono text-sm" />
                <Button onClick={copyLink} variant="outline" className="gap-2 shrink-0">
                  {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              <div className="flex gap-4">
                <Button
                  onClick={() => {
                    setShareLink("");
                    setSelectedIds(new Set());
                  }}
                  variant="outline"
                >
                  Create Another
                </Button>
                <Link href="/vault/shares">
                  <Button variant="ghost">View All Shares</Button>
                </Link>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            {items.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No items in your vault yet.</p>
                  <Link href="/vault">
                    <Button className="mt-4">Add Items First</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                <Card className="animate-slide-up">
                  <CardHeader className="pb-3">
                    <div className="flex items-center justify-between">
                      <CardTitle className="text-lg">Select Items</CardTitle>
                      <div className="flex items-center gap-2">
                        <span className="text-xs text-muted-foreground">Select all</span>
                        <Switch
                          checked={selectedIds.size === items.length}
                          onCheckedChange={toggleAll}
                        />
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="py-0 pb-2">
                    {items.map((item, i) => (
                      <div key={item.id}>
                        {i > 0 && <Separator />}
                        <label className="flex items-center justify-between py-3 cursor-pointer hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors">
                          <div className="min-w-0 flex-1">
                            <p className="text-xs text-muted-foreground uppercase tracking-wider">
                              {item.label}
                            </p>
                            <p className="text-sm font-medium truncate">{item.value}</p>
                          </div>
                          <Switch
                            checked={selectedIds.has(item.id)}
                            onCheckedChange={() => toggleItem(item.id)}
                          />
                        </label>
                      </div>
                    ))}
                  </CardContent>
                </Card>

                <Card className="animate-slide-up" style={{ animationDelay: "80ms" }}>
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      Share Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Expiry</label>
                      <div className="flex gap-1">
                        {EXPIRY_OPTIONS.map((opt) => (
                          <Button
                            key={opt.value}
                            variant={expiry === opt.value ? "default" : "outline"}
                            size="sm"
                            className="flex-1"
                            onClick={() => setExpiry(opt.value)}
                          >
                            {opt.label}
                          </Button>
                        ))}
                      </div>
                    </div>
                    <div className="space-y-2">
                      <label className="text-sm font-medium flex items-center gap-1.5">
                        <Lock className="h-3.5 w-3.5" />
                        Password Protection (optional)
                      </label>
                      <Input
                        type="password"
                        placeholder="Leave empty for no password"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                      />
                    </div>
                  </CardContent>
                </Card>

                <div className="flex items-center justify-between p-4 rounded-lg border bg-card sticky bottom-4">
                  <div>
                    <p className="font-medium">
                      {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
                    </p>
                    <p className="text-sm text-muted-foreground">
                      Expires in{" "}
                      {EXPIRY_OPTIONS.find((o) => o.value === expiry)?.label}
                    </p>
                  </div>
                  <Button
                    onClick={createShareHandler}
                    disabled={selectedIds.size === 0 || creating}
                    className="gap-2"
                    size="lg"
                  >
                    <Link2 className="h-4 w-4" />
                    {creating ? "Generating..." : "Generate Link"}
                  </Button>
                </div>
              </>
            )}
          </>
        )}
      </main>
    </div>
  );
}
