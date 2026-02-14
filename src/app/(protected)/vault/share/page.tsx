"use client";

import { useState, useEffect } from "react";
import { useSession } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, Share2, Copy, Check, Lock, ArrowLeft,
  User, FileText, Phone, CreditCard, Link2, Clock
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

type VaultField = {
  id: string;
  category: string;
  label: string;
  value: string;
};

const CATEGORY_ICONS: Record<string, any> = {
  identity: User,
  documents: FileText,
  contact: Phone,
  financial: CreditCard,
};

const CATEGORY_LABELS: Record<string, string> = {
  identity: "Identity",
  documents: "Documents",
  contact: "Contact",
  financial: "Financial",
};

export default function CreateSharePage() {
  const { status } = useSession();
  const router = useRouter();
  const [fields, setFields] = useState<VaultField[]>([]);
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
      fetch("/api/vault").then(r => r.json()).then(data => {
        setFields(data);
        setLoading(false);
      });
    }
  }, [status]);

  const toggleField = (id: string) => {
    const next = new Set(selectedIds);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    setSelectedIds(next);
  };

  const toggleCategory = (category: string) => {
    const catFields = fields.filter(f => f.category === category);
    const allSelected = catFields.every(f => selectedIds.has(f.id));
    const next = new Set(selectedIds);
    catFields.forEach(f => {
      if (allSelected) next.delete(f.id);
      else next.add(f.id);
    });
    setSelectedIds(next);
  };

  const createShare = async () => {
    if (selectedIds.size === 0) return;
    setCreating(true);
    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fieldIds: Array.from(selectedIds),
          expiresIn: expiry,
          password: password || undefined,
        }),
      });
      const data = await res.json();
      const link = `${window.location.origin}/s/${data.id}`;
      setShareLink(link);
    } finally {
      setCreating(false);
    }
  };

  const copyLink = () => {
    navigator.clipboard.writeText(shareLink);
    setCopied(true);
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

  // Group fields
  const categories = Array.from(new Set(fields.map(f => f.category)));

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
            <p className="text-muted-foreground mt-1">Select which fields to include in your share link</p>
          </div>
        </div>

        {shareLink ? (
          <Card className="border-emerald-500/30 bg-emerald-500/5 animate-fade-in">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-emerald-600 dark:text-emerald-400">
                <Check className="h-5 w-5" />
                Share Link Created!
              </CardTitle>
              <CardDescription>Your share link is ready. Copy it and send it to anyone.</CardDescription>
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
                <Button onClick={() => { setShareLink(""); setSelectedIds(new Set()); }} variant="outline">
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
            {/* Field Selection */}
            {fields.length === 0 ? (
              <Card>
                <CardContent className="py-12 text-center">
                  <p className="text-muted-foreground">No fields in your vault yet.</p>
                  <Link href="/vault">
                    <Button className="mt-4">Add Fields First</Button>
                  </Link>
                </CardContent>
              </Card>
            ) : (
              <>
                {categories.map((cat, i) => {
                  const catFields = fields.filter(f => f.category === cat);
                  const allSelected = catFields.every(f => selectedIds.has(f.id));
                  const Icon = CATEGORY_ICONS[cat] || FileText;

                  return (
                    <Card key={cat} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
                      <CardHeader className="pb-3">
                        <div className="flex items-center justify-between">
                          <CardTitle className="flex items-center gap-2 text-lg">
                            <Icon className="h-5 w-5 text-muted-foreground" />
                            {CATEGORY_LABELS[cat] || cat}
                          </CardTitle>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-muted-foreground">Select all</span>
                            <Switch checked={allSelected} onCheckedChange={() => toggleCategory(cat)} />
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent className="space-y-1">
                        {catFields.map((field, j) => (
                          <div key={field.id}>
                            {j > 0 && <Separator className="my-2" />}
                            <label className="flex items-center justify-between py-2 cursor-pointer hover:bg-muted/50 rounded-md px-2 -mx-2 transition-colors">
                              <div>
                                <p className="text-xs text-muted-foreground uppercase tracking-wider">{field.label}</p>
                                <p className="text-sm font-medium">{field.value}</p>
                              </div>
                              <Switch
                                checked={selectedIds.has(field.id)}
                                onCheckedChange={() => toggleField(field.id)}
                              />
                            </label>
                          </div>
                        ))}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Options */}
                <Card className="animate-slide-up">
                  <CardHeader className="pb-3">
                    <CardTitle className="flex items-center gap-2 text-lg">
                      <Clock className="h-5 w-5 text-muted-foreground" />
                      Share Settings
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="space-y-2">
                      <label className="text-sm font-medium">Expiry</label>
                      <Select value={expiry} onValueChange={setExpiry}>
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="1h">1 hour</SelectItem>
                          <SelectItem value="24h">24 hours</SelectItem>
                          <SelectItem value="7d">7 days</SelectItem>
                          <SelectItem value="30d">30 days</SelectItem>
                        </SelectContent>
                      </Select>
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

                {/* Generate */}
                <div className="flex items-center justify-between p-4 rounded-lg border bg-card">
                  <div>
                    <p className="font-medium">{selectedIds.size} field{selectedIds.size !== 1 ? "s" : ""} selected</p>
                    <p className="text-sm text-muted-foreground">Expires in {expiry}</p>
                  </div>
                  <Button
                    onClick={createShare}
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
