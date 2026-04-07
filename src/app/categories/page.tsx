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

interface Category {
  id: number;
  name: string;
  color: string;
  excludeFromBudget: boolean;
  isSystem: boolean;
}

export default function CategoriesPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [editingId, setEditingId] = useState<number | null>(null);
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
      .then(setCategories);
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

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
  };

  const deleteCategory = async (id: number) => {
    if (!confirm("Delete this category? Transactions will become uncategorized.")) return;
    await fetch(`/api/categories?id=${id}`, { method: "DELETE" });
    fetchCategories();
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
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Categories</h1>
        <Button size="sm" onClick={() => setAdding(true)} disabled={adding}>
          <Plus className="h-4 w-4 mr-1" /> Add Category
        </Button>
      </div>

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
            {adding && (
              <TableRow>
                <TableCell>
                  <input
                    type="color"
                    value={newColor}
                    onChange={(e) => setNewColor(e.target.value)}
                    className="w-8 h-8 rounded cursor-pointer border-0"
                  />
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
                    <button onClick={addCategory} className="p-1 text-green-600 hover:text-green-700">
                      <Check className="h-4 w-4" />
                    </button>
                    <button onClick={() => setAdding(false)} className="p-1 text-muted-foreground hover:text-foreground">
                      <X className="h-4 w-4" />
                    </button>
                  </div>
                </TableCell>
              </TableRow>
            )}
            {categories.map((cat) => (
              <TableRow key={cat.id}>
                <TableCell>
                  {editingId === cat.id ? (
                    <input
                      type="color"
                      value={editColor}
                      onChange={(e) => setEditColor(e.target.value)}
                      className="w-8 h-8 rounded cursor-pointer border-0"
                    />
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
                      <button onClick={saveEdit} className="p-1 text-green-600 hover:text-green-700">
                        <Check className="h-4 w-4" />
                      </button>
                      <button onClick={() => setEditingId(null)} className="p-1 text-muted-foreground hover:text-foreground">
                        <X className="h-4 w-4" />
                      </button>
                    </div>
                  ) : (
                    <div className="flex gap-1">
                      <button onClick={() => startEdit(cat)} className="p-1 text-muted-foreground hover:text-foreground">
                        <Pencil className="h-3.5 w-3.5" />
                      </button>
                      {!cat.isSystem && (
                        <button onClick={() => deleteCategory(cat.id)} className="p-1 text-muted-foreground hover:text-red-500">
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      )}
                    </div>
                  )}
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}
