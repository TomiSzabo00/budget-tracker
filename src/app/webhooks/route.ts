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
  const bookingDate = data.booking_date || data.value_date || null;
  const valueDate = data.value_date || data.booking_date || null;

  // Normalize schema: support both new nested and old flat structures
  const rawAmount = data.transaction_amount?.amount ?? data.amount ?? 0;
  const currency = data.transaction_amount?.currency ?? data.currency ?? "HUF";
  const bankId = data.transaction_id ?? data.bank_id ?? null;
  const debtorName = data.debtor?.name ?? data.debtor_name ?? null;
  const creditorName = data.creditor?.name ?? data.creditor_name ?? null;
  const reference =
    data.remittance_information?.[0] ??
    data.entry_reference ??
    data.reference ??
    null;
  const description = reference ?? data.description ?? null;

  // Normalize status: "BOOK" → "booked", "PDNG" → "pending"
  const status =
    data.status === "BOOK" ? "booked" :
    data.status === "PDNG" ? "pending" :
    data.status;

  // Determine sign: debtor present = incoming (positive), creditor present = outgoing (negative)
  // If already signed (old schema), preserve the sign
  let amount: number;
  if (data.amount !== undefined) {
    // Old schema already has correct sign
    amount = data.amount;
  } else {
    // New schema: positive amount, determine direction from debtor/creditor
    amount = debtorName ? rawAmount : -rawAmount;
  }

  // Get default "Uncategorized" category
  const uncategorized = db
    .select()
    .from(categories)
    .where(eq(categories.name, "Uncategorized"))
    .get();

  // Check for auto-categorization rule
  const matchedCategoryId = findMatchingRule(creditorName, debtorName, amount);
  const categoryId = matchedCategoryId ?? uncategorized?.id ?? null;

  // Upsert: insert or update on tx_hash conflict
  const existing = db
    .select()
    .from(transactions)
    .where(eq(transactions.txHash, data.tx_hash))
    .get();

  if (existing) {
    // Update but preserve category override and raw payload
    db.update(transactions)
      .set({
        status,
        bookingDate,
        valueDate,
        debtorName,
        creditorName,
        reference,
        description,
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
        bankId,
        accountUid: data.account_uid,
        amount,
        currency,
        status,
        bookingDate,
        valueDate,
        debtorName,
        creditorName,
        reference,
        description,
        isSalary: data.is_salary,
        categoryId,
        categoryOverride: false,
        rawPayload: JSON.stringify(data),
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
