"use client";

import { useState } from "react";
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover";
import { Checkbox } from "@/components/ui/checkbox";
import { Button } from "@/components/ui/button";
import { ChevronDown } from "lucide-react";

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Props {
  currentCategoryId: number | null;
  currentCategoryName: string | null;
  currentCategoryColor: string | null;
  categories: Category[];
  counterparty: string | null;
  onSelect: (categoryId: number, createRule: boolean) => void;
}

export function CategoryDropdown({
  currentCategoryName,
  currentCategoryColor,
  categories,
  counterparty,
  onSelect,
}: Props) {
  const [open, setOpen] = useState(false);
  const [createRule, setCreateRule] = useState(false);

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger
        className="flex items-center gap-1.5 text-sm hover:bg-muted rounded px-2 py-1 transition-colors"
      >
          <span
            className="w-2.5 h-2.5 rounded-full inline-block"
            style={{ backgroundColor: currentCategoryColor || "#9ca3af" }}
          />
          <span className="truncate max-w-[120px]">
            {currentCategoryName || "Uncategorized"}
          </span>
          <ChevronDown className="h-3 w-3 text-muted-foreground" />
      </PopoverTrigger>
      <PopoverContent className="w-56 p-2" align="start">
        <div className="space-y-1 max-h-64 overflow-auto">
          {categories.map((cat) => (
            <button
              key={cat.id}
              className="flex items-center gap-2 w-full text-left px-2 py-1.5 rounded text-sm hover:bg-muted transition-colors"
              onClick={() => {
                onSelect(cat.id, createRule);
                setOpen(false);
                setCreateRule(false);
              }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full"
                style={{ backgroundColor: cat.color }}
              />
              {cat.name}
            </button>
          ))}
        </div>
        {counterparty && (
          <div className="border-t mt-2 pt-2 flex items-center gap-2">
            <Checkbox
              id="create-rule"
              checked={createRule}
              onCheckedChange={(c) => setCreateRule(!!c)}
            />
            <label htmlFor="create-rule" className="text-xs text-muted-foreground">
              Apply rule to all &ldquo;{counterparty}&rdquo; transactions
            </label>
          </div>
        )}
      </PopoverContent>
    </Popover>
  );
}
