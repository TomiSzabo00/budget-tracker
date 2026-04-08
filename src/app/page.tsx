"use client";

import { useEffect, useState } from "react";
import { AuthStatusBanner } from "@/components/dashboard/auth-status-banner";
import { MonthSummaryCard } from "@/components/dashboard/month-summary-card";
import { CategoryDonutChart } from "@/components/dashboard/category-donut-chart";
import { CategorySpendingList } from "@/components/dashboard/category-spending-list";
import { TaxSummary } from "@/components/dashboard/tax-summary";
import { YearlySummary } from "@/components/dashboard/yearly-summary";
import { PageHeader } from "@/components/page-header";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { EmptyState } from "@/components/empty-state";
import { Receipt } from "lucide-react";
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
  const [showInvestment, setShowInvestment] = useState(true);

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
  const filteredBreakdown = data?.categoryBreakdown.filter(
    (c) => showInvestment || c.categoryName !== "Investment"
  ) ?? [];

  // Compute date range for linking to transactions
  function getMonthRange(ym: string): { dateFrom: string; dateTo: string } {
    const [y, m] = ym.split("-").map(Number);
    const dateFrom = `${y}-${String(m).padStart(2, "0")}-01`;
    const lastDay = new Date(y, m, 0).getDate();
    const dateTo = `${y}-${String(m).padStart(2, "0")}-${String(lastDay).padStart(2, "0")}`;
    return { dateFrom, dateTo };
  }

  const monthRange = selected ? getMonthRange(selected) : undefined;

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <PageHeader title="Dashboard">
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-2">
            <Switch
              id="show-investment-header"
              checked={showInvestment}
              onCheckedChange={setShowInvestment}
            />
            <Label htmlFor="show-investment-header" className="text-xs text-muted-foreground cursor-pointer whitespace-nowrap">
              Show investments
            </Label>
          </div>
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
      </PageHeader>

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
              data={filteredBreakdown}
              currency={data.currency}
              dateFrom={monthRange?.dateFrom}
              dateTo={monthRange?.dateTo}
            />
            <CategoryDonutChart
              data={filteredBreakdown}
              currency={data.currency}
              dateFrom={monthRange?.dateFrom}
              dateTo={monthRange?.dateTo}
            />
          </div>

          <TaxSummary data={data.taxSummary} currency={data.currency} />
        </>
      ) : (
        !data && availableMonths.length === 0 && (
          <EmptyState
            icon={<Receipt />}
            title="No transactions yet"
            description="Connect your bank account to start tracking your budget."
          />
        )
      )}

      <YearlySummary showInvestment={showInvestment} />
    </div>
  );
}
