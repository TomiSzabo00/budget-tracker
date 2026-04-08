"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, PiggyBank, Landmark } from "lucide-react";
import { formatCurrency } from "@/lib/format";

interface Props {
  income: number;
  spent: number;
  saved: number;
  invested: number;
  currency: string;
  label: string;
}

export function MonthSummaryCard({ income, spent, saved, invested, currency, label }: Props) {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="text-sm font-medium text-muted-foreground">
          {label}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <div className="space-y-1 border-l-2 pl-3" style={{ borderColor: "var(--color-income)" }}>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3" style={{ color: "var(--color-income)" }} />
              Income
            </div>
            <p className="text-2xl font-bold" style={{ color: "var(--color-income)" }}>
              {formatCurrency(income, currency)}
            </p>
          </div>
          <div className="space-y-1 border-l-2 pl-3" style={{ borderColor: "var(--color-expense)" }}>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3" style={{ color: "var(--color-expense)" }} />
              Spent
            </div>
            <p className="text-2xl font-bold" style={{ color: "var(--color-expense)" }}>
              {formatCurrency(spent, currency)}
            </p>
          </div>
          <div className="space-y-1 border-l-2 pl-3" style={{ borderColor: "var(--color-investment)" }}>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Landmark className="h-3 w-3" style={{ color: "var(--color-investment)" }} />
              Invested
            </div>
            <p className="text-2xl font-bold" style={{ color: "var(--color-investment)" }}>
              {formatCurrency(invested, currency)}
            </p>
          </div>
          <div className="space-y-1 border-l-2 pl-3" style={{ borderColor: "var(--color-savings)" }}>
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <PiggyBank className="h-3 w-3" style={{ color: "var(--color-savings)" }} />
              Saved
            </div>
            <p className="text-2xl font-bold" style={{ color: "var(--color-savings)" }}>
              {formatCurrency(saved, currency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
