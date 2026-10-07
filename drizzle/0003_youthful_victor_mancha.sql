ALTER TABLE `email_directory` ADD `verified_until` text;--> statement-breakpoint
ALTER TABLE `email_outbox` ADD `reviewed_by` text;--> statement-breakpoint
ALTER TABLE `email_outbox` ADD `reviewed_at` text;--> statement-breakpoint
ALTER TABLE `email_outbox` ADD `recipient_verified_at` text;