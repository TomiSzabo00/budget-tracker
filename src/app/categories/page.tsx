"use client";

import { useEffect, useState, useCallback } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Checkbox } from "@/components/ui/checkbox";
import { Badge } from "@/components/ui/badge";
import { Pencil, Trash2, Plus, Check, X } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ColorPicker } from "@/components/color-picker";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { toast } from "sonner";

interface Category {
  id: number;
  name: string;
  color: string;
  excludeFromBudget: boolean;
  isSystem: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [editingId, setEditingId] = useState<number | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [editName, setEditName] = useState("");
  const [editColor, setEditColor] = useState("#6b7280");
  const [editExclude, setEditExclude] = useState(false);
  const [adding, setAdding] = useState(false);
  const [newName, setNewName] = useState("");
  const [newColor, setNewColor] = useState("#6b7280");
  const [newExclude, setNewExclude] = useState(false);

  const fetchCategories = useCallback(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => { setCategories(data); setLoading(false); });
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  // Escape key cancels editing
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && editingId !== null) {
        setEditingId(null);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [editingId]);

  const startEdit = (cat: Category) => {
    setEditingId(cat.id);
    setEditName(cat.name);
    setEditColor(cat.color);
    setEditExclude(cat.excludeFromBudget);
  };

  const saveEdit = async () => {
    if (!editingId) return;
    await fetch("/api/categories", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id: editingId, name: editName, color: editColor, excludeFromBudget: editExclude }),
    });
    setEditingId(null);
    fetchCategories();
    toast.success("Category updated");
  };

  const deleteCategory = async (id: number) => {
    await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    fetchCategories();
    toast.success("Category deleted");
  };

  const addCategory = async () => {
    if (!newName.trim()) return;
    await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newName, color: newColor, excludeFromBudget: newExclude }),
    });
    setAdding(false);
    setNewName("");
    setNewColor("#6b7280");
    setNewExclude(false);
    fetchCategories();
    toast.success("Category created");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-6">
      <PageHeader title="Categories">
        <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </PageHeader>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Color</TableHead>
              <TableHead>Name</TableHead>
              <TableHead>Exclude from Budget</TableHead>
              <TableHead>Type</TableHead>
              <TableHead className="w-20">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading && !adding && (
              Array.from({ length: 4 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell><Skeleton className="w-8 h-8 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-32" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-16" /></TableCell>
                  <TableCell><Skeleton className="h-5 w-14 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                </TableRow>
              ))
            )}
            {adding && (
              <TableRow>
                <TableCell>
                  <ColorPicker value={newColor} onChange={setNewColor} />
                </TableCell>
                <TableCell>
                  <Input
                    value={newName}
                    onChange={(e) => setNewName(e.target.value)}
                    placeholder="Category name"
                    className="h-8"
                    autoFocus
                    onKeyDown={(e) => e.key === "Enter" && addCategory()}
                  />
                </TableCell>
                <TableCell>
                  <Checkbox checked={newExclude} onCheckedChange={(v) => setNewExclude(!!v)} />
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">Custom</Badge>
                </TableCell>
                <TableCell>
                  <div className="flex gap-1">
                    <Button size="icon-sm" variant="ghost" onClick={addCategory} className="text-[var(--color-income)]">
                      <Check className="h-4 w-4" />
                    </Button>
                    <Button size="icon-sm" variant="ghost" onClick={() => setAdding(false)}>
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {categories.map((cat) => (
              <TableRow
                key={cat.id}
                className={editingId === cat.id ? "bg-accent/40 ring-1 ring-inset ring-primary/20" : ""}
              >
                <TableCell>
                  {editingId === cat.id ? (
                    <ColorPicker value={editColor} onChange={setEditColor} />
                  ) : (
                    <div className="w-6 h-6 rounded-full border" style={{ backgroundColor: cat.color }} />
                  )}
                </TableCell>
                <TableCell>
                  {editingId === cat.id ? (
                    <Input
                      value={editName}
                      onChange={(e) => setEditName(e.target.value)}
                      className="h-8"
                      disabled={cat.isSystem}
                      onKeyDown={(e) => e.key === "Enter" && saveEdit()}
                    />
                  ) : (
                    <span className="font-medium">{cat.name}</span>
                  )}
                </TableCell>
                <TableCell>
                  {editingId === cat.id ? (
                    <Checkbox checked={editExclude} onCheckedChange={(v) => setEditExclude(!!v)} />
                  ) : (
                    cat.excludeFromBudget && <Badge variant="outline">Excluded</Badge>
                  )}
                </TableCell>
                <TableCell>
                  <Badge variant={cat.isSystem ? "default" : "secondary"}>
                    {cat.isSystem ? "System" : "Custom"}
                  </Badge>
                </TableCell>
                <TableCell>
                  {editingId === cat.id ? (
                    <div className="flex gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={saveEdit} className="text-[var(--color-income)]">
                        <Check className="h-4 w-4" />
                      </Button>
                      <Button size="icon-sm" variant="ghost" onClick={() => setEditingId(null)}>
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <Button size="icon-sm" variant="ghost" onClick={() => startEdit(cat)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      {!cat.isSystem && (
                        <Button
                          size="icon-sm"
                          variant="ghost"
                          className="text-muted-foreground hover:text-destructive"
                          onClick={() => setDeleteConfirm({ open: true, id: cat.id })}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, id: open ? deleteConfirm.id : null })}
        title="Delete category?"
        description="Transactions in this category will become uncategorized."
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm.id !== null && deleteCategory(deleteConfirm.id)}
      />
    </div>
  );
}
