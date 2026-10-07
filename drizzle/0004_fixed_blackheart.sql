CREATE TABLE `voice_budgets` (
	`id` text PRIMARY KEY NOT NULL,
	`uses` integer DEFAULT 1 NOT NULL,
	`expires_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_voice_budgets_expiry` ON `voice_budgets` (`expires_at`);