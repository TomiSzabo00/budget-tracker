"use client";

import { useEffect, useState } from "react";
import { AuthStatusBanner } from "@/components/dashboard/auth-status-banner";
import { MonthSummaryCard } from "@/components/dashboard/month-summary-card";
import { CategoryDonutChart } from "@/components/dashboard/category-donut-chart";
import { CategorySpendingList } from "@/components/dashboard/category-spending-list";
import { TaxSummary } from "@/components/dashboard/tax-summary";
import { YearlySummary } from "@/components/dashboard/yearly-summary";
import type { CategoryBreakdown, TaxSummary as TaxSummaryType } from "@/types";

interface SummaryData {
  income: number;
  spent: number;
  saved: number;
  invested: number;
  currency: string;
  categoryBreakdown: CategoryBreakdown[];
  taxSummary: TaxSummaryType;
}

const MONTH_NAMES = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

function formatMonthLabel(ym: string) {
  const [y, m] = ym.split("-");
  return `${MONTH_NAMES[Number(m) - 1]} ${y}`;
}

export default function DashboardPage() {
  const [availableMonths, setAvailableMonths] = useState<string[]>([]);
  const [selected, setSelected] = useState<string>("");
  const [data, setData] = useState<SummaryData | null>(null);

  // Fetch available months on mount
  useEffect(() => {
    fetch("/api/transactions/months")
      .then((r) => r.json())
      .then((months: string[]) => {
        setAvailableMonths(months);
        if (months.length > 0 && !selected) {
          setSelected(months[0]); // most recent
        }
      });
  }, []); // eslint-disable-line react-hooks/exhaustive-deps

  // Fetch summary when selection changes
  useEffect(() => {
    if (!selected) return;
    const [y, m] = selected.split("-");
    fetch(`/api/summary?year=${y}&month=${Number(m)}`)
      .then((r) => r.json())
      .then(setData);
  }, [selected]);

  const label = selected ? formatMonthLabel(selected) : "";

  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Dashboard</h1>
        {availableMonths.length > 0 && (
          <select
            value={selected}
            onChange={(e) => setSelected(e.target.value)}
            className="text-sm font-medium border rounded-md px-3 py-1.5 bg-background text-foreground cursor-pointer hover:bg-accent transition-colors"
          >
            {availableMonths.map((ym) => (
              <option key={ym} value={ym}>{formatMonthLabel(ym)}</option>
            ))}
          </select>
        )}
      </div>

      <AuthStatusBanner />

      {data && selected ? (
        <>
          <MonthSummaryCard
            income={data.income}
            spent={data.spent}
            saved={data.saved}
            invested={data.invested}
            currency={data.currency}
            label={label}
          />

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <CategorySpendingList
              data={data.categoryBreakdown}
              currency={data.currency}
            />
            <CategoryDonutChart
              data={data.categoryBreakdown}
              currency={data.currency}
            />
          </div>

          <TaxSummary data={data.taxSummary} currency={data.currency} />
        </>
      ) : (
        !data && availableMonths.length === 0 && (
          <p className="text-muted-foreground">No transactions yet</p>
        )
      )}

      <YearlySummary />
    </div>
  );
}
