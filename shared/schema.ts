import {
  pgTable,
  serial,
  varchar,
  text,
  timestamp,
  boolean,
  integer,
  date,
  time,
  jsonb,
  index,
} from "drizzle-orm/pg-core";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// Users table for authentication
export const users = pgTable("users", {
  id: serial("id").primaryKey(),
  username: varchar("username", { length: 50 }).notNull().unique(),
  password: varchar("password", { length: 255 }).notNull(),
  email: varchar("email", { length: 100 }),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  role: varchar("role", { length: 20 }).notNull().default("user"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  lastLogin: timestamp("last_login"),
});

// Clients table for customer management
export const clients = pgTable("clients", {
  id: serial("id").primaryKey(),
  firstName: varchar("first_name", { length: 50 }).notNull(),
  lastName: varchar("last_name", { length: 50 }).notNull(),
  phone: varchar("phone", { length: 20 }).notNull(),
  email: varchar("email", { length: 100 }),
  notes: text("notes"), // For preferences, hair color, products used, etc.
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
  isActive: boolean("is_active").default(true),
});

// Services table for different hair services
export const services = pgTable("services", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  duration: integer("duration").notNull(), // in minutes
  price: integer("price"), // in cents
  description: text("description"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stylists table for staff management
export const stylists = pgTable("stylists", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  phone: varchar("phone", { length: 20 }),
  email: varchar("email", { length: 100 }),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Stylist working hours table - Extended for double shifts
export const stylistWorkingHours = pgTable("stylist_working_hours", {
  id: serial("id").primaryKey(),
  stylistId: integer("stylist_id").references(() => stylists.id).notNull(),
  dayOfWeek: integer("day_of_week").notNull(), // 0 = Sunday, 1 = Monday, ..., 6 = Saturday
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  breakStartTime: time("break_start_time"),
  breakEndTime: time("break_end_time"),
  isWorking: boolean("is_working").default(true), // false = day off
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Stylist vacations table
export const stylistVacations = pgTable("stylist_vacations", {
  id: serial("id").primaryKey(),
  stylistId: integer("stylist_id").references(() => stylists.id).notNull(),
  startDate: date("start_date").notNull(),
  endDate: date("end_date").notNull(),
  reason: varchar("reason", { length: 200 }).default("Ferie"),
  notes: text("notes"),
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Extraordinary salon closures/openings table
export const salonExtraordinaryDays = pgTable("salon_extraordinary_days", {
  id: serial("id").primaryKey(),
  date: date("date").notNull().unique(),
  isClosed: boolean("is_closed").default(true), // true = closed, false = special opening
  reason: varchar("reason", { length: 200 }).notNull(),
  specialOpenTime: time("special_open_time"), // for special openings
  specialCloseTime: time("special_close_time"), // for special openings
  notes: text("notes"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Appointments table
export const appointments = pgTable("appointments", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  stylistId: integer("stylist_id").references(() => stylists.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  date: date("date").notNull(),
  startTime: time("start_time").notNull(),
  endTime: time("end_time").notNull(),
  status: varchar("status", { length: 20 }).notNull().default("scheduled"), // scheduled, completed, cancelled, no-show
  notes: text("notes"),
  reminderSent: boolean("reminder_sent").default(false),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Salon settings table for global salon configuration
export const salonSettings = pgTable("salon_settings", {
  id: serial("id").primaryKey(),
  settingKey: varchar("setting_key", { length: 100 }).notNull().unique(),
  settingValue: text("setting_value").notNull(),
  description: text("description"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// WhatsApp message templates
export const messageTemplates = pgTable("message_templates", {
  id: serial("id").primaryKey(),
  name: varchar("name", { length: 100 }).notNull(),
  template: text("template").notNull(), // Message template with placeholders
  isActive: boolean("is_active").default(true),
  createdAt: timestamp("created_at").defaultNow(),
});

// Recurring reminders table for automatic weekly/monthly reminders
export const recurringReminders = pgTable("recurring_reminders", {
  id: serial("id").primaryKey(),
  clientId: integer("client_id").references(() => clients.id).notNull(),
  serviceId: integer("service_id").references(() => services.id).notNull(),
  stylistId: integer("stylist_id").references(() => stylists.id).notNull(),
  frequency: varchar("frequency", { length: 20 }).notNull(), // 'weekly', 'biweekly', 'monthly'
  dayOfWeek: integer("day_of_week"), // 0-6 (Sunday-Saturday) for weekly reminders
  dayOfMonth: integer("day_of_month"), // 1-31 for monthly reminders
  preferredTime: time("preferred_time"), // Preferred appointment time
  isActive: boolean("is_active").default(true),
  lastReminderSent: date("last_reminder_sent"),
  nextReminderDate: date("next_reminder_date"),
  createdAt: timestamp("created_at").defaultNow(),
  updatedAt: timestamp("updated_at").defaultNow(),
});

// Session storage table for authentication
export const sessions = pgTable(
  "sessions",
  {
    sid: varchar("sid").primaryKey(),
    sess: jsonb("sess").notNull(),
    expire: timestamp("expire").notNull(),
  },
  (table) => [index("IDX_session_expire").on(table.expire)],
);

// Insert schemas
export const insertUserSchema = createInsertSchema(users).omit({
  id: true,
  createdAt: true,
  lastLogin: true,
});

export const insertClientSchema = createInsertSchema(clients).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertServiceSchema = createInsertSchema(services).omit({
  id: true,
  createdAt: true,
});

export const insertStylistSchema = createInsertSchema(stylists).omit({
  id: true,
  createdAt: true,
});

export const insertStylistWorkingHoursSchema = createInsertSchema(stylistWorkingHours).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertAppointmentSchema = createInsertSchema(appointments).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  reminderSent: true,
});

export const insertMessageTemplateSchema = createInsertSchema(messageTemplates).omit({
  id: true,
  createdAt: true,
});

export const insertRecurringReminderSchema = createInsertSchema(recurringReminders).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
  lastReminderSent: true,
  nextReminderDate: true,
});

export const insertStylistVacationSchema = createInsertSchema(stylistVacations).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalonSettingSchema = createInsertSchema(salonSettings).omit({
  id: true,
  createdAt: true,
  updatedAt: true,
});

export const insertSalonExtraordinaryDaySchema = z.object({
  date: z.string(),
  reason: z.string().min(1, "La motivazione è richiesta"),
  isClosed: z.boolean().default(true),
  specialOpenTime: z.string().nullable(),
  specialCloseTime: z.string().nullable(),
  notes: z.string().nullable(),
});

// Types
export type User = typeof users.$inferSelect;
export type InsertUser = z.infer<typeof insertUserSchema>;

export type Client = typeof clients.$inferSelect;
export type InsertClient = z.infer<typeof insertClientSchema>;

export type Service = typeof services.$inferSelect;
export type InsertService = z.infer<typeof insertServiceSchema>;

export type Stylist = typeof stylists.$inferSelect;
export type InsertStylist = z.infer<typeof insertStylistSchema>;

export type StylistWorkingHours = typeof stylistWorkingHours.$inferSelect;
export type InsertStylistWorkingHours = z.infer<typeof insertStylistWorkingHoursSchema>;

export type Appointment = typeof appointments.$inferSelect;
export type InsertAppointment = z.infer<typeof insertAppointmentSchema>;

export type MessageTemplate = typeof messageTemplates.$inferSelect;
export type InsertMessageTemplate = z.infer<typeof insertMessageTemplateSchema>;

export type RecurringReminder = typeof recurringReminders.$inferSelect;
export type InsertRecurringReminder = z.infer<typeof insertRecurringReminderSchema>;

export type StylistVacation = typeof stylistVacations.$inferSelect;
export type InsertStylistVacation = z.infer<typeof insertStylistVacationSchema>;

export type SalonSetting = typeof salonSettings.$inferSelect;
export type InsertSalonSetting = z.infer<typeof insertSalonSettingSchema>;

export type SalonExtraordinaryDay = typeof salonExtraordinaryDays.$inferSelect;
export type InsertSalonExtraordinaryDay = z.infer<typeof insertSalonExtraordinaryDaySchema>;

// Extended types with relations
export type AppointmentWithDetails = Appointment & {
  client: Client | null;
  stylist: Stylist | null;
  service: Service | null;
};

export type RecurringReminderWithDetails = RecurringReminder & {
  client: Client;
  stylist: Stylist;
  service: Service;
};

export type StylistVacationWithDetails = StylistVacation & {
  stylist: Stylist;
};