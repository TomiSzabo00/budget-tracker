import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categorizationRules, categories } from "@/db/schema";
import { eq } from "drizzle-orm";
import { countMatchingTransactions, applyRuleRetroactively } from "@/lib/categorization";

export async function GET() {
  const rules = db
    .select({
      id: categorizationRules.id,
      matchField: categorizationRules.matchField,
      matchValue: categorizationRules.matchValue,
      categoryId: categorizationRules.categoryId,
      categoryName: categories.name,
      categoryColor: categories.color,
      createdAt: categorizationRules.createdAt,
      updatedAt: categorizationRules.updatedAt,
    })
    .from(categorizationRules)
    .leftJoin(categories, eq(categorizationRules.categoryId, categories.id))
    .all();

  return NextResponse.json(rules);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { matchField, matchValue, categoryId, applyRetroactively } = body;

  if (!matchField || !matchValue || !categoryId) {
    return NextResponse.json({ error: "matchField, matchValue, and categoryId required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const rule = db
    .insert(categorizationRules)
    .values({
      matchField,
      matchValue: matchValue.toLowerCase(),
      categoryId,
      createdAt: now,
      updatedAt: now,
    })
    .returning()
    .get();

  let affected = 0;
  if (applyRetroactively) {
    affected = applyRuleRetroactively(matchField, matchValue.toLowerCase(), categoryId);
  }

  return NextResponse.json({ rule, affected }, { status: 201 });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, matchField, matchValue, categoryId, applyRetroactively } = body;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const now = new Date().toISOString();
  const rule = db
    .update(categorizationRules)
    .set({
      ...(matchField ? { matchField } : {}),
      ...(matchValue ? { matchValue: matchValue.toLowerCase() } : {}),
      ...(categoryId ? { categoryId } : {}),
      updatedAt: now,
    })
    .where(eq(categorizationRules.id, id))
    .returning()
    .get();

  let affected = 0;
  if (applyRetroactively && rule) {
    affected = applyRuleRetroactively(
      rule.matchField as "creditor_name" | "debtor_name",
      rule.matchValue,
      rule.categoryId
    );
  }

  return NextResponse.json({ rule, affected });
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  db.delete(categorizationRules).where(eq(categorizationRules.id, id)).run();
  return NextResponse.json({ status: "deleted" });
}
