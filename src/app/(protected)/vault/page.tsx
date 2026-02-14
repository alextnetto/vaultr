"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, Plus, Pencil, Trash2, Save, X, Share2,
  User, FileText, Phone, CreditCard, Lock, LogOut, ListChecks
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription
} from "@/components/ui/dialog";
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue
} from "@/components/ui/select";

type VaultField = {
  id?: string;
  category: string;
  label: string;
  value: string;
  order: number;
  _delete?: boolean;
};

const CATEGORIES = [
  { key: "identity", label: "Identity", icon: User, defaultFields: ["Full Name", "Date of Birth", "Nationality"] },
  { key: "documents", label: "Documents", icon: FileText, defaultFields: ["ID Number", "Passport Number", "Driver's License"] },
  { key: "contact", label: "Contact", icon: Phone, defaultFields: ["Email", "Phone", "Address"] },
  { key: "financial", label: "Financial", icon: CreditCard, defaultFields: ["Bank Account", "Tax ID"] },
];

export default function VaultPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [fields, setFields] = useState<VaultField[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newField, setNewField] = useState({ category: "identity", label: "", value: "" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchFields = useCallback(async () => {
    try {
      const res = await fetch("/api/vault");
      if (res.ok) {
        const data = await res.json();
        setFields(data);
      }
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchFields();
  }, [status, fetchFields]);

  const saveField = async (field: VaultField) => {
    setSaving(true);
    try {
      const res = await fetch("/api/vault", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: [field] }),
      });
      if (res.ok) {
        await fetchFields();
        setEditing(null);
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteField = async (field: VaultField) => {
    if (!field.id) return;
    setSaving(true);
    try {
      await fetch("/api/vault", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ fields: [{ ...field, _delete: true }] }),
      });
      await fetchFields();
    } finally {
      setSaving(false);
    }
  };

  const addField = async () => {
    if (!newField.label || !newField.value) return;
    setSaving(true);
    try {
      await fetch("/api/vault", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fields: [{ ...newField, order: fields.length }],
        }),
      });
      await fetchFields();
      setAddDialogOpen(false);
      setNewField({ category: "identity", label: "", value: "" });
    } finally {
      setSaving(false);
    }
  };

  if (status === "loading" || loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse flex items-center gap-2 text-muted-foreground">
          <Shield className="h-6 w-6" />
          <span>Loading your vault...</span>
        </div>
      </div>
    );
  }

  const groupedFields = CATEGORIES.map((cat) => ({
    ...cat,
    fields: fields.filter((f) => f.category === cat.key),
  }));

  // Also include custom categories
  const knownCategories = CATEGORIES.map((c) => c.key);
  const customFields = fields.filter((f) => !knownCategories.includes(f.category));

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
      {/* Header */}
      <header className="border-b bg-background/95 backdrop-blur sticky top-0 z-50">
        <div className="container flex h-16 items-center justify-between px-4 mx-auto max-w-4xl">
          <div className="flex items-center gap-2">
            <Shield className="h-6 w-6 text-primary" />
            <span className="text-xl font-bold">Vaultr</span>
          </div>
          <div className="flex items-center gap-1">
            <Link href="/vault/share">
              <Button variant="outline" size="sm" className="gap-2">
                <Share2 className="h-4 w-4" />
                <span className="hidden sm:inline">Share</span>
              </Button>
            </Link>
            <Link href="/vault/shares">
              <Button variant="ghost" size="sm" className="gap-2">
                <ListChecks className="h-4 w-4" />
                <span className="hidden sm:inline">Shares</span>
              </Button>
            </Link>
            <ThemeToggle />
            <Button variant="ghost" size="icon" onClick={() => signOut({ callbackUrl: "/" })}>
              <LogOut className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </header>

      <main className="container px-4 mx-auto max-w-4xl py-8 space-y-6">
        {/* Title */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">Your Vault</h1>
            <p className="text-muted-foreground mt-1 flex items-center gap-1.5">
              <Lock className="h-3.5 w-3.5" />
              All data encrypted with AES-256-GCM
            </p>
          </div>
          <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
            <Plus className="h-4 w-4" />
            Add Field
          </Button>
        </div>

        {/* Fields by category */}
        {groupedFields.map((cat, i) => (
          <Card key={cat.key} className="animate-slide-up" style={{ animationDelay: `${i * 80}ms` }}>
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                <cat.icon className="h-5 w-5 text-muted-foreground" />
                {cat.label}
                <Badge variant="secondary" className="ml-auto">{cat.fields.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {cat.fields.length === 0 ? (
                <p className="text-sm text-muted-foreground py-2">
                  No {cat.label.toLowerCase()} data yet.{" "}
                  <button
                    className="text-primary hover:underline"
                    onClick={() => {
                      setNewField({ category: cat.key, label: cat.defaultFields[0] || "", value: "" });
                      setAddDialogOpen(true);
                    }}
                  >
                    Add some
                  </button>
                </p>
              ) : (
                cat.fields.map((field, j) => (
                  <div key={field.id || j}>
                    {j > 0 && <Separator className="my-2" />}
                    <div className="flex items-center justify-between py-1">
                      <div className="flex-1 min-w-0">
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">{field.label}</p>
                        {editing === field.id ? (
                          <div className="flex items-center gap-2 mt-1">
                            <Input
                              value={editValue}
                              onChange={(e) => setEditValue(e.target.value)}
                              className="h-8 text-sm"
                              autoFocus
                            />
                            <Button
                              size="sm"
                              variant="ghost"
                              onClick={() => saveField({ ...field, value: editValue })}
                              disabled={saving}
                            >
                              <Save className="h-3.5 w-3.5" />
                            </Button>
                            <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                              <X className="h-3.5 w-3.5" />
                            </Button>
                          </div>
                        ) : (
                          <p className="text-sm font-medium truncate">{field.value}</p>
                        )}
                      </div>
                      {editing !== field.id && (
                        <div className="flex items-center gap-1 ml-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => { setEditing(field.id!); setEditValue(field.value); }}
                          >
                            <Pencil className="h-3.5 w-3.5" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:text-destructive"
                            onClick={() => deleteField(field)}
                          >
                            <Trash2 className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      )}
                    </div>
                  </div>
                ))
              )}
            </CardContent>
          </Card>
        ))}

        {customFields.length > 0 && (
          <Card className="animate-slide-up">
            <CardHeader className="pb-3">
              <CardTitle className="flex items-center gap-2 text-lg">
                Custom Fields
                <Badge variant="secondary" className="ml-auto">{customFields.length}</Badge>
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-2">
              {customFields.map((field, j) => (
                <div key={field.id || j}>
                  {j > 0 && <Separator className="my-2" />}
                  <div className="flex items-center justify-between py-1">
                    <div>
                      <p className="text-xs text-muted-foreground uppercase tracking-wider">{field.label}</p>
                      <p className="text-sm font-medium">{field.value}</p>
                    </div>
                    <div className="flex items-center gap-1">
                      <Button size="sm" variant="ghost" onClick={() => { setEditing(field.id!); setEditValue(field.value); }}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button size="sm" variant="ghost" className="text-destructive" onClick={() => deleteField(field)}>
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>

      {/* Add Field Dialog */}
      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Add Vault Field</DialogTitle>
            <DialogDescription>Add a new piece of personal data to your vault.</DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-2">
            <div className="space-y-2">
              <label className="text-sm font-medium">Category</label>
              <Select value={newField.category} onValueChange={(v) => setNewField({ ...newField, category: v })}>
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  {CATEGORIES.map((c) => (
                    <SelectItem key={c.key} value={c.key}>{c.label}</SelectItem>
                  ))}
                  <SelectItem value="custom">Custom</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Label</label>
              <Input
                placeholder="e.g., Full Name"
                value={newField.label}
                onChange={(e) => setNewField({ ...newField, label: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Value</label>
              <Input
                placeholder="e.g., John Doe"
                value={newField.value}
                onChange={(e) => setNewField({ ...newField, value: e.target.value })}
              />
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setAddDialogOpen(false)}>Cancel</Button>
            <Button onClick={addField} disabled={saving || !newField.label || !newField.value}>
              {saving ? "Saving..." : "Add Field"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
