CREATE TABLE `items` (
	`id` varchar(255) NOT NULL,
	`owner_id` varchar(255) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`transaction_type` enum('swap_only','sale_only','both') NOT NULL,
	`base_category` enum('clothing','sneakers','jewelry','accessories') NOT NULL,
	`item_condition` enum('new_with_tags','like_new','fairly_used','vintage_distressed') NOT NULL,
	`estimated_value` decimal(10,2),
	`sale_price` decimal(10,2),
	`attributes` json,
	`media_urls` json NOT NULL,
	CONSTRAINT `items_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `messages` (
	`id` varchar(255) NOT NULL,
	`offer_id` varchar(255) NOT NULL,
	`sender_id` varchar(255) NOT NULL,
	`receiver_id` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `messages_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `offers` (
	`id` varchar(255) NOT NULL,
	`target_item_id` varchar(255) NOT NULL,
	`receiver_id` varchar(255) NOT NULL,
	`sender_id` varchar(255) NOT NULL,
	`offer_type` varchar(50) NOT NULL,
	`offered_item_ids` json,
	`cash_amount` varchar(50) DEFAULT '0',
	`message` text,
	`status` varchar(50) NOT NULL DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `offers_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `saved_items` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`item_id` varchar(255) NOT NULL,
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `saved_items_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_save` UNIQUE(`user_id`,`item_id`)
);
--> statement-breakpoint
CREATE TABLE `swaps` (
	`id` varchar(255) NOT NULL,
	`sender_id` varchar(255) NOT NULL,
	`receiver_id` varchar(255) NOT NULL,
	`sender_items` json NOT NULL,
	`receiver_items` json NOT NULL,
	`status` enum('pending','accepted','paid','shipped','completed','cancelled') DEFAULT 'pending',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `swaps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `users` (
	`id` varchar(255) NOT NULL,
	`name` varchar(255) NOT NULL,
	`email` varchar(255) NOT NULL,
	`stripe_id` varchar(255),
	`user_type` enum('user','maker') DEFAULT 'user',
	`rating` decimal(3,2) DEFAULT '5.00',
	`created_at` timestamp DEFAULT (now()),
	CONSTRAINT `users_id` PRIMARY KEY(`id`)
);
