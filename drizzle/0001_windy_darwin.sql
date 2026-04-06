PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tx_hash` text NOT NULL,
	`bank_id` text,
	`account_uid` text,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'HUF' NOT NULL,
	`status` text DEFAULT 'booked' NOT NULL,
	`booking_date` text,
	`value_date` text,
	`debtor_name` text,
	`creditor_name` text,
	`reference` text,
	`description` text,
	`is_salary` integer DEFAULT false NOT NULL,
	`category_id` integer,
	`category_override` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE set null
);
--> statement-breakpoint
INSERT INTO `__new_transactions`("id", "tx_hash", "bank_id", "account_uid", "amount", "currency", "status", "booking_date", "value_date", "debtor_name", "creditor_name", "reference", "description", "is_salary", "category_id", "category_override", "created_at", "updated_at") SELECT "id", "tx_hash", "bank_id", "account_uid", "amount", "currency", "status", "booking_date", "value_date", "debtor_name", "creditor_name", "reference", "description", "is_salary", "category_id", "category_override", "created_at", "updated_at" FROM `transactions`;--> statement-breakpoint
DROP TABLE `transactions`;--> statement-breakpoint
ALTER TABLE `__new_transactions` RENAME TO `transactions`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE UNIQUE INDEX `transactions_tx_hash_unique` ON `transactions` (`tx_hash`);