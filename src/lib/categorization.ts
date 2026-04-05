import { db } from "@/db";
import { categorizationRules, transactions } from "@/db/schema";
import { eq, like } from "drizzle-orm";

/**
 * Find matching rule for a transaction and return the category ID.
 * Rules match case-insensitively on creditor_name (expenses) or debtor_name (income).
 */
export function findMatchingRule(
  creditorName: string | null,
  debtorName: string | null,
  amount: number
): number | null {
  const allRules = db.select().from(categorizationRules).all();

  for (const rule of allRules) {
    const fieldValue = rule.matchField === "creditor_name" ? creditorName : debtorName;
    if (!fieldValue) continue;

    if (fieldValue.toLowerCase().includes(rule.matchValue.toLowerCase())) {
      return rule.categoryId;
    }
  }

  return null;
}

/**
 * Count transactions that match a rule pattern.
 */
export function countMatchingTransactions(
  matchField: "creditor_name" | "debtor_name",
  matchValue: string
): number {
  const column = matchField === "creditor_name" ? transactions.creditorName : transactions.debtorName;
  const results = db
    .select()
    .from(transactions)
    .where(like(column, `%${matchValue}%`))
    .all();

  // Case-insensitive filter
  return results.filter((t) => {
    const val = matchField === "creditor_name" ? t.creditorName : t.debtorName;
    return val?.toLowerCase().includes(matchValue.toLowerCase());
  }).length;
}

/**
 * Apply a rule retroactively to all matching transactions that don't have a manual override.
 */
export function applyRuleRetroactively(
  matchField: "creditor_name" | "debtor_name",
  matchValue: string,
  categoryId: number
): number {
  const column = matchField === "creditor_name" ? transactions.creditorName : transactions.debtorName;
  const matching = db
    .select()
    .from(transactions)
    .where(like(column, `%${matchValue}%`))
    .all();

  let count = 0;
  const now = new Date().toISOString();

  for (const tx of matching) {
    const val = matchField === "creditor_name" ? tx.creditorName : tx.debtorName;
    if (val?.toLowerCase().includes(matchValue.toLowerCase()) && !tx.categoryOverride) {
      db.update(transactions)
        .set({ categoryId, updatedAt: now })
        .where(eq(transactions.id, tx.id))
        .run();
      count++;
    }
  }

  return count;
}
