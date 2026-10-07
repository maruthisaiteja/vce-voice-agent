CREATE TABLE `audit` (
	`id` text PRIMARY KEY NOT NULL,
	`actor` text NOT NULL,
	`action` text NOT NULL,
	`entity_id` text NOT NULL,
	`detail` text NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `calls` (
	`id` text PRIMARY KEY NOT NULL,
	`channel` text NOT NULL,
	`language` text DEFAULT 'en' NOT NULL,
	`status` text DEFAULT 'active' NOT NULL,
	`department` text DEFAULT 'general' NOT NULL,
	`started_at` text NOT NULL,
	`ended_at` text,
	`consent` integer DEFAULT 0 NOT NULL,
	`feedback` integer,
	`review_status` text DEFAULT 'unreviewed' NOT NULL,
	`review_note` text DEFAULT '' NOT NULL,
	`recording_key` text,
	`summary` text DEFAULT '' NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_calls_started` ON `calls` (`started_at`);--> statement-breakpoint
CREATE TABLE `departments` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`target` text DEFAULT '' NOT NULL,
	`hours` text DEFAULT '09:00–17:00' NOT NULL,
	`days` text DEFAULT '1,2,3,4,5' NOT NULL,
	`enabled` integer DEFAULT 0 NOT NULL
);
--> statement-breakpoint
CREATE TABLE `evaluations` (
	`id` text PRIMARY KEY NOT NULL,
	`created_at` text NOT NULL,
	`passed` integer NOT NULL,
	`total` integer NOT NULL,
	`results` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `events` (
	`id` text PRIMARY KEY NOT NULL,
	`result` text DEFAULT 'processing' NOT NULL,
	`created_at` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `knowledge` (
	`id` text PRIMARY KEY NOT NULL,
	`title` text NOT NULL,
	`department` text NOT NULL,
	`topic` text NOT NULL,
	`question` text NOT NULL,
	`answer` text NOT NULL,
	`answer_te` text DEFAULT '' NOT NULL,
	`answer_hi` text DEFAULT '' NOT NULL,
	`source` text NOT NULL,
	`status` text DEFAULT 'draft' NOT NULL,
	`access` text DEFAULT 'public' NOT NULL,
	`effective_from` text NOT NULL,
	`expires_on` text NOT NULL,
	`approved_by` text,
	`approved_at` text,
	`updated_at` text NOT NULL
);
--> statement-breakpoint
CREATE INDEX `idx_knowledge_topic_status` ON `knowledge` (`topic`,`status`);--> statement-breakpoint
CREATE TABLE `settings` (
	`id` text PRIMARY KEY NOT NULL,
	`value` text NOT NULL
);
--> statement-breakpoint
CREATE TABLE `tickets` (
	`id` text PRIMARY KEY NOT NULL,
	`call_id` text,
	`department` text NOT NULL,
	`category` text NOT NULL,
	`summary` text NOT NULL,
	`status` text DEFAULT 'open' NOT NULL,
	`created_at` text NOT NULL,
	`updated_at` text NOT NULL,
	`callback_at` text,
	`contact` text DEFAULT '' NOT NULL,
	`priority` text DEFAULT 'normal' NOT NULL,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_tickets_status` ON `tickets` (`status`);--> statement-breakpoint
CREATE TABLE `turns` (
	`id` text PRIMARY KEY NOT NULL,
	`call_id` text NOT NULL,
	`role` text NOT NULL,
	`text` text NOT NULL,
	`decision` text,
	`source_ids` text DEFAULT '[]' NOT NULL,
	`latency_ms` integer DEFAULT 0 NOT NULL,
	`created_at` text NOT NULL,
	FOREIGN KEY (`call_id`) REFERENCES `calls`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `idx_turns_call` ON `turns` (`call_id`);