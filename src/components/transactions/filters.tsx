"use client";

import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";

interface Category {
  id: number;
  name: string;
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

export function TransactionFilters({ filters, categories, onChange }: Props) {
  const update = (partial: Partial<Filters>) =>
    onChange({ ...filters, ...partial });

  return (
    <div className="flex flex-wrap gap-3 items-end p-4 bg-muted/30 rounded-lg">
      <div className="flex-1 min-w-[200px]">
        <Label className="text-xs mb-1">Search</Label>
        <Input
          placeholder="Search transactions..."
          value={filters.search}
          onChange={(e) => update({ search: e.target.value })}
        />
      </div>

      <div className="min-w-[150px]">
        <Label className="text-xs mb-1">Category</Label>
        <select
          className="w-full h-9 px-3 border rounded-md text-sm bg-background"
          value={filters.categoryId}
          onChange={(e) => update({ categoryId: e.target.value })}
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.id}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      <div className="min-w-[130px]">
        <Label className="text-xs mb-1">Type</Label>
        <select
          className="w-full h-9 px-3 border rounded-md text-sm bg-background"
          value={filters.type}
          onChange={(e) => update({ type: e.target.value })}
        >
          <option value="">All</option>
          <option value="income">Income</option>
          <option value="expense">Expense</option>
        </select>
      </div>

      <div>
        <Label className="text-xs mb-1">From</Label>
        <Input
          type="date"
          value={filters.dateFrom}
          onChange={(e) => update({ dateFrom: e.target.value })}
        />
      </div>

      <div>
        <Label className="text-xs mb-1">To</Label>
        <Input
          type="date"
          value={filters.dateTo}
          onChange={(e) => update({ dateTo: e.target.value })}
        />
      </div>

      <div className="flex items-center gap-2 pb-1">
        <Switch
          checked={filters.uncategorizedOnly}
          onCheckedChange={(checked) =>
            update({ uncategorizedOnly: checked })
          }
        />
        <Label className="text-xs">Uncategorized only</Label>
      </div>
    </div>
  );
}
