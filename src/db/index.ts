import Database from "better-sqlite3";
import { drizzle } from "drizzle-orm/better-sqlite3";
import { migrate } from "drizzle-orm/better-sqlite3/migrator";
import * as schema from "./schema";
import path from "path";
import fs from "fs";

const dataDir = process.env.DATA_DIR || process.cwd();
const dbPath = path.join(dataDir, "budget-tracker.db");

let _db: ReturnType<typeof drizzle<typeof schema>> | null = null;

function getMigrationsFolder() {
  // In standalone mode, drizzle/ is copied to .next/standalone/drizzle
  const candidates = [
    path.join(process.cwd(), "drizzle"),
    path.join(__dirname, "../../drizzle"),
    path.join(__dirname, "../../../drizzle"),
  ];
  for (const dir of candidates) {
    if (fs.existsSync(dir)) return dir;
  }
  return "./drizzle";
}

export function getDb() {
  if (!_db) {
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const sqlite = new Database(dbPath);
    sqlite.pragma("journal_mode = WAL");
    sqlite.pragma("foreign_keys = ON");
    _db = drizzle(sqlite, { schema });

    // Auto-run pending migrations on first connection
    try {
      migrate(_db, { migrationsFolder: getMigrationsFolder() });
    } catch (e) {
      console.error("Migration warning:", e);
    }
  }
  return _db;
}

export const db = new Proxy({} as ReturnType<typeof drizzle<typeof schema>>, {
  get(_target, prop) {
    return (getDb() as unknown as Record<string | symbol, unknown>)[prop];
  },
});

export type DB = ReturnType<typeof getDb>;
