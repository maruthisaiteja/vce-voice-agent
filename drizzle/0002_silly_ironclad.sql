CREATE TABLE `email_directory` (
	`id` text PRIMARY KEY NOT NULL,
	`recipient_name` text DEFAULT '' NOT NULL,
	`email` text DEFAULT '' NOT NULL,
	`source` text DEFAULT '' NOT NULL,
	`verified_by` text,
	`verified_at` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `email_outbox` (
	`id` text PRIMARY KEY NOT NULL,
	`request_id` text NOT NULL,
	`call_id` text,
	`department` text NOT NULL,
	`recipient` text DEFAULT '' NOT NULL,
	`recipient_name` text DEFAULT '' NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`reply_to` text DEFAULT '' NOT NULL,
	`consent` integer DEFAULT 0 NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`detail` text DEFAULT '' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`sent_at` text,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `email_outbox_request_id_unique` ON `email_outbox` (`request_id`);--> statement-breakpoint
CREATE INDEX `idx_email_status` ON `email_outbox` (`status`);