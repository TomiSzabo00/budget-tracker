"use client";

import { useState } from "react";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Checkbox } from "@/components/ui/checkbox";
import { CategoryDropdown } from "./category-dropdown";
import { RawJsonDialog } from "./raw-json-dialog";
import { ArrowUpDown, Code2, SearchX } from "lucide-react";
import { formatCurrency } from "@/lib/format";
import { EmptyState } from "@/components/empty-state";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

interface Transaction {
  id: number;
  txHash: string;
  amount: number;
  currency: string;
  status: string;
  bookingDate: string;
  belongsToMonth: string | null;
  debtorName: string | null;
  creditorName: string | null;
  reference: string | null;
  description: string | null;
  categoryId: number | null;
  categoryName: string | null;
  categoryColor: string | null;
  rawPayload: string | null;
}

interface Category {
  id: number;
  name: string;
  color: string;
}

interface Props {
  transactions: Transaction[];
  categories: Category[];
  selected: Set<number>;
  onSelect: (s: Set<number>) => void;
  onCategoryChange: (txId: number, categoryId: number, createRule: boolean) => void;
  sortBy: string;
  sortDir: string;
  onSort: (column: string) => void;
}

export function TransactionTable({
  transactions,
  categories,
  selected,
  onSelect,
  onCategoryChange,
  sortBy,
  sortDir,
  onSort,
}: Props) {
  const allSelected =
    transactions.length > 0 && transactions.every((t) => selected.has(t.id));

  const [rawJson, setRawJson] = useState<{ txHash: string; payload: string } | null>(null);

  const toggleAll = () => {
    if (allSelected) {
      onSelect(new Set());
    } else {
      onSelect(new Set(transactions.map((t) => t.id)));
    }
  };

  const toggle = (id: number) => {
    const next = new Set(selected);
    if (next.has(id)) next.delete(id);
    else next.add(id);
    onSelect(next);
  };

  const SortHeader = ({ column, label }: { column: string; label: string }) => (
    <TableHead
      className="cursor-pointer select-none"
      onClick={() => onSort(column)}
    >
      <div className="flex items-center gap-1">
        {label}
        {sortBy === column && (
          <ArrowUpDown className="h-3 w-3" />
        )}
      </div>
    </TableHead>
  );

  return (
    <TooltipProvider delay={300}>
    <>
    <div className="border rounded-lg overflow-x-auto">
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-10">
              <Checkbox checked={allSelected} onCheckedChange={toggleAll} />
            </TableHead>
            <SortHeader column="bookingDate" label="Date" />
            <TableHead>Description</TableHead>
            <TableHead>Counterparty</TableHead>
            <SortHeader column="amount" label="Amount" />
            <TableHead>Category</TableHead>
            <TableHead className="w-8" />
          </TableRow>
        </TableHeader>
        <TableBody>
          {transactions.length === 0 ? (
            <TableRow>
              <TableCell colSpan={7} className="py-0">
                <EmptyState
                  icon={<SearchX />}
                  title="No transactions found"
                  description="Try adjusting your filters to find what you're looking for."
                />
              </TableCell>
            </TableRow>
          ) : (
            transactions.map((tx) => (
              <TableRow key={tx.id}>
                <TableCell>
                  <Checkbox
                    checked={selected.has(tx.id)}
                    onCheckedChange={() => toggle(tx.id)}
                  />
                </TableCell>
                <TableCell className="whitespace-nowrap">
                  {tx.belongsToMonth ? (
                    <div className="flex flex-col">
                      <span className="text-xs text-muted-foreground line-through">{tx.bookingDate}</span>
                      <span>{tx.belongsToMonth}</span>
                    </div>
                  ) : (
                    tx.bookingDate
                  )}
                </TableCell>
                <TableCell className="max-w-[200px]">
                  <Tooltip>
                    <TooltipTrigger className="truncate block w-full text-left">
                      {tx.description || tx.reference || "—"}
                    </TooltipTrigger>
                    {(tx.description || tx.reference) && (
                      <TooltipContent side="bottom">{tx.description || tx.reference}</TooltipContent>
                    )}
                  </Tooltip>
                </TableCell>
                <TableCell className="max-w-[150px]">
                  <Tooltip>
                    <TooltipTrigger className="truncate block w-full text-left">
                      {tx.amount < 0 ? tx.creditorName : tx.debtorName || "—"}
                    </TooltipTrigger>
                    {(tx.amount < 0 ? tx.creditorName : tx.debtorName) && (
                      <TooltipContent side="bottom">
                        {tx.amount < 0 ? tx.creditorName : tx.debtorName}
                      </TooltipContent>
                    )}
                  </Tooltip>
                </TableCell>
                <TableCell
                  className="font-mono whitespace-nowrap"
                  style={{ color: tx.amount > 0 ? "var(--color-income)" : "var(--color-expense)" }}
                >
                  {formatCurrency(tx.amount, tx.currency)}
                </TableCell>
                <TableCell>
                  <CategoryDropdown
                    currentCategoryId={tx.categoryId}
                    currentCategoryName={tx.categoryName}
                    currentCategoryColor={tx.categoryColor}
                    categories={categories}
                    counterparty={tx.amount < 0 ? tx.creditorName : tx.debtorName}
                    onSelect={(catId, createRule) =>
                      onCategoryChange(tx.id, catId, createRule)
                    }
                  />
                </TableCell>
                <TableCell className="w-8">
                  {tx.rawPayload && (
                    <button
                      onClick={() => setRawJson({ txHash: tx.txHash, payload: tx.rawPayload! })}
                      className="p-1 text-muted-foreground/40 hover:text-muted-foreground transition-colors rounded"
                      title="View raw JSON"
                    >
                      <Code2 className="h-3.5 w-3.5" />
                    </button>
                  )}
                </TableCell>
              </TableRow>
            ))
          )}
        </TableBody>
      </Table>
    </div>

    {rawJson && (
      <RawJsonDialog
        open={true}
        onClose={() => setRawJson(null)}
        txHash={rawJson.txHash}
        rawPayload={rawJson.payload}
      />
    )}
  </>
  </TooltipProvider>
  );
}
