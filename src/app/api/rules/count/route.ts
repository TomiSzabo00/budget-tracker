import { NextRequest, NextResponse } from "next/server";
import { countMatchingTransactions } from "@/lib/categorization";

export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const matchField = searchParams.get("matchField") as "creditor_name" | "debtor_name";
  const matchValue = searchParams.get("matchValue");

  if (!matchField || !matchValue) {
    return NextResponse.json({ error: "matchField and matchValue required" }, { status: 400 });
  }

  const count = countMatchingTransactions(matchField, matchValue);
  return NextResponse.json({ count });
}
