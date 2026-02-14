"use client";

import { useState } from "react";
import {
  Shield,
  Lock,
  Plus,
  Trash2,
  Copy,
  Check,
  Clock,
  Eye,
  EyeOff,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  FileText,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";

interface Field {
  id: string;
  label: string;
  value: string;
  type: "text" | "date";
}

const TEMPLATES = [
  { label: "Full Name", icon: User, fields: [{ label: "Full Name", type: "text" as const }] },
  { label: "Email", icon: Mail, fields: [{ label: "Email Address", type: "text" as const }] },
  { label: "Phone", icon: Phone, fields: [{ label: "Phone Number", type: "text" as const }] },
  { label: "Address", icon: MapPin, fields: [
    { label: "Street Address", type: "text" as const },
    { label: "City", type: "text" as const },
    { label: "State / Province", type: "text" as const },
    { label: "Zip / Postal Code", type: "text" as const },
    { label: "Country", type: "text" as const },
  ]},
  { label: "ID Number", icon: CreditCard, fields: [
    { label: "ID Type", type: "text" as const },
    { label: "ID Number", type: "text" as const },
    { label: "Expiry Date", type: "date" as const },
  ]},
  { label: "Passport", icon: FileText, fields: [
    { label: "Full Name (as on passport)", type: "text" as const },
    { label: "Passport Number", type: "text" as const },
    { label: "Nationality", type: "text" as const },
    { label: "Date of Birth", type: "date" as const },
    { label: "Expiry Date", type: "date" as const },
  ]},
];

const EXPIRY_OPTIONS = [
  { label: "1 hour", value: "3600" },
  { label: "24 hours", value: "86400" },
  { label: "7 days", value: "604800" },
  { label: "30 days", value: "2592000" },
];

let fieldCounter = 0;
function newId() {
  return `field_${++fieldCounter}_${Date.now()}`;
}

export default function HomePage() {
  const [fields, setFields] = useState<Field[]>([
    { id: newId(), label: "", value: "", type: "text" },
  ]);
  const [expiresIn, setExpiresIn] = useState("3600");
  const [usePassword, setUsePassword] = useState(false);
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<{
    url: string;
    expiresAt: number;
  } | null>(null);
  const [copied, setCopied] = useState(false);
  const [error, setError] = useState("");

  function addField(label = "", type: "text" | "date" = "text") {
    setFields((prev) => [...prev, { id: newId(), label, value: "", type }]);
  }

  function removeField(id: string) {
    setFields((prev) => prev.filter((f) => f.id !== id));
  }

  function updateField(id: string, key: "label" | "value", val: string) {
    setFields((prev) =>
      prev.map((f) => (f.id === id ? { ...f, [key]: val } : f))
    );
  }

  function applyTemplate(templateIndex: number) {
    const template = TEMPLATES[templateIndex];
    const newFields = template.fields.map((f) => ({
      id: newId(),
      label: f.label,
      value: "",
      type: f.type,
    }));
    setFields((prev) => [...prev.filter((f) => f.label || f.value), ...newFields]);
  }

  async function handleSubmit() {
    const filledFields = fields.filter((f) => f.label && f.value);
    if (filledFields.length === 0) {
      setError("Please fill in at least one field with a label and value.");
      return;
    }

    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/shares", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: filledFields.map((f) => ({
            label: f.label,
            value: f.value,
            type: f.type,
          })),
          expiresIn: parseInt(expiresIn),
          password: usePassword ? password : undefined,
        }),
      });

      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error || "Failed to create share");
      }

      const data = await res.json();
      const url = `${window.location.origin}/s/${data.id}#${data.key}`;
      setResult({ url, expiresAt: data.expiresAt });
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  async function copyToClipboard() {
    if (!result) return;
    await navigator.clipboard.writeText(result.url);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function reset() {
    setFields([{ id: newId(), label: "", value: "", type: "text" }]);
    setExpiresIn("3600");
    setUsePassword(false);
    setPassword("");
    setResult(null);
    setError("");
  }

  const expiryLabel = EXPIRY_OPTIONS.find((o) => o.value === expiresIn)?.label || "";

  if (result) {
    return (
      <div className="min-h-screen flex flex-col">
        <Header />
        <main className="flex-1 flex items-center justify-center p-4">
          <Card className="w-full max-w-lg">
            <CardHeader className="text-center">
              <div className="mx-auto mb-4 flex h-16 w-16 items-center justify-center rounded-full bg-green-100 dark:bg-green-900/30">
                <Check className="h-8 w-8 text-green-600 dark:text-green-400" />
              </div>
              <CardTitle className="text-2xl">Share Created!</CardTitle>
              <CardDescription>
                Your secure link is ready. It will expire in {expiryLabel}.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Input
                  readOnly
                  value={result.url}
                  className="font-mono text-sm"
                />
                <Button
                  size="icon"
                  variant="outline"
                  onClick={copyToClipboard}
                >
                  {copied ? (
                    <Check className="h-4 w-4 text-green-500" />
                  ) : (
                    <Copy className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="rounded-lg border bg-muted/50 p-4 space-y-2 text-sm">
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Lock className="h-4 w-4" />
                  <span>End-to-end encrypted — the key is in the URL fragment</span>
                </div>
                <div className="flex items-center gap-2 text-muted-foreground">
                  <Clock className="h-4 w-4" />
                  <span>Expires: {new Date(result.expiresAt * 1000).toLocaleString()}</span>
                </div>
                {usePassword && (
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <Shield className="h-4 w-4" />
                    <span>Password protected</span>
                  </div>
                )}
              </div>

              <Button onClick={reset} className="w-full" variant="outline">
                Create Another Share
              </Button>
            </CardContent>
          </Card>
        </main>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex flex-col">
      <Header />
      <main className="flex-1 flex items-start justify-center p-4 pt-8">
        <div className="w-full max-w-2xl space-y-6">
          {/* Hero */}
          <div className="text-center space-y-2">
            <h1 className="text-3xl font-bold tracking-tight sm:text-4xl">
              Share personal data securely
            </h1>
            <p className="text-muted-foreground text-lg">
              Encrypted, expiring links. No accounts needed.
            </p>
          </div>

          {/* Template Shortcuts */}
          <div className="flex flex-wrap gap-2 justify-center">
            {TEMPLATES.map((t, i) => (
              <Button
                key={t.label}
                variant="outline"
                size="sm"
                className="gap-1.5"
                onClick={() => applyTemplate(i)}
              >
                <t.icon className="h-3.5 w-3.5" />
                {t.label}
              </Button>
            ))}
          </div>

          {/* Fields */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Shield className="h-5 w-5" />
                Your Data
              </CardTitle>
              <CardDescription>
                Add the information you want to share securely.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {fields.map((field, index) => (
                <div key={field.id} className="flex gap-2 items-start">
                  <div className="flex-1 space-y-1.5">
                    <Input
                      placeholder="Label (e.g. Email, Phone)"
                      value={field.label}
                      onChange={(e) =>
                        updateField(field.id, "label", e.target.value)
                      }
                      className="text-sm"
                    />
                  </div>
                  <div className="flex-[2] space-y-1.5">
                    <Input
                      type={field.type === "date" ? "date" : "text"}
                      placeholder="Value"
                      value={field.value}
                      onChange={(e) =>
                        updateField(field.id, "value", e.target.value)
                      }
                    />
                  </div>
                  {fields.length > 1 && (
                    <Button
                      variant="ghost"
                      size="icon"
                      onClick={() => removeField(field.id)}
                      className="shrink-0 text-muted-foreground hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              ))}

              <Button
                variant="outline"
                size="sm"
                onClick={() => addField()}
                className="gap-1.5"
              >
                <Plus className="h-4 w-4" />
                Add Field
              </Button>
            </CardContent>
          </Card>

          {/* Settings */}
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-lg">
                <Clock className="h-5 w-5" />
                Settings
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Expiry */}
              <div className="space-y-2">
                <Label>Link Expiry</Label>
                <Select value={expiresIn} onValueChange={setExpiresIn}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {EXPIRY_OPTIONS.map((opt) => (
                      <SelectItem key={opt.value} value={opt.value}>
                        {opt.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <Separator />

              {/* Password */}
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <div className="space-y-0.5">
                    <Label className="text-sm font-medium">
                      Password Protection
                    </Label>
                    <p className="text-xs text-muted-foreground">
                      Require a password to view this share
                    </p>
                  </div>
                  <Switch
                    checked={usePassword}
                    onCheckedChange={setUsePassword}
                  />
                </div>
                {usePassword && (
                  <div className="relative">
                    <Input
                      type={showPassword ? "text" : "password"}
                      placeholder="Enter a password"
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
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
                )}
              </div>
            </CardContent>
          </Card>

          {error && (
            <div className="rounded-lg border border-destructive/50 bg-destructive/10 p-3 text-sm text-destructive">
              {error}
            </div>
          )}

          <Button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full h-12 text-base gap-2"
            size="lg"
          >
            {loading ? (
              <>Creating secure link...</>
            ) : (
              <>
                <Lock className="h-5 w-5" />
                Create Secure Link
              </>
            )}
          </Button>

          {/* Trust Footer */}
          <div className="text-center pb-8 space-y-2">
            <div className="flex items-center justify-center gap-4 text-xs text-muted-foreground">
              <span className="flex items-center gap-1">
                <Lock className="h-3 w-3" />
                AES-256-GCM Encryption
              </span>
              <span className="flex items-center gap-1">
                <Clock className="h-3 w-3" />
                Auto-expiring
              </span>
              <span className="flex items-center gap-1">
                <Shield className="h-3 w-3" />
                Zero-knowledge
              </span>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function Header() {
  return (
    <header className="border-b">
      <div className="container mx-auto flex items-center justify-between h-14 px-4">
        <div className="flex items-center gap-2">
          <Shield className="h-6 w-6 text-primary" />
          <span className="font-bold text-lg">Vaultr</span>
          <Badge variant="secondary" className="text-xs">
            Beta
          </Badge>
        </div>
        <ThemeToggle />
      </div>
    </header>
  );
}
