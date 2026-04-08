import { sqliteTable, text, integer, real } from "drizzle-orm/sqlite-core";

export const categories = sqliteTable("categories", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  name: text("name").notNull().unique(),
  color: text("color").notNull().default("#6b7280"),
  excludeFromBudget: integer("exclude_from_budget", { mode: "boolean" }).notNull().default(false),
  isSystem: integer("is_system", { mode: "boolean" }).notNull().default(false),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const transactions = sqliteTable("transactions", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  txHash: text("tx_hash").notNull().unique(),
  bankId: text("bank_id"),
  accountUid: text("account_uid"),
  amount: real("amount").notNull(),
  currency: text("currency").notNull().default("HUF"),
  status: text("status").notNull().default("booked"),
  bookingDate: text("booking_date"),
  valueDate: text("value_date"),
  belongsToMonth: text("belongs_to_month"), // override for summaries, format "YYYY-MM"
  debtorName: text("debtor_name"),
  creditorName: text("creditor_name"),
  reference: text("reference"),
  description: text("description"),
  isSalary: integer("is_salary", { mode: "boolean" }).notNull().default(false),
  categoryId: integer("category_id").references(() => categories.id, { onDelete: "set null" }),
  categoryOverride: integer("category_override", { mode: "boolean" }).notNull().default(false),
  rawPayload: text("raw_payload"),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const categorizationRules = sqliteTable("categorization_rules", {
  id: integer("id").primaryKey({ autoIncrement: true }),
  matchField: text("match_field").notNull(), // "creditor_name" or "debtor_name"
  matchValue: text("match_value").notNull(), // stored lowercase
  categoryId: integer("category_id").notNull().references(() => categories.id, { onDelete: "cascade" }),
  createdAt: text("created_at").notNull().$defaultFn(() => new Date().toISOString()),
  updatedAt: text("updated_at").notNull().$defaultFn(() => new Date().toISOString()),
});

export const sessionState = sqliteTable("session_state", {
  id: integer("id").primaryKey(),
  status: text("status").notNull().default("active"), // "active" or "expired"
  sessionStartDate: text("session_start_date"),
  expiredAt: text("expired_at"),
  lastSyncAt: text("last_sync_at"),
  message: text("message"),
});
