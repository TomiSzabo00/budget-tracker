"use client";

import { useEffect, useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { CategoryDonutChart } from "./category-donut-chart";
import { CategorySpendingList } from "./category-spending-list";
import { TaxSummary } from "./tax-summary";
import { ChevronDown, ChevronUp } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { formatCurrency } from "@/lib/format";
import type { CategoryBreakdown, TaxSummary as TaxSummaryType } from "@/types";

interface YearlyData {
  income: number;
  spent: number;
  saved: number;
  invested: number;
  currency: string;
  monthlyData: { month: string; income: number; expenses: number }[];
  categoryBreakdown: CategoryBreakdown[];
  taxSummary: TaxSummaryType;
}

interface YearlySummaryProps {
  showInvestment: boolean;
}

export function YearlySummary({ showInvestment }: YearlySummaryProps) {
  const [data, setData] = useState<YearlyData | null>(null);
  const [open, setOpen] = useState(false);
  const [year, setYear] = useState(new Date().getFullYear());
  const [availableYears, setAvailableYears] = useState<number[]>([]);

  // Fetch available years from available months
  useEffect(() => {
    fetch("/api/transactions/months")
      .then((r) => r.json())
      .then((months: string[]) => {
        const years = [...new Set(months.map((m) => Number(m.split("-")[0])))].sort((a, b) => b - a);
        setAvailableYears(years);
        if (years.length > 0 && !years.includes(year)) {
          setYear(years[0]);
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    fetch(`/api/summary?year=${year}`)
      .then((r) => r.json())
      .then(setData);
  }, [year]);

  if (!data) return null;

  const filteredBreakdown = data.categoryBreakdown.filter(
    (c) => showInvestment || c.categoryName !== "Investment"
  );

  return (
    <div className="space-y-4">
      {/* Section header / collapse toggle */}
      <div className="flex items-center gap-2">
        <div className="hidden sm:block flex-1 border-t border-border" />
        <div className="flex flex-wrap items-center justify-end gap-2 shrink-0 min-w-0">
          <span className="text-sm font-medium text-muted-foreground">Yearly Summary</span>
          {availableYears.length > 1 && (
            <Select value={String(year)} onValueChange={(v) => setYear(Number(v))}>
              <SelectTrigger className="h-7 w-20 text-xs">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {availableYears.map((y) => (
                  <SelectItem key={y} value={String(y)}>{y}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          )}
          <Button
            variant="ghost"
            size="icon"
            className="h-7 w-7"
            onClick={() => setOpen(!open)}
          >
            {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </Button>
        </div>
        <div className="hidden sm:block flex-1 border-t border-border" />
      </div>

      {open && (
        <div className="space-y-6">
          {/* Yearly totals — single card with 4-col grid */}
          <Card>
            <CardContent className="pt-4">
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
                <div className="space-y-1 border-l-2 pl-3" style={{ borderColor: "var(--color-income)" }}>
                  <p className="text-xs text-muted-foreground">Total Income</p>
                  <p className="text-xl font-bold" style={{ color: "var(--color-income)" }}>
                    {formatCurrency(data.income, data.currency)}
                  </p>
                </div>
                <div className="space-y-1 border-l-2 pl-3" style={{ borderColor: "var(--color-expense)" }}>
                  <p className="text-xs text-muted-foreground">Total Expenses</p>
                  <p className="text-xl font-bold" style={{ color: "var(--color-expense)" }}>
                    {formatCurrency(data.spent, data.currency)}
                  </p>
                </div>
                <div className="space-y-1 border-l-2 pl-3" style={{ borderColor: "var(--color-investment)" }}>
                  <p className="text-xs text-muted-foreground">Total Invested</p>
                  <p className="text-xl font-bold" style={{ color: "var(--color-investment)" }}>
                    {formatCurrency(data.invested, data.currency)}
                  </p>
                </div>
                <div className="space-y-1 border-l-2 pl-3" style={{ borderColor: "var(--color-savings)" }}>
                  <p className="text-xs text-muted-foreground">Total Saved</p>
                  <p className="text-xl font-bold" style={{ color: "var(--color-savings)" }}>
                    {formatCurrency(data.saved, data.currency)}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Monthly bar chart */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm font-medium text-muted-foreground">
                Monthly Income vs Expenses
              </CardTitle>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={data.monthlyData}>
                  <XAxis
                    dataKey="month"
                    tickFormatter={(v) => {
                      const [, m] = v.split("-");
                      return new Date(2000, Number(m) - 1).toLocaleString("en", { month: "short" });
                    }}
                  />
                  <YAxis />
                  <Tooltip
                    formatter={(value: unknown) => formatCurrency(Number(value), data.currency)}
                    labelFormatter={(label) => {
                      const [y, m] = label.split("-");
                      return new Date(Number(y), Number(m) - 1).toLocaleString("en", {
                        month: "long",
                        year: "numeric",
                      });
                    }}
                    contentStyle={{
                      backgroundColor: "var(--popover)",
                      border: "1px solid var(--border)",
                      borderRadius: "var(--radius-lg)",
                      color: "var(--popover-foreground)",
                    }}
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="oklch(0.55 0.15 145)" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="oklch(0.55 0.2 25)" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Yearly category breakdown + tax */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategorySpendingList
              data={filteredBreakdown}
              currency={data.currency}
              title={`Spending by Category — ${year}`}
              dateFrom={`${year}-01-01`}
              dateTo={`${year}-12-31`}
            />
            <CategoryDonutChart
              data={filteredBreakdown}
              currency={data.currency}
              title={`Category Breakdown — ${year}`}
              dateFrom={`${year}-01-01`}
              dateTo={`${year}-12-31`}
            />
          </div>

          <TaxSummary data={data.taxSummary} currency={data.currency} />
        </div>
      )}
    </div>
  );
}
