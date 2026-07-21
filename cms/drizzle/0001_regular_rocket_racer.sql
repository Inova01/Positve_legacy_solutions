CREATE TABLE `client_messages` (
	`id` text PRIMARY KEY NOT NULL,
	`client_id` text NOT NULL,
	`subject` text NOT NULL,
	`body` text NOT NULL,
	`channel` text DEFAULT 'email' NOT NULL,
	`status` text DEFAULT 'prepared' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	FOREIGN KEY (`client_id`) REFERENCES `clients`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE TABLE `clients` (
	`id` text PRIMARY KEY NOT NULL,
	`full_name` text NOT NULL,
	`email` text NOT NULL,
	`phone` text DEFAULT '' NOT NULL,
	`service` text DEFAULT 'General inquiry' NOT NULL,
	`source` text DEFAULT 'Manual entry' NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`notes` text DEFAULT '' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
