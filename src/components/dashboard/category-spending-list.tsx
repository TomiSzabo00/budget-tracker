"use client";

import { useRouter } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CategoryDot } from "@/components/category-dot";
import { formatCurrency } from "@/lib/format";
import type { CategoryBreakdown } from "@/types";

interface Props {
  data: CategoryBreakdown[];
  currency: string;
  title?: string;
  dateFrom?: string;
  dateTo?: string;
}

export function CategorySpendingList({ data, currency, title = "Spending by Category", dateFrom, dateTo }: Props) {
  const router = useRouter();

  const handleClick = (categoryId: number) => {
    const params = new URLSearchParams();
    params.set("categoryId", String(categoryId));
    if (dateFrom) params.set("dateFrom", dateFrom);
    if (dateTo) params.set("dateTo", dateTo);
    router.push(`/transactions?${params}`);
  };

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
          <div
            key={cat.categoryId}
            className="space-y-1 cursor-pointer rounded -mx-2 px-2 py-1 hover:bg-muted/50 transition-colors"
            onClick={() => handleClick(cat.categoryId)}
          >
            <div className="flex items-center justify-between text-sm">
              <div className="flex items-center gap-2">
                <CategoryDot color={cat.categoryColor} size="md" />
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
