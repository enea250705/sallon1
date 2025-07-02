CREATE TABLE "appointments" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"stylist_id" integer NOT NULL,
	"service_id" integer NOT NULL,
	"date" date NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"status" varchar(20) DEFAULT 'scheduled' NOT NULL,
	"notes" text,
	"reminder_sent" boolean DEFAULT false,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "clients" (
	"id" serial PRIMARY KEY NOT NULL,
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"phone" varchar(20) NOT NULL,
	"email" varchar(100),
	"notes" text,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now(),
	"is_active" boolean DEFAULT true
);
--> statement-breakpoint
CREATE TABLE "message_templates" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"template" text NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "recurring_reminders" (
	"id" serial PRIMARY KEY NOT NULL,
	"client_id" integer NOT NULL,
	"service_id" integer NOT NULL,
	"stylist_id" integer NOT NULL,
	"frequency" varchar(20) NOT NULL,
	"day_of_week" integer,
	"day_of_month" integer,
	"preferred_time" time,
	"is_active" boolean DEFAULT true,
	"last_reminder_sent" date,
	"next_reminder_date" date,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "services" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"duration" integer NOT NULL,
	"price" integer,
	"description" text,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "sessions" (
	"sid" varchar PRIMARY KEY NOT NULL,
	"sess" jsonb NOT NULL,
	"expire" timestamp NOT NULL
);
--> statement-breakpoint
CREATE TABLE "stylist_working_hours" (
	"id" serial PRIMARY KEY NOT NULL,
	"stylist_id" integer NOT NULL,
	"day_of_week" integer NOT NULL,
	"start_time" time NOT NULL,
	"end_time" time NOT NULL,
	"break_start_time" time,
	"break_end_time" time,
	"is_working" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"updated_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "stylists" (
	"id" serial PRIMARY KEY NOT NULL,
	"name" varchar(100) NOT NULL,
	"phone" varchar(20),
	"email" varchar(100),
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now()
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"username" varchar(50) NOT NULL,
	"password" varchar(255) NOT NULL,
	"email" varchar(100),
	"first_name" varchar(50) NOT NULL,
	"last_name" varchar(50) NOT NULL,
	"role" varchar(20) DEFAULT 'user' NOT NULL,
	"is_active" boolean DEFAULT true,
	"created_at" timestamp DEFAULT now(),
	"last_login" timestamp,
	CONSTRAINT "users_username_unique" UNIQUE("username")
);
--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_stylist_id_stylists_id_fk" FOREIGN KEY ("stylist_id") REFERENCES "public"."stylists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "appointments" ADD CONSTRAINT "appointments_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_reminders" ADD CONSTRAINT "recurring_reminders_client_id_clients_id_fk" FOREIGN KEY ("client_id") REFERENCES "public"."clients"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_reminders" ADD CONSTRAINT "recurring_reminders_service_id_services_id_fk" FOREIGN KEY ("service_id") REFERENCES "public"."services"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "recurring_reminders" ADD CONSTRAINT "recurring_reminders_stylist_id_stylists_id_fk" FOREIGN KEY ("stylist_id") REFERENCES "public"."stylists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
ALTER TABLE "stylist_working_hours" ADD CONSTRAINT "stylist_working_hours_stylist_id_stylists_id_fk" FOREIGN KEY ("stylist_id") REFERENCES "public"."stylists"("id") ON DELETE no action ON UPDATE no action;--> statement-breakpoint
CREATE INDEX "IDX_session_expire" ON "sessions" USING btree ("expire");