import { NextResponse } from "next/server";
import { db } from "@/db";
import { transactions } from "@/db/schema";
import { sql } from "drizzle-orm";

export async function GET() {
  // Get distinct year-month combinations that have transactions
  const results = db
    .select({
      month: sql<string>`substr(${transactions.bookingDate}, 1, 7)`.as("month"),
    })
    .from(transactions)
    .where(sql`${transactions.bookingDate} IS NOT NULL`)
    .groupBy(sql`substr(${transactions.bookingDate}, 1, 7)`)
    .orderBy(sql`substr(${transactions.bookingDate}, 1, 7) DESC`)
    .all();

  return NextResponse.json(results.map((r) => r.month).filter(Boolean));
}
