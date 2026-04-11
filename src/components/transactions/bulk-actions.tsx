"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Props {
  selectedCount: number;
  categories: Category[];
  onBulkCategorize: (categoryId: number) => void;
  onClear: () => void;
}

export function BulkActions({ selectedCount, categories, onBulkCategorize, onClear }: Props) {
  const [dialogOpen, setDialogOpen] = useState(false);
  const [selectedCat, setSelectedCat] = useState<number | null>(null);

  return (
    <div className="flex flex-wrap items-center gap-3 p-3 bg-primary/5 border border-primary/20 rounded-lg">
      <span className="text-sm font-medium">{selectedCount} selected</span>
      <Button size="sm" variant="outline" onClick={() => setDialogOpen(true)}>
        Assign Category
      </Button>
      <Button size="sm" variant="ghost" onClick={onClear}>
        Clear
      </Button>

      <Dialog open={dialogOpen} onOpenChange={setDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Bulk Assign Category</DialogTitle>
          </DialogHeader>
          <p className="text-sm text-muted-foreground">
            Assign a category to {selectedCount} selected transactions.
          </p>
          <div className="grid grid-cols-2 gap-2 mt-4">
            {categories.map((cat) => (
              <button
                key={cat.id}
                className={`flex items-center gap-2 px-3 py-2 rounded border text-sm transition-colors ${
                  selectedCat === cat.id
                    ? "border-primary bg-primary/10"
                    : "border-border hover:bg-muted"
                }`}
                onClick={() => setSelectedCat(cat.id)}
              >
                <span
                  className="w-3 h-3 rounded-full"
                  style={{ backgroundColor: cat.color }}
                />
                {cat.name}
              </button>
            ))}
          </div>
          <DialogFooter>
            <Button variant="ghost" onClick={() => setDialogOpen(false)}>
              Cancel
            </Button>
            <Button
              disabled={!selectedCat}
              onClick={() => {
                if (selectedCat) {
                  onBulkCategorize(selectedCat);
                  setDialogOpen(false);
                  setSelectedCat(null);
                }
              }}
            >
              Apply to {selectedCount} transactions
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
