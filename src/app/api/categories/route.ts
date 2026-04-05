import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { categories } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const all = db.select().from(categories).all();
  return NextResponse.json(all);
}

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { name, color, excludeFromBudget } = body;

  if (!name || typeof name !== "string") {
    return NextResponse.json({ error: "Name is required" }, { status: 400 });
  }

  try {
    const result = db
      .insert(categories)
      .values({
        name: name.trim(),
        color: color || "#6b7280",
        excludeFromBudget: excludeFromBudget ?? false,
        isSystem: false,
      })
      .returning()
      .get();

    return NextResponse.json(result, { status: 201 });
  } catch (e: unknown) {
    const message = e instanceof Error ? e.message : "Unknown error";
    if (message.includes("UNIQUE")) {
      return NextResponse.json({ error: "Category name already exists" }, { status: 409 });
    }
    return NextResponse.json({ error: message }, { status: 500 });
  }
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { id, name, color, excludeFromBudget } = body;

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const existing = db.select().from(categories).where(eq(categories.id, id)).get();
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  // Cannot rename system categories
  if (existing.isSystem && name && name !== existing.name) {
    return NextResponse.json({ error: "Cannot rename system categories" }, { status: 400 });
  }

  const result = db
    .update(categories)
    .set({
      ...(name ? { name: name.trim() } : {}),
      ...(color ? { color } : {}),
      ...(excludeFromBudget !== undefined ? { excludeFromBudget } : {}),
    })
    .where(eq(categories.id, id))
    .returning()
    .get();

  return NextResponse.json(result);
}

export async function DELETE(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const id = Number(searchParams.get("id"));

  if (!id) {
    return NextResponse.json({ error: "ID is required" }, { status: 400 });
  }

  const existing = db.select().from(categories).where(eq(categories.id, id)).get();
  if (!existing) {
    return NextResponse.json({ error: "Category not found" }, { status: 404 });
  }

  if (existing.isSystem) {
    return NextResponse.json({ error: "Cannot delete system categories" }, { status: 400 });
  }

  db.delete(categories).where(eq(categories.id, id)).run();
  return NextResponse.json({ status: "deleted" });
}
