"use client";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { TaxSummary as TaxSummaryType } from "@/types";

interface Props {
  data: TaxSummaryType;
  currency: string;
}

function formatCurrency(amount: number, currency: string) {
  return new Intl.NumberFormat("hu-HU", {
    style: "currency",
    currency,
    maximumFractionDigits: 0,
  }).format(amount);
}

export function TaxSummary({ data, currency }: Props) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="text-sm font-medium text-muted-foreground">
          Tax Summary ({new Date().getFullYear()})
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Total Tax Paid</span>
          <span className="font-semibold text-red-500">
            {formatCurrency(data.totalTaxPaid, currency)}
          </span>
        </div>
        <div className="flex justify-between">
          <span className="text-sm text-muted-foreground">Total Income</span>
          <span className="font-semibold text-green-600">
            {formatCurrency(data.totalIncome, currency)}
          </span>
        </div>
        <div className="border-t pt-3 flex justify-between">
          <span className="text-sm font-medium">Effective Tax Rate</span>
          <span className="font-bold text-lg">{data.taxRate}%</span>
        </div>
      </CardContent>
    </Card>
  );
}
