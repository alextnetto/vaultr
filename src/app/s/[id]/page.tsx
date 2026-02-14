"use client";

import { useState, useEffect } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import {
  Shield, Lock, Clock, AlertTriangle,
  User, FileText, Phone, CreditCard, Eye
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";

type SharedField = {
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

export default function ViewSharePage() {
  const { id } = useParams();
  const [fields, setFields] = useState<SharedField[]>([]);
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
      const url = pwd ? `/api/shares/${id}?password=${encodeURIComponent(pwd)}` : `/api/shares/${id}`;
      const res = await fetch(url);
      const data = await res.json();

      if (data.expired) {
        setExpired(true);
        setError(data.error);
      } else if (data.passwordRequired) {
        setPasswordRequired(true);
        if (data.error) setError(data.error);
        if (data.expiresAt) setExpiresAt(data.expiresAt);
      } else if (data.fields) {
        setFields(data.fields);
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

  // Countdown timer
  useEffect(() => {
    if (!expiresAt) return;
    const update = () => {
      const diff = new Date(expiresAt).getTime() - Date.now();
      if (diff <= 0) {
        setTimeLeft("Expired");
        setExpired(true);
        return;
      }
      const d = Math.floor(diff / 86400000);
      const h = Math.floor((diff % 86400000) / 3600000);
      const m = Math.floor((diff % 3600000) / 60000);
      const s = Math.floor((diff % 60000) / 1000);
      if (d > 0) setTimeLeft(`${d}d ${h}h ${m}m`);
      else if (h > 0) setTimeLeft(`${h}h ${m}m ${s}s`);
      else setTimeLeft(`${m}m ${s}s`);
    };
    update();
    const interval = setInterval(update, 1000);
    return () => clearInterval(interval);
  }, [expiresAt]);

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

  // Group fields by category
  const categories = Array.from(new Set(fields.map(f => f.category)));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/30">
      <div className="container px-4 mx-auto max-w-2xl py-8 space-y-6">
        {/* Header */}
        <div className="text-center space-y-2 animate-fade-in">
          <div className="inline-flex items-center gap-2 rounded-full border bg-muted px-4 py-1.5 text-sm">
            <Shield className="h-3.5 w-3.5" />
            Shared via Vaultr
          </div>
          <h1 className="text-2xl font-bold">Shared Personal Data</h1>
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

        {/* Fields */}
        {categories.map((cat, i) => {
          const catFields = fields.filter(f => f.category === cat);
          const Icon = CATEGORY_ICONS[cat] || FileText;

          return (
            <Card key={cat} className="animate-slide-up" style={{ animationDelay: `${i * 100}ms` }}>
              <CardHeader className="pb-3">
                <CardTitle className="flex items-center gap-2 text-lg">
                  <Icon className="h-5 w-5 text-muted-foreground" />
                  {CATEGORY_LABELS[cat] || cat}
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {catFields.map((field, j) => (
                  <div key={field.id}>
                    {j > 0 && <Separator className="my-3" />}
                    <div className="py-1">
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{field.label}</p>
                      <p className="text-base font-medium mt-0.5">{field.value}</p>
                    </div>
                  </div>
                ))}
              </CardContent>
            </Card>
          );
        })}

        {/* Footer */}
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
