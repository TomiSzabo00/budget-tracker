import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { transactions, sessionState, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { verifyWebhookSignature } from "@/lib/webhook";
import { findMatchingRule } from "@/lib/categorization";
import type { NewTransactionData } from "@/types";

export async function POST(request: NextRequest) {
  const secret = process.env.WEBHOOK_SECRET;
  if (!secret) {
    return NextResponse.json({ error: "Server misconfigured" }, { status: 500 });
  }

  const rawBody = await request.text();
  const signature = request.headers.get("x-bank-signature");

  if (!signature) {
    return NextResponse.json({ error: "Missing signature" }, { status: 401 });
  }

  try {
    if (!verifyWebhookSignature(rawBody, signature, secret)) {
      return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
    }
  } catch {
    return NextResponse.json({ error: "Invalid signature" }, { status: 401 });
  }

  const payload = JSON.parse(rawBody);
  const { event } = payload;

  switch (event) {
    case "new_transaction":
      return handleNewTransaction(payload.data);
    case "sync_completed":
      return handleSyncCompleted(payload);
    case "auth_required":
      return handleAuthRequired(payload);
    default:
      return NextResponse.json({ status: "ignored", event }, { status: 200 });
  }
}

async function handleNewTransaction(data: NewTransactionData) {
  const now = new Date().toISOString();

  // Get default "Uncategorized" category
  const uncategorized = db
    .select()
    .from(categories)
    .where(eq(categories.name, "Uncategorized"))
    .get();

  // Check for auto-categorization rule
  const matchedCategoryId = findMatchingRule(
    data.creditor_name,
    data.debtor_name,
    data.amount
  );

  const categoryId = matchedCategoryId ?? uncategorized?.id ?? null;

  // Upsert: insert or update on tx_hash conflict
  const existing = db
    .select()
    .from(transactions)
    .where(eq(transactions.txHash, data.tx_hash))
    .get();

  if (existing) {
    // Update but preserve category override
    db.update(transactions)
      .set({
        status: data.status,
        bookingDate: data.booking_date,
        valueDate: data.value_date,
        debtorName: data.debtor_name,
        creditorName: data.creditor_name,
        reference: data.reference,
        description: data.description,
        updatedAt: now,
        // Only update category if no manual override
        ...(existing.categoryOverride ? {} : { categoryId }),
      })
      .where(eq(transactions.txHash, data.tx_hash))
      .run();
  } else {
    db.insert(transactions)
      .values({
        txHash: data.tx_hash,
        bankId: data.bank_id,
        accountUid: data.account_uid,
        amount: data.amount,
        currency: data.currency,
        status: data.status,
        bookingDate: data.booking_date,
        valueDate: data.value_date,
        debtorName: data.debtor_name,
        creditorName: data.creditor_name,
        reference: data.reference,
        description: data.description,
        isSalary: data.is_salary,
        categoryId,
        categoryOverride: false,
        createdAt: now,
        updatedAt: now,
      })
      .run();
  }

  return NextResponse.json({ status: "ok", action: existing ? "updated" : "created" });
}

async function handleSyncCompleted(payload: { account_uid?: string; new_transactions?: number }) {
  const now = new Date().toISOString();

  // Update session: mark active, update last sync time
  db.update(sessionState)
    .set({
      lastSyncAt: now,
      status: "active",
      message: null,
    })
    .where(eq(sessionState.id, 1))
    .run();

  return NextResponse.json({
    status: "ok",
    new_transactions: payload.new_transactions,
  });
}

async function handleAuthRequired(payload: { message?: string }) {
  const now = new Date().toISOString();

  db.update(sessionState)
    .set({
      status: "expired",
      expiredAt: now,
      message: payload.message ?? "Banking session expired. Re-authentication required.",
    })
    .where(eq(sessionState.id, 1))
    .run();

  return NextResponse.json({ status: "ok" });
}
