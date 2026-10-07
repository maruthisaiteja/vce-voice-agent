CREATE TABLE `messages` (
	`id` text PRIMARY KEY NOT NULL,
	`call_id` text NOT NULL,
	`source_id` text NOT NULL,
	`channel` text NOT NULL,
	`status` text NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `verifications` (
	`call_id` text PRIMARY KEY NOT NULL,
	`challenge` text NOT NULL,
	`expires_at` text NOT NULL,
	`verified_at` text,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action
);
