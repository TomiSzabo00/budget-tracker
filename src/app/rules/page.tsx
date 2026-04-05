"use client";

import { useEffect, useState, useCallback } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Plus, Pencil, Trash2, RefreshCw } from "lucide-react";

interface Rule {
  id: number;
  matchField: string;
  matchValue: string;
  categoryId: number;
  categoryName: string | null;
  categoryColor: string | null;
  createdAt: string;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

export default function RulesPage() {
  const [rules, setRules] = useState<Rule[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingRule, setEditingRule] = useState<Rule | null>(null);
  const [form, setForm] = useState({
    matchField: "creditor_name",
    matchValue: "",
    categoryId: "",
  });
  const [applyRetro, setApplyRetro] = useState(false);
  const [matchCount, setMatchCount] = useState<number | null>(null);
  const [retroResult, setRetroResult] = useState<string | null>(null);

  const fetchRules = useCallback(async () => {
    const res = await fetch("/api/rules");
    setRules(await res.json());
  }, []);

  useEffect(() => {
    fetchRules();
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, [fetchRules]);

  const fetchMatchCount = async (matchField: string, matchValue: string) => {
    if (!matchValue) {
      setMatchCount(null);
      return;
    }
    const res = await fetch(
      `/api/rules/count?matchField=${matchField}&matchValue=${encodeURIComponent(matchValue)}`
    );
    const data = await res.json();
    setMatchCount(data.count);
  };

  const openCreate = () => {
    setEditingRule(null);
    setForm({ matchField: "creditor_name", matchValue: "", categoryId: "" });
    setApplyRetro(false);
    setMatchCount(null);
    setRetroResult(null);
    setDialogOpen(true);
  };

  const openEdit = (rule: Rule) => {
    setEditingRule(rule);
    setForm({
      matchField: rule.matchField,
      matchValue: rule.matchValue,
      categoryId: String(rule.categoryId),
    });
    setApplyRetro(false);
    setMatchCount(null);
    setRetroResult(null);
    setDialogOpen(true);
    fetchMatchCount(rule.matchField, rule.matchValue);
  };

  const handleSave = async () => {
    const body = {
      ...form,
      categoryId: Number(form.categoryId),
      applyRetroactively: applyRetro,
    };

    let res;
    if (editingRule) {
      res = await fetch("/api/rules", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id: editingRule.id, ...body }),
      });
    } else {
      res = await fetch("/api/rules", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
      });
    }

    const data = await res.json();
    if (data.affected > 0) {
      setRetroResult(`Applied to ${data.affected} transactions`);
    }
    fetchRules();
    if (!data.affected) {
      setDialogOpen(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
    fetchRules();
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Auto-categorization Rules</h1>
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </div>

      <div className="border rounded-lg overflow-hidden">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Match Field</TableHead>
              <TableHead>Match Value</TableHead>
              <TableHead>Category</TableHead>
              <TableHead>Created</TableHead>
              <TableHead className="w-24">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No rules created yet. Categorize a transaction to create your first rule.
                </TableCell>
              </TableRow>
            ) : (
              rules.map((rule) => (
                <TableRow key={rule.id}>
                  <TableCell>
                    <Badge variant="secondary">
                      {rule.matchField === "creditor_name" ? "Creditor" : "Debtor"}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-mono text-sm">{rule.matchValue}</TableCell>
                  <TableCell>
                    <span className="flex items-center gap-2">
                      <span
                        className="w-2.5 h-2.5 rounded-full"
                        style={{ backgroundColor: rule.categoryColor || "#9ca3af" }}
                      />
                      {rule.categoryName}
                    </span>
                  </TableCell>
                  <TableCell className="text-muted-foreground text-sm">
                    {new Date(rule.createdAt).toLocaleDateString()}
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Button size="icon" variant="ghost" onClick={() => openEdit(rule)}>
                        <Pencil className="h-3.5 w-3.5" />
                      </Button>
                      <Button
                        size="icon"
                        variant="ghost"
                        className="text-destructive"
                        onClick={() => handleDelete(rule.id)}
                      >
                        <Trash2 className="h-3.5 w-3.5" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Create Rule"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Match Field</Label>
              <select
                className="w-full h-9 px-3 border rounded-md text-sm bg-background mt-1"
                value={form.matchField}
                onChange={(e) => {
                  setForm((f) => ({ ...f, matchField: e.target.value }));
                  fetchMatchCount(e.target.value, form.matchValue);
                }}
              >
                <option value="creditor_name">Creditor Name (expenses)</option>
                <option value="debtor_name">Debtor Name (income)</option>
              </select>
            </div>

            <div>
              <Label>Match Value (case-insensitive substring)</Label>
              <Input
                className="mt-1"
                placeholder="e.g. tesco"
                value={form.matchValue}
                onChange={(e) => {
                  setForm((f) => ({ ...f, matchValue: e.target.value }));
                  fetchMatchCount(form.matchField, e.target.value);
                }}
              />
              {matchCount !== null && (
                <p className="text-xs text-muted-foreground mt-1">
                  {matchCount} existing transactions match this pattern
                </p>
              )}
            </div>

            <div>
              <Label>Category</Label>
              <select
                className="w-full h-9 px-3 border rounded-md text-sm bg-background mt-1"
                value={form.categoryId}
                onChange={(e) => setForm((f) => ({ ...f, categoryId: e.target.value }))}
              >
                <option value="">Select category...</option>
                {categories.map((c) => (
                  <option key={c.id} value={c.id}>
                    {c.name}
                  </option>
                ))}
              </select>
            </div>

            {matchCount !== null && matchCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <input
                  type="checkbox"
                  id="retro"
                  checked={applyRetro}
                  onChange={(e) => setApplyRetro(e.target.checked)}
                />
                <label htmlFor="retro" className="text-sm">
                  Apply retroactively to {matchCount} matching transactions
                </label>
              </div>
            )}

            {retroResult && (
              <div className="flex items-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
                <RefreshCw className="h-4 w-4 text-green-600" />
                <span className="text-sm text-green-700">{retroResult}</span>
              </div>
            )}
          </div>

          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              {retroResult ? "Close" : "Cancel"}
            </Button>
            {!retroResult && (
              <Button
                disabled={!form.matchValue || !form.categoryId}
                onClick={handleSave}
              >
                {editingRule ? "Update" : "Create"} Rule
              </Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
