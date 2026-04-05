import { NextRequest, NextResponse } from "next/server";
import { db } from "@/db";
import { sessionState } from "@/db/schema";
import { eq } from "drizzle-orm";

export async function GET() {
  const session = db.select().from(sessionState).where(eq(sessionState.id, 1)).get();

  if (!session) {
    return NextResponse.json({
      status: "active",
      daysRemaining: 90,
      sessionStartDate: null,
      lastSyncAt: null,
      message: null,
    });
  }

  let daysRemaining = 90;
  if (session.sessionStartDate) {
    const start = new Date(session.sessionStartDate);
    const now = new Date();
    const elapsed = Math.floor((now.getTime() - start.getTime()) / (1000 * 60 * 60 * 24));
    daysRemaining = Math.max(0, 90 - elapsed);
  }

  return NextResponse.json({
    status: session.status,
    daysRemaining,
    sessionStartDate: session.sessionStartDate,
    lastSyncAt: session.lastSyncAt,
    expiredAt: session.expiredAt,
    message: session.message,
  });
}

export async function PUT(request: NextRequest) {
  const body = await request.json();
  const { sessionStartDate, status } = body;

  const now = new Date().toISOString();

  db.update(sessionState)
    .set({
      ...(sessionStartDate ? { sessionStartDate } : {}),
      ...(status ? { status } : {}),
      ...(status === "active" ? { expiredAt: null, message: null } : {}),
    })
    .where(eq(sessionState.id, 1))
    .run();

  return NextResponse.json({ status: "ok" });
}
