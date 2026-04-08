"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { CategoryDot } from "@/components/category-dot";
import { Button } from "@/components/ui/button";
import { X } from "lucide-react";

interface Category {
  id: number;
  name: string;
  color?: string;
}

interface Filters {
  search: string;
  categoryId: string;
  dateFrom: string;
  dateTo: string;
  type: string;
  uncategorizedOnly: boolean;
  sortBy: string;
  sortDir: string;
}

interface Props {
  filters: Filters;
  categories: Category[];
  onChange: (filters: Filters) => void;
}

const defaultFilters: Filters = {
  search: "",
  categoryId: "",
  dateFrom: "",
  dateTo: "",
  type: "",
  uncategorizedOnly: false,
  sortBy: "bookingDate",
  sortDir: "desc",
};

function hasActiveFilters(filters: Filters) {
  return (
    filters.search !== "" ||
    filters.categoryId !== "" ||
    filters.dateFrom !== "" ||
    filters.dateTo !== "" ||
    filters.type !== "" ||
    filters.uncategorizedOnly
  );
}

export function TransactionFilters({ filters, categories, onChange }: Props) {
  const update = (partial: Partial<Filters>) =>
    onChange({ ...filters, ...partial });

  const clearFilters = () =>
    onChange({ ...defaultFilters, sortBy: filters.sortBy, sortDir: filters.sortDir });

  return (
    <div className="bg-card border shadow-sm rounded-lg p-4">
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-6 gap-3">
        <div className="lg:col-span-2">
          <Label className="text-xs mb-1 block">Search</Label>
          <Input
            placeholder="Search transactions..."
            value={filters.search}
            onChange={(e) => update({ search: e.target.value })}
          />
        </div>

        <div>
          <Label className="text-xs mb-1 block">Category</Label>
          <Select
            value={filters.categoryId || "__all__"}
            onValueChange={(val) => update({ categoryId: !val || val === "__all__" ? "" : val })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All Categories</SelectItem>
              {categories.map((c) => (
                <SelectItem key={c.id} value={String(c.id)}>
                  {c.color && <CategoryDot color={c.color} size="sm" />}
                  {c.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs mb-1 block">Type</Label>
          <Select
            value={filters.type || "__all__"}
            onValueChange={(val) => update({ type: !val || val === "__all__" ? "" : val })}
          >
            <SelectTrigger className="w-full">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="__all__">All</SelectItem>
              <SelectItem value="income">Income</SelectItem>
              <SelectItem value="expense">Expense</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div>
          <Label className="text-xs mb-1 block">From</Label>
          <Input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => update({ dateFrom: e.target.value })}
          />
        </div>

        <div>
          <Label className="text-xs mb-1 block">To</Label>
          <Input
            type="date"
            value={filters.dateTo}
            onChange={(e) => update({ dateTo: e.target.value })}
          />
        </div>
      </div>

      <div className="flex items-center justify-between mt-3 pt-3 border-t">
        <div className="flex items-center gap-2">
          <Switch
            checked={filters.uncategorizedOnly}
            onCheckedChange={(checked) => update({ uncategorizedOnly: checked })}
          />
          <Label className="text-xs cursor-pointer">Uncategorized only</Label>
        </div>
        {hasActiveFilters(filters) && (
          <Button variant="ghost" size="sm" onClick={clearFilters} className="h-7 text-xs gap-1">
            <X className="h-3 w-3" />
            Clear filters
          </Button>
        )}
      </div>
    </div>
  );
}
