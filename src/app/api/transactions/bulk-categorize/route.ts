import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { transactionIds, categoryId } = body;

  if (!Array.isArray(transactionIds) || !categoryId) {
    return NextResponse.json({ error: "transactionIds and categoryId required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  let count = 0;

  for (const id of transactionIds) {
    db.update(transactions)
      .set({
        categoryId,
        categoryOverride: true,
        updatedAt: now,
      })
      .where(eq(transactions.id, id))
      .run();
    count++;
  }

  return NextResponse.json({ status: "ok", updated: count });
}
