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
import { Checkbox } from "@/components/ui/checkbox";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryDot } from "@/components/category-dot";
import { Plus, Pencil, Trash2, RefreshCw, Settings2 } from "lucide-react";
import { PageHeader } from "@/components/page-header";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Skeleton } from "@/components/ui/skeleton";
import { EmptyState } from "@/components/empty-state";
import { toast } from "sonner";

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
  const [deleteConfirm, setDeleteConfirm] = useState<{ open: boolean; id: number | null }>({ open: false, id: null });
  const [loading, setLoading] = useState(true);

  const fetchRules = useCallback(async () => {
    const res = await fetch("/api/rules");
    setRules(await res.json());
    setLoading(false);
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
      toast.success(`Applied to ${data.affected} transactions`);
    } else {
      toast.success(editingRule ? "Rule updated" : "Rule created");
    }
    fetchRules();
    if (!data.affected) {
      setDialogOpen(false);
    }
  };

  const handleDelete = async (id: number) => {
    await fetch(`/api/rules?id=${id}`, { method: "DELETE" });
    fetchRules();
    toast.success("Rule deleted");
  };

  return (
    <div className="max-w-5xl mx-auto space-y-4">
      <PageHeader title="Auto-categorization Rules">
        <Button onClick={openCreate}>
          <Plus className="h-4 w-4 mr-2" />
          Add Rule
        </Button>
      </PageHeader>

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
            {loading ? (
              Array.from({ length: 3 }).map((_, i) => (
                <TableRow key={`skel-${i}`}>
                  <TableCell><Skeleton className="h-5 w-16 rounded-full" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-24" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-28" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-20" /></TableCell>
                  <TableCell><Skeleton className="h-4 w-12" /></TableCell>
                </TableRow>
              ))
            ) : rules.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="py-0">
                  <EmptyState
                    icon={<Settings2 />}
                    title="No rules yet"
                    description="Categorize a transaction to create your first auto-categorization rule."
                  />
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
                        onClick={() => setDeleteConfirm({ open: true, id: rule.id })}
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

      <ConfirmDialog
        open={deleteConfirm.open}
        onOpenChange={(open) => setDeleteConfirm({ open, id: open ? deleteConfirm.id : null })}
        title="Delete rule?"
        description="This rule will stop applying to future transactions. Existing categorizations won't be affected."
        confirmLabel="Delete"
        onConfirm={() => deleteConfirm.id !== null && handleDelete(deleteConfirm.id)}
      />

      {/* Create/Edit Dialog */}
      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>{editingRule ? "Edit Rule" : "Create Rule"}</DialogTitle>
          </DialogHeader>

          <div className="space-y-4">
            <div>
              <Label>Match Field</Label>
              <Select
                value={form.matchField}
                onValueChange={(val) => {
                  const value = val ?? form.matchField;
                  setForm((f) => ({ ...f, matchField: value }));
                  fetchMatchCount(value, form.matchValue);
                }}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="creditor_name">Creditor Name (expenses)</SelectItem>
                  <SelectItem value="debtor_name">Debtor Name (income)</SelectItem>
                </SelectContent>
              </Select>
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
              <Select
                value={form.categoryId}
                onValueChange={(val) => setForm((f) => ({ ...f, categoryId: val ?? f.categoryId }))}
              >
                <SelectTrigger className="w-full mt-1">
                  <SelectValue placeholder="Select category..." />
                </SelectTrigger>
                <SelectContent>
                  {categories.map((c) => (
                    <SelectItem key={c.id} value={String(c.id)}>
                      <CategoryDot color={c.color} size="sm" />
                      {c.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            {matchCount !== null && matchCount > 0 && (
              <div className="flex items-center gap-2 p-3 bg-muted rounded-lg">
                <Checkbox
                  id="retro"
                  checked={applyRetro}
                  onCheckedChange={(v) => setApplyRetro(!!v)}
                />
                <label htmlFor="retro" className="text-sm cursor-pointer">
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
