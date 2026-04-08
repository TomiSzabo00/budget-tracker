"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useSearchParams } from "next/navigation";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { PageHeader } from "@/components/page-header";
import { TransactionFilters } from "@/components/transactions/filters";
import { Button } from "@/components/ui/button";
import { toast } from "sonner";
import { BulkActions } from "@/components/transactions/bulk-actions";

interface Category {
  id: number;
  name: string;
  color: string;
}

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
  categoryOverride: boolean;
  rawPayload: string | null;
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

export default function TransactionsPage() {
  return (
    <Suspense>
      <TransactionsContent />
    </Suspense>
  );
}

function TransactionsContent() {
  const searchParams = useSearchParams();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
  const [filtersInit, setFiltersInit] = useState(false);
  const [filters, setFilters] = useState<Filters>({
    search: "",
    categoryId: "",
    dateFrom: "",
    dateTo: "",
    type: "",
    uncategorizedOnly: false,
    sortBy: "bookingDate",
    sortDir: "desc",
  });

  // Initialize filters from URL params on mount
  useEffect(() => {
    const catId = searchParams.get("categoryId") || "";
    const dateFrom = searchParams.get("dateFrom") || "";
    const dateTo = searchParams.get("dateTo") || "";
    if (catId || dateFrom || dateTo) {
      setFilters((prev) => ({ ...prev, categoryId: catId, dateFrom, dateTo }));
    }
    setFiltersInit(true);
  }, [searchParams]);

  const fetchTransactions = useCallback(async () => {
    const params = new URLSearchParams();
    params.set("page", String(page));
    params.set("limit", "50");
    if (filters.search) params.set("search", filters.search);
    if (filters.categoryId) params.set("categoryId", filters.categoryId);
    if (filters.dateFrom) params.set("dateFrom", filters.dateFrom);
    if (filters.dateTo) params.set("dateTo", filters.dateTo);
    if (filters.type) params.set("type", filters.type);
    if (filters.uncategorizedOnly) params.set("uncategorizedOnly", "true");
    params.set("sortBy", filters.sortBy);
    params.set("sortDir", filters.sortDir);

    const res = await fetch(`/api/transactions?${params}`);
    const data = await res.json();
    setTransactions(data.data);
    setTotal(data.total);
    setTotalPages(data.totalPages);
  }, [page, filters]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then(setCategories);
  }, []);

  useEffect(() => {
    if (filtersInit) fetchTransactions();
  }, [fetchTransactions, filtersInit]);

  const handleCategoryChange = async (
    txId: number,
    categoryId: number,
    createRule: boolean
  ) => {
    await fetch(`/api/transactions/${txId}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ categoryId, createRule }),
    });
    fetchTransactions();
  };

  const handleBulkCategorize = async (categoryId: number) => {
    const count = selected.size;
    await fetch("/api/transactions/bulk-categorize", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        transactionIds: Array.from(selected),
        categoryId,
      }),
    });
    setSelected(new Set());
    fetchTransactions();
    toast.success(`Categorized ${count} transaction${count !== 1 ? "s" : ""}`);
  };

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      <PageHeader title="Transactions" description="View and categorize your bank transactions" />

      <TransactionFilters
        filters={filters}
        categories={categories}
        onChange={(f) => {
          setFilters(f);
          setPage(1);
        }}
      />

      {selected.size > 0 && (
        <BulkActions
          selectedCount={selected.size}
          categories={categories}
          onBulkCategorize={handleBulkCategorize}
          onClear={() => setSelected(new Set())}
        />
      )}

      <TransactionTable
        transactions={transactions}
        categories={categories}
        selected={selected}
        onSelect={setSelected}
        onCategoryChange={handleCategoryChange}
        sortBy={filters.sortBy}
        sortDir={filters.sortDir}
        onSort={(col) => {
          setFilters((f) => ({
            ...f,
            sortBy: col,
            sortDir: f.sortBy === col && f.sortDir === "desc" ? "asc" : "desc",
          }));
        }}
      />

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-between text-sm text-muted-foreground">
          <span>
            Showing {transactions.length} of {total} transactions
          </span>
          <div className="flex items-center gap-1">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page <= 1}
            >
              Previous
            </Button>
            {Array.from({ length: Math.min(totalPages, 5) }, (_, i) => {
              let pageNum: number;
              if (totalPages <= 5) {
                pageNum = i + 1;
              } else if (page <= 3) {
                pageNum = i + 1;
              } else if (page >= totalPages - 2) {
                pageNum = totalPages - 4 + i;
              } else {
                pageNum = page - 2 + i;
              }
              return (
                <Button
                  key={pageNum}
                  variant={pageNum === page ? "default" : "outline"}
                  size="sm"
                  className="w-8"
                  onClick={() => setPage(pageNum)}
                >
                  {pageNum}
                </Button>
              );
            })}
            <Button
              variant="outline"
              size="sm"
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page >= totalPages}
            >
              Next
            </Button>
          </div>
        </div>
      )}
      {totalPages <= 1 && total > 0 && (
        <p className="text-sm text-muted-foreground">
          Showing all {total} transactions
        </p>
      )}
    </div>
  );
}
