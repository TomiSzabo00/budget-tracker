CREATE TABLE `categories` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`name` text NOT NULL,
	`color` text DEFAULT '#6b7280' NOT NULL,
	`exclude_from_budget` integer DEFAULT false NOT NULL,
	`is_system` integer DEFAULT false NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `categories_name_unique` ON `categories` (`name`);--> statement-breakpoint
CREATE TABLE `categorization_rules` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`match_field` text NOT NULL,
	`match_value` text NOT NULL,
	`category_id` integer NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	FOREIGN KEY (`category_id`) REFERENCES `categories`(`id`) ON UPDATE no action ON DELETE cascade
);
--> statement-breakpoint
CREATE TABLE `session_state` (
	`id` integer PRIMARY KEY NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`session_start_date` text,
	`expired_at` text,
	`last_sync_at` text,
	`message` text
);
--> statement-breakpoint
CREATE TABLE `transactions` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`tx_hash` text NOT NULL,
	`bank_id` text,
	`account_uid` text,
	`amount` real NOT NULL,
	`currency` text DEFAULT 'HUF' NOT NULL,
	`status` text DEFAULT 'booked' NOT NULL,
	`booking_date` text NOT NULL,
	`value_date` text NOT NULL,
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
CREATE UNIQUE INDEX `transactions_tx_hash_unique` ON `transactions` (`tx_hash`);