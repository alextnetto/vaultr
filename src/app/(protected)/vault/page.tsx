"use client";

import { useState, useEffect, useCallback } from "react";
import { useSession, signOut } from "next-auth/react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import {
  Shield, Plus, Pencil, Trash2, Save, X, Share2,
  Lock, LogOut, ListChecks, ExternalLink, Hash, FileText, Type,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ThemeToggle } from "@/components/theme-toggle";
import {
  Dialog, DialogContent, DialogHeader, DialogTitle,
  DialogFooter, DialogDescription,
} from "@/components/ui/dialog";
import { toast } from "sonner";

type VaultItem = {
  id: string;
  label: string;
  value: string;
  type: string;
  createdAt: string;
  updatedAt: string;
};

const TYPE_OPTIONS = [
  { value: "text", label: "Text", icon: Type },
  { value: "url", label: "URL", icon: ExternalLink },
  { value: "number", label: "Number", icon: Hash },
  { value: "document", label: "Document", icon: FileText },
] as const;

function TypeIcon({ type }: { type: string }) {
  const option = TYPE_OPTIONS.find((t) => t.value === type);
  const Icon = option?.icon || Type;
  return <Icon className="h-3.5 w-3.5 text-muted-foreground" />;
}

function ValueDisplay({ value, type }: { value: string; type: string }) {
  if (type === "url") {
    return (
      <a
        href={value}
        target="_blank"
        rel="noopener noreferrer"
        className="text-sm font-medium text-primary hover:underline truncate block"
      >
        {value}
      </a>
    );
  }
  return <p className="text-sm font-medium truncate">{value}</p>;
}

export default function VaultPage() {
  const { status } = useSession();
  const router = useRouter();
  const [items, setItems] = useState<VaultItem[]>([]);
  const [editing, setEditing] = useState<string | null>(null);
  const [editValue, setEditValue] = useState("");
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [newItem, setNewItem] = useState({ label: "", value: "", type: "text" });
  const [saving, setSaving] = useState(false);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (status === "unauthenticated") router.push("/login");
  }, [status, router]);

  const fetchItems = useCallback(async () => {
    try {
      const res = await fetch("/api/vault");
      if (res.ok) {
        setItems(await res.json());
      }
    } catch {
      toast.error("Failed to load vault");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    if (status === "authenticated") fetchItems();
  }, [status, fetchItems]);

  const addItem = async () => {
    if (!newItem.label || !newItem.value) return;
    setSaving(true);
    try {
      const res = await fetch("/api/vault", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newItem),
      });
      if (res.ok) {
        await fetchItems();
        setAddDialogOpen(false);
        setNewItem({ label: "", value: "", type: "text" });
        toast.success("Saved");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (item: VaultItem) => {
    setSaving(true);
    try {
      const res = await fetch(`/api/vault/${item.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ value: editValue }),
      });
      if (res.ok) {
        await fetchItems();
        setEditing(null);
        toast.success("Changes saved");
      }
    } catch {
      toast.error("Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const deleteItemHandler = async (item: VaultItem) => {
    const previousItems = [...items];
    setItems(items.filter((i) => i.id !== item.id));
    toast("Item deleted", {
      action: {
        label: "Undo",
        onClick: () => setItems(previousItems),
      },
      onAutoClose: async () => {
        try {
          await fetch(`/api/vault/${item.id}`, { method: "DELETE" });
        } catch {
          setItems(previousItems);
          toast.error("Failed to delete");
        }
      },
    });
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

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-muted/20">
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
            <span className="hidden sm:inline">Add Item</span>
          </Button>
        </div>

        {items.length === 0 ? (
          <Card className="animate-fade-in">
            <CardContent className="py-16 text-center">
              <Shield className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <h2 className="text-xl font-semibold mb-2">Your vault is empty</h2>
              <p className="text-muted-foreground mb-6">Add your first piece of data to get started.</p>
              <Button onClick={() => setAddDialogOpen(true)} className="gap-2">
                <Plus className="h-4 w-4" />
                Add Item
              </Button>
            </CardContent>
          </Card>
        ) : (
          <Card className="animate-slide-up">
            <CardContent className="py-2">
              {items.map((item, i) => (
                <div key={item.id}>
                  {i > 0 && <Separator />}
                  <div className="flex items-center justify-between py-3 gap-4">
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-1.5 mb-0.5">
                        <TypeIcon type={item.type} />
                        <p className="text-xs text-muted-foreground uppercase tracking-wider">
                          {item.label}
                        </p>
                      </div>
                      {editing === item.id ? (
                        <div className="flex items-center gap-2 mt-1">
                          <Input
                            value={editValue}
                            onChange={(e) => setEditValue(e.target.value)}
                            className="h-8 text-sm"
                            autoFocus
                            onKeyDown={(e) => {
                              if (e.key === "Enter") saveEdit(item);
                              if (e.key === "Escape") setEditing(null);
                            }}
                          />
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => saveEdit(item)}
                            disabled={saving}
                          >
                            <Save className="h-3.5 w-3.5" />
                          </Button>
                          <Button size="sm" variant="ghost" onClick={() => setEditing(null)}>
                            <X className="h-3.5 w-3.5" />
                          </Button>
                        </div>
                      ) : (
                        <ValueDisplay value={item.value} type={item.type} />
                      )}
                    </div>
                    {editing !== item.id && (
                      <div className="flex items-center gap-1 shrink-0">
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => {
                            setEditing(item.id);
                            setEditValue(item.value);
                          }}
                        >
                          <Pencil className="h-3.5 w-3.5" />
                        </Button>
                        <Button
                          size="sm"
                          variant="ghost"
                          className="text-destructive hover:text-destructive"
                          onClick={() => deleteItemHandler(item)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        )}
      </main>

      <Dialog open={addDialogOpen} onOpenChange={setAddDialogOpen}>
        <DialogContent className="sm:max-w-[425px]">
          <DialogHeader>
            <DialogTitle>Add Vault Item</DialogTitle>
            <DialogDescription>
              Add a new piece of personal data to your vault.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault();
              addItem();
            }}
            className="space-y-4 py-2"
          >
            <div className="space-y-2">
              <label className="text-sm font-medium">Label</label>
              <Input
                placeholder="e.g., Bank Account, Passport Number"
                value={newItem.label}
                onChange={(e) => setNewItem({ ...newItem, label: e.target.value })}
                autoFocus
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Value</label>
              <Input
                placeholder="Enter value"
                value={newItem.value}
                onChange={(e) => setNewItem({ ...newItem, value: e.target.value })}
              />
            </div>
            <div className="space-y-2">
              <label className="text-sm font-medium">Type</label>
              <div className="flex gap-1">
                {TYPE_OPTIONS.map((opt) => (
                  <Button
                    key={opt.value}
                    type="button"
                    variant={newItem.type === opt.value ? "default" : "outline"}
                    size="sm"
                    className="gap-1.5 flex-1"
                    onClick={() => setNewItem({ ...newItem, type: opt.value })}
                  >
                    <opt.icon className="h-3.5 w-3.5" />
                    {opt.label}
                  </Button>
                ))}
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setAddDialogOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={saving || !newItem.label || !newItem.value}>
                {saving ? "Saving..." : "Add Item"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
