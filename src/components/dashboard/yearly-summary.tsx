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

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function YearlySummary() {
  const [data, setData] = useState<YearlyData | null>(null);
  const [open, setOpen] = useState(false);
  const year = new Date().getFullYear();

  useEffect(() => {
    fetch(`/api/summary?year=${year}`)
      .then((r) => r.json())
      .then(setData);
  }, [year]);

  if (!data) return null;

  return (
    <div className="space-y-4">
      <Button
        variant="ghost"
        className="w-full justify-between text-left"
        onClick={() => setOpen(!open)}
      >
        <span className="font-semibold">Yearly Summary — {year}</span>
        {open ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
      </Button>

      {open && (
        <div className="space-y-6">
          {/* Yearly totals */}
          <div className="grid grid-cols-4 gap-4">
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Total Income</p>
                <p className="text-2xl font-bold text-green-600">
                  {formatCurrency(data.income, data.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Total Expenses</p>
                <p className="text-2xl font-bold text-red-500">
                  {formatCurrency(data.spent, data.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Total Invested</p>
                <p className="text-2xl font-bold text-purple-600">
                  {formatCurrency(data.invested, data.currency)}
                </p>
              </CardContent>
            </Card>
            <Card>
              <CardContent className="pt-6">
                <p className="text-xs text-muted-foreground">Total Saved</p>
                <p className="text-2xl font-bold text-blue-600">
                  {formatCurrency(data.saved, data.currency)}
                </p>
              </CardContent>
            </Card>
          </div>

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
                  />
                  <Legend />
                  <Bar dataKey="income" name="Income" fill="#22c55e" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="expenses" name="Expenses" fill="#ef4444" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Yearly category breakdown + tax */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategorySpendingList
              data={data.categoryBreakdown}
              currency={data.currency}
              title={`Spending by Category — ${year}`}
            />
            <CategoryDonutChart
              data={data.categoryBreakdown}
              currency={data.currency}
              title={`Category Breakdown — ${year}`}
            />
          </div>

          <TaxSummary data={data.taxSummary} currency={data.currency} />
        </div>
      )}
    </div>
  );
}
