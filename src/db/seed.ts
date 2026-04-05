import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import { categories, sessionState } from "./schema";
import { eq } from "drizzle-orm";
import path from "path";

const dbPath = path.join(process.cwd(), "budget-tracker.db");
const sqlite = new Database(dbPath);
sqlite.pragma("journal_mode = WAL");
sqlite.pragma("foreign_keys = ON");
const db = drizzle(sqlite);

// Run migrations
migrate(db, { migrationsFolder: "./drizzle" });

// Seed default categories
const defaultCategories = [
  { name: "Uncategorized", color: "#9ca3af", excludeFromBudget: false, isSystem: true },
  { name: "Tax", color: "#ef4444", excludeFromBudget: false, isSystem: true },
];

for (const cat of defaultCategories) {
  const existing = db.select().from(categories).where(eq(categories.name, cat.name)).get();
  if (!existing) {
    db.insert(categories).values(cat).run();
  }
}

// Seed session state (single row)
const existingSession = db.select().from(sessionState).where(eq(sessionState.id, 1)).get();
if (!existingSession) {
  db.insert(sessionState).values({
    id: 1,
    status: "active",
    sessionStartDate: new Date().toISOString().split("T")[0],
  }).run();
}

console.log("✅ Database seeded successfully");
sqlite.close();
