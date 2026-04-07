"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { CategoryBreakdown } from "@/types";

interface Props {
  data: CategoryBreakdown[];
  currency: string;
  title?: string;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function CategorySpendingList({ data, currency, title = "Spending by Category" }: Props) {
  if (data.length === 0) {
    return (
      <Card>
        <CardHeader>
          <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <p className="text-sm text-muted-foreground">No expenses in this period</p>
        </CardContent>
      </Card>
    );
  }

  const maxTotal = data[0]?.total ?? 1;

  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">{title}</CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {data.map((cat) => (
          <div key={cat.categoryId} className="space-y-1">
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <div
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: cat.categoryColor }}
                />
                <span className="font-medium">{cat.categoryName}</span>
              </div>
              <div className="flex items-center gap-2 text-right">
                <span className="font-mono text-muted-foreground">{cat.percentage}%</span>
                <span className="font-mono font-medium min-w-[100px] text-right">
                  {formatCurrency(cat.total, currency)}
                </span>
              </div>
            </div>
            <div className="h-1.5 bg-muted rounded-full overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{
                  width: `${(cat.total / maxTotal) * 100}%`,
                  backgroundColor: cat.categoryColor,
                }}
              />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
