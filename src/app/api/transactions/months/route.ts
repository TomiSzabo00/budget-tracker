import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  // Effective month: belongsToMonth if set, otherwise first 7 chars of bookingDate
  const effectiveMonth = sql<string>`COALESCE(${transactions.belongsToMonth}, substr(${transactions.bookingDate}, 1, 7))`;

  const results = db
    .select({
      month: effectiveMonth.as("month"),
    })
    .from(transactions)
    .where(sql`${transactions.bookingDate} IS NOT NULL`)
    .groupBy(effectiveMonth)
    .orderBy(sql`${effectiveMonth} DESC`)
    .all();

  return NextResponse.json(results.map((r) => r.month).filter(Boolean));
}
