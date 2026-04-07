"use client";

import { useEffect, useState, useCallback } from "react";
import { TransactionTable } from "@/components/transactions/transaction-table";
import { TransactionFilters } from "@/components/transactions/filters";
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
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [selected, setSelected] = useState<Set<number>>(new Set());
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
    fetchTransactions();
  }, [fetchTransactions]);

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
  };

  return (
    <div className="max-w-7xl mx-auto space-y-4">
      <h1 className="text-2xl font-bold">Transactions</h1>

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
      <div className="flex items-center justify-between text-sm text-muted-foreground">
        <span>
          Showing {transactions.length} of {total} transactions
        </span>
        <div className="flex gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page <= 1}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Previous
          </button>
          <span className="px-3 py-1">
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      </div>
    </div>
  );
}
