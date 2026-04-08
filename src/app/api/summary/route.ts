import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, categories } from "@/db/schema";
import { eq, and, gte, lte, lt, gt, sql } from "drizzle-orm";

// Effective month: belongsToMonth if set, otherwise first 7 chars of bookingDate
const effectiveMonth = sql<string>`COALESCE(${transactions.belongsToMonth}, substr(${transactions.bookingDate}, 1, 7))`;

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const year = Number(searchParams.get("year")) || new Date().getFullYear();
  const month = searchParams.get("month"); // optional, 1-12

  const yearStr = String(year);
  const targetMonth = month ? `${yearStr}-${String(month).padStart(2, "0")}` : null;

  // Get all categories
  const allCategories = db.select().from(categories).all();
  const excludedIds = allCategories.filter((c) => c.excludeFromBudget).map((c) => c.id);
  const taxCategory = allCategories.find((c) => c.name === "Tax");
  const investmentCategory = allCategories.find((c) => c.name === "Investment");
  const investmentId = investmentCategory?.id ?? -1;

  // Get transactions in range using effective month
  const allTxs = targetMonth
    ? db.select().from(transactions).where(sql`${effectiveMonth} = ${targetMonth}`).all()
    : db.select().from(transactions).where(sql`${effectiveMonth} >= ${yearStr + '-01'} AND ${effectiveMonth} <= ${yearStr + '-12'}`).all();

  // Filter out excluded categories entirely — treat them as if they don't exist
  const txs = allTxs.filter((t) => !excludedIds.includes(t.categoryId ?? -1));

  // Monthly summary — Investment is separate from spent
  const income = txs.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const invested = txs
    .filter((t) => t.amount < 0 && t.categoryId === investmentId)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const spent = txs
    .filter((t) => t.amount < 0 && t.categoryId !== investmentId)
    .reduce((sum, t) => sum + Math.abs(t.amount), 0);
  const saved = income - spent;

  // Category breakdown (expenses only — txs already excludes budget-excluded categories)
  const categoryBreakdown = allCategories
    .filter((c) => !c.excludeFromBudget)
    .map((cat) => {
      const total = txs
        .filter((t) => t.amount < 0 && t.categoryId === cat.id)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0);
      return {
        categoryId: cat.id,
        categoryName: cat.name,
        categoryColor: cat.color,
        total,
        percentage: 0,
      };
    })
    .filter((c) => c.total > 0);

  const totalExpenses = categoryBreakdown.reduce((sum, c) => sum + c.total, 0);
  for (const c of categoryBreakdown) {
    c.percentage = totalExpenses > 0 ? Math.round((c.total / totalExpenses) * 1000) / 10 : 0;
  }

  // Tax summary (always yearly)
  const allYearTxs = targetMonth
    ? db.select().from(transactions).where(sql`${effectiveMonth} >= ${yearStr + '-01'} AND ${effectiveMonth} <= ${yearStr + '-12'}`).all()
    : allTxs;
  const yearTxs = allYearTxs.filter((t) => !excludedIds.includes(t.categoryId ?? -1));

  const totalTaxPaid = taxCategory
    ? yearTxs
        .filter((t) => t.categoryId === taxCategory.id && t.amount < 0)
        .reduce((sum, t) => sum + Math.abs(t.amount), 0)
    : 0;
  const totalYearIncome = yearTxs.filter((t) => t.amount > 0).reduce((sum, t) => sum + t.amount, 0);
  const taxRate = totalYearIncome > 0 ? Math.round((totalTaxPaid / totalYearIncome) * 1000) / 10 : 0;

  // Monthly data for bar chart (only when requesting yearly)
  const monthlyData = [];
  if (!targetMonth) {
    for (let m = 1; m <= 12; m++) {
      const ym = `${yearStr}-${String(m).padStart(2, "0")}`;
      const monthTxs = txs.filter((t) => {
        const em = t.belongsToMonth || (t.bookingDate ? t.bookingDate.substring(0, 7) : null);
        return em === ym;
      });
      const mIncome = monthTxs.filter((t) => t.amount > 0).reduce((s, t) => s + t.amount, 0);
      const mExpenses = monthTxs
        .filter((t) => t.amount < 0 && t.categoryId !== investmentId)
        .reduce((s, t) => s + Math.abs(t.amount), 0);

      monthlyData.push({
        month: ym,
        income: Math.round(mIncome),
        expenses: Math.round(mExpenses),
      });
    }
  }

  // Determine dominant currency
  const currencies = txs.map((t) => t.currency);
  const currency = currencies.length > 0
    ? currencies.sort((a, b) => currencies.filter((c) => c === a).length - currencies.filter((c) => c === b).length).pop() || "HUF"
    : "HUF";

  return NextResponse.json({
    income: Math.round(income),
    spent: Math.round(spent),
    saved: Math.round(saved),
    invested: Math.round(invested),
    currency,
    categoryBreakdown: categoryBreakdown.sort((a, b) => b.total - a.total),
    taxSummary: { totalTaxPaid: Math.round(totalTaxPaid), totalIncome: Math.round(totalYearIncome), taxRate },
    monthlyData,
  });
}

function getLastDayOfMonth(year: number, month: number): string {
  const d = new Date(year, month, 0);
  return `${year}-${String(month).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
}
