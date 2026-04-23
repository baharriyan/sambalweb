CREATE TABLE `coupons` (
	`id` int AUTO_INCREMENT NOT NULL,
	`code` varchar(50) NOT NULL,
	`description` text,
	`discountType` enum('FIXED','PERCENTAGE') NOT NULL,
	`discountValue` int NOT NULL,
	`minOrderAmount` int NOT NULL DEFAULT 0,
	`maxDiscountAmount` int,
	`startDate` datetime,
	`endDate` datetime,
	`usageLimit` int,
	`usageCount` int NOT NULL DEFAULT 0,
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `coupons_id` PRIMARY KEY(`id`),
	CONSTRAINT `coupons_code_unique` UNIQUE(`code`)
);
--> statement-breakpoint
ALTER TABLE `orders` ADD `paymentProofUrl` text;--> statement-breakpoint
ALTER TABLE `orders` ADD `couponId` int;--> statement-breakpoint
ALTER TABLE `orders` ADD `discountAmount` int DEFAULT 0 NOT NULL;