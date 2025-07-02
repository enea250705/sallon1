-- Migration 0004: Complete Salon Management System
-- Add support for stylist vacations, extraordinary salon days, and double shifts

-- Add new fields to stylist_working_hours for double shifts support
ALTER TABLE "stylist_working_hours" ADD COLUMN "morning_start" time;
ALTER TABLE "stylist_working_hours" ADD COLUMN "morning_end" time;
ALTER TABLE "stylist_working_hours" ADD COLUMN "morning_break_start" time;
ALTER TABLE "stylist_working_hours" ADD COLUMN "morning_break_end" time;
ALTER TABLE "stylist_working_hours" ADD COLUMN "afternoon_start" time;
ALTER TABLE "stylist_working_hours" ADD COLUMN "afternoon_end" time;
ALTER TABLE "stylist_working_hours" ADD COLUMN "afternoon_break_start" time;
ALTER TABLE "stylist_working_hours" ADD COLUMN "afternoon_break_end" time;

-- Create stylist vacations table
CREATE TABLE "stylist_vacations" (
	"id" serial PRIMARY KEY NOT NULL,
	"stylist_id" integer NOT NULL,
	"start_date" date NOT NULL,
	"end_date" date NOT NULL,
	"reason" varchar(200) DEFAULT 'Ferie',
	"notes" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Create salon extraordinary days table
CREATE TABLE "salon_extraordinary_days" (
	"id" serial PRIMARY KEY NOT NULL,
	"date" date NOT NULL UNIQUE,
	"is_closed" boolean DEFAULT true,
	"reason" varchar(200) NOT NULL,
	"special_open_time" time,
	"special_close_time" time,
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);

-- Add foreign key constraints
ALTER TABLE "stylist_vacations" ADD CONSTRAINT "stylist_vacations_stylist_id_stylists_id_fk" FOREIGN KEY ("stylist_id") REFERENCES "public"."stylists"("id") ON DELETE no action ON UPDATE no action;

-- Create indexes for better performance
CREATE INDEX "idx_stylist_vacations_stylist_id" ON "stylist_vacations"("stylist_id");
CREATE INDEX "idx_stylist_vacations_dates" ON "stylist_vacations"("start_date", "end_date");
CREATE INDEX "idx_salon_extraordinary_days_date" ON "salon_extraordinary_days"("date");

-- Add comments for documentation
COMMENT ON TABLE "stylist_vacations" IS 'Stores vacation periods for stylists';
COMMENT ON TABLE "salon_extraordinary_days" IS 'Stores extraordinary salon closures or special opening hours';
COMMENT ON COLUMN "stylist_working_hours"."morning_start" IS 'Morning shift start time';
COMMENT ON COLUMN "stylist_working_hours"."morning_end" IS 'Morning shift end time';
COMMENT ON COLUMN "stylist_working_hours"."afternoon_start" IS 'Afternoon shift start time';
COMMENT ON COLUMN "stylist_working_hours"."afternoon_end" IS 'Afternoon shift end time'; 