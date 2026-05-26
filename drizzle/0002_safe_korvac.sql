CREATE TABLE `addresses` (
	`id` varchar(255) NOT NULL,
	`user_id` varchar(255) NOT NULL,
	`full_name` text NOT NULL,
	`street_1` text NOT NULL,
	`street_2` text,
	`city` text NOT NULL,
	`state` varchar(50) NOT NULL,
	`zip_code` varchar(20) NOT NULL,
	`country` varchar(2) NOT NULL DEFAULT 'US',
	`phone` varchar(20) NOT NULL,
	`is_default` boolean DEFAULT true,
	`created_at` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `addresses_id` PRIMARY KEY(`id`)
);
