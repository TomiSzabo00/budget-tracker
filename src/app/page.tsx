"use client";

import { useEffect, useState } from "react";
import { AuthStatusBanner } from "@/components/dashboard/auth-status-banner";
import { MonthSummaryCard } from "@/components/dashboard/month-summary-card";
import { CategoryDonutChart } from "@/components/dashboard/category-donut-chart";
import { TaxSummary } from "@/components/dashboard/tax-summary";
import { YearlySummary } from "@/components/dashboard/yearly-summary";
import type { CategoryBreakdown, TaxSummary as TaxSummaryType } from "@/types";

interface SummaryData {
  income: number;
  spent: number;
  saved: number;
  currency: string;
  categoryBreakdown: CategoryBreakdown[];
  taxSummary: TaxSummaryType;
}

export default function DashboardPage() {
  const [data, setData] = useState<SummaryData | null>(null);

  useEffect(() => {
    const now = new Date();
    const year = now.getFullYear();
    const month = now.getMonth() + 1;
    fetch(`/api/summary?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then(setData);
  }, []);

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <h1 className="text-2xl font-bold">Dashboard</h1>

      <AuthStatusBanner />

      {data && (
        <>
          <MonthSummaryCard
            income={data.income}
            spent={data.spent}
            saved={data.saved}
            currency={data.currency}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategoryDonutChart
              data={data.categoryBreakdown}
              currency={data.currency}
            />
            <TaxSummary data={data.taxSummary} currency={data.currency} />
          </div>
        </>
      )}

      <YearlySummary />
    </div>
  );
}
