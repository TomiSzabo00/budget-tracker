"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { TrendingUp, TrendingDown, PiggyBank, Landmark } from "lucide-react";

interface Props {
  income: number;
  spent: number;
  saved: number;
  invested: number;
  currency: string;
  label: string;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
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
        <div className="grid grid-cols-4 gap-4">
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingUp className="h-3 w-3 text-green-600" />
              Income
            </div>
            <p className="text-xl font-bold text-green-600">
              {formatCurrency(income, currency)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <TrendingDown className="h-3 w-3 text-red-500" />
              Spent
            </div>
            <p className="text-xl font-bold text-red-500">
              {formatCurrency(spent, currency)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <Landmark className="h-3 w-3 text-purple-600" />
              Invested
            </div>
            <p className="text-xl font-bold text-purple-600">
              {formatCurrency(invested, currency)}
            </p>
          </div>
          <div className="space-y-1">
            <div className="flex items-center gap-1 text-xs text-muted-foreground">
              <PiggyBank className="h-3 w-3 text-blue-600" />
              Saved
            </div>
            <p className="text-xl font-bold text-blue-600">
              {formatCurrency(saved, currency)}
            </p>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
