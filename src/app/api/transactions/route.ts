import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, categories } from "@/db/schema";
import { eq, desc, asc, and, gte, lte, like, lt, gt, sql } from "drizzle-orm";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);

  const page = Math.max(1, Number(searchParams.get("page")) || 1);
  const limit = Math.min(100, Math.max(1, Number(searchParams.get("limit")) || 50));
  const offset = (page - 1) * limit;

  const search = searchParams.get("search");
  const categoryId = searchParams.get("categoryId");
  const dateFrom = searchParams.get("dateFrom");
  const dateTo = searchParams.get("dateTo");
  const type = searchParams.get("type"); // "income" | "expense"
  const uncategorizedOnly = searchParams.get("uncategorizedOnly") === "true";
  const sortBy = searchParams.get("sortBy") || "bookingDate";
  const sortDir = searchParams.get("sortDir") || "desc";

  const conditions = [];

  if (search) {
    conditions.push(
      sql`(${transactions.description} LIKE ${"%" + search + "%"} OR ${transactions.creditorName} LIKE ${"%" + search + "%"} OR ${transactions.debtorName} LIKE ${"%" + search + "%"} OR ${transactions.reference} LIKE ${"%" + search + "%"})`
    );
  }

  if (categoryId) {
    conditions.push(eq(transactions.categoryId, Number(categoryId)));
  }

  if (dateFrom) {
    conditions.push(gte(transactions.bookingDate, dateFrom));
  }

  if (dateTo) {
    conditions.push(lte(transactions.bookingDate, dateTo));
  }

  if (type === "income") {
    conditions.push(gt(transactions.amount, 0));
  } else if (type === "expense") {
    conditions.push(lt(transactions.amount, 0));
  }

  if (uncategorizedOnly) {
    const uncategorized = db
      .select()
      .from(categories)
      .where(eq(categories.name, "Uncategorized"))
      .get();
    if (uncategorized) {
      conditions.push(eq(transactions.categoryId, uncategorized.id));
    }
  }

  const where = conditions.length > 0 ? and(...conditions) : undefined;

  const sortColumn =
    sortBy === "amount" ? transactions.amount :
    sortBy === "status" ? transactions.status :
    transactions.bookingDate;

  const orderFn = sortDir === "asc" ? asc : desc;

  const results = db
    .select({
      id: transactions.id,
      txHash: transactions.txHash,
      bankId: transactions.bankId,
      accountUid: transactions.accountUid,
      amount: transactions.amount,
      currency: transactions.currency,
      status: transactions.status,
      bookingDate: transactions.bookingDate,
      valueDate: transactions.valueDate,
      debtorName: transactions.debtorName,
      creditorName: transactions.creditorName,
      reference: transactions.reference,
      description: transactions.description,
      isSalary: transactions.isSalary,
      categoryId: transactions.categoryId,
      categoryOverride: transactions.categoryOverride,
      rawPayload: transactions.rawPayload,
      createdAt: transactions.createdAt,
      updatedAt: transactions.updatedAt,
      categoryName: categories.name,
      categoryColor: categories.color,
    })
    .from(transactions)
    .leftJoin(categories, eq(transactions.categoryId, categories.id))
    .where(where)
    .orderBy(orderFn(sortColumn))
    .limit(limit)
    .offset(offset)
    .all();

  // Get total count
  const countResult = db
    .select({ count: sql<number>`count(*)` })
    .from(transactions)
    .where(where)
    .get();

  return NextResponse.json({
    data: results,
    total: countResult?.count ?? 0,
    page,
    limit,
    totalPages: Math.ceil((countResult?.count ?? 0) / limit),
  });
}
