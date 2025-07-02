ALTER TABLE "salon_hours" ADD COLUMN "open_time" time NOT NULL;--> statement-breakpoint
ALTER TABLE "salon_hours" ADD COLUMN "close_time" time NOT NULL;--> statement-breakpoint
ALTER TABLE "salon_settings" ADD COLUMN "setting_key" varchar(100) NOT NULL;--> statement-breakpoint
ALTER TABLE "salon_settings" ADD COLUMN "setting_value" text NOT NULL;--> statement-breakpoint
ALTER TABLE "salon_settings" ADD COLUMN "description" text;--> statement-breakpoint
ALTER TABLE "salon_hours" DROP COLUMN "start_time";--> statement-breakpoint
ALTER TABLE "salon_hours" DROP COLUMN "end_time";--> statement-breakpoint
ALTER TABLE "salon_settings" DROP COLUMN "name";--> statement-breakpoint
ALTER TABLE "salon_settings" DROP COLUMN "value";