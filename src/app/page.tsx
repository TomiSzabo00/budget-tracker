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

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

export default function DashboardPage() {
  const now = new Date();
  const [year, setYear] = useState(now.getFullYear());
  const [month, setMonth] = useState(now.getMonth() + 1);
  const [data, setData] = useState<SummaryData | null>(null);

  useEffect(() => {
    fetch(`/api/summary?year=${year}&month=${month}`)
      .then((r) => r.json())
      .then(setData);
  }, [year, month]);

  const goToPrev = () => {
    if (month === 1) { setMonth(12); setYear(year - 1); }
    else setMonth(month - 1);
  };

  const goToNext = () => {
    if (month === 12) { setMonth(1); setYear(year + 1); }
    else setMonth(month + 1);
  };

  const label = `${MONTH_NAMES[month - 1]} ${year}`;

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        <div className="flex items-center gap-2">
          <button
            onClick={goToPrev}
            className="px-2 py-1 rounded text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            ←
          </button>
          <span className="text-sm font-medium min-w-[140px] text-center">{label}</span>
          <button
            onClick={goToNext}
            className="px-2 py-1 rounded text-sm text-muted-foreground hover:bg-accent transition-colors"
          >
            →
          </button>
        </div>
      </div>

      <AuthStatusBanner />

      {data && (
        <>
          <MonthSummaryCard
            income={data.income}
            spent={data.spent}
            saved={data.saved}
            currency={data.currency}
            label={label}
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
