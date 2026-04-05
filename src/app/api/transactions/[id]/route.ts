import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, categorizationRules } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function PATCH(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: idStr } = await params;
  const id = Number(idStr);
  const body = await request.json();
  const { categoryId, createRule } = body;

  const tx = db.select().from(transactions).where(eq(transactions.id, id)).get();
  if (!tx) {
    return NextResponse.json({ error: "Transaction not found" }, { status: 404 });
  }

  const now = new Date().toISOString();

  db.update(transactions)
    .set({
      categoryId,
      categoryOverride: true,
      updatedAt: now,
    })
    .where(eq(transactions.id, id))
    .run();

  if (createRule && categoryId) {
    const isExpense = tx.amount < 0;
    const matchField = isExpense ? "creditor_name" : "debtor_name";
    const matchValue = (isExpense ? tx.creditorName : tx.debtorName)?.toLowerCase();

    if (matchValue) {
      const existingRule = db
        .select()
        .from(categorizationRules)
        .where(eq(categorizationRules.matchValue, matchValue))
        .get();

      if (existingRule) {
        db.update(categorizationRules)
          .set({ categoryId, matchField, updatedAt: now })
          .where(eq(categorizationRules.id, existingRule.id))
          .run();
      } else {
        db.insert(categorizationRules)
          .values({
            matchField,
            matchValue,
            categoryId,
            createdAt: now,
            updatedAt: now,
          })
          .run();
      }
    }
  }

  return NextResponse.json({ status: "ok" });
}
