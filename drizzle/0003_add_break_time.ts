import { pgTable, time } from "drizzle-orm/pg-core";
import { sql } from "drizzle-orm";
import { createMigration } from "drizzle-orm/postgres-js/migrator";

export const breakTimeMigration = createMigration({
  up: async (db) => {
    // Add break time columns
    await db.execute(sql`
      ALTER TABLE stylist_working_hours
      ADD COLUMN break_start_time TIME,
      ADD COLUMN break_end_time TIME;
    `);

    // Update existing records with default break time
    await db.execute(sql`
      UPDATE stylist_working_hours
      SET break_start_time = '13:00',
          break_end_time = '14:00'
      WHERE is_working = true;
    `);

    // Add check constraints
    await db.execute(sql`
      ALTER TABLE stylist_working_hours
      ADD CONSTRAINT break_time_check 
      CHECK (
        (break_start_time IS NULL AND break_end_time IS NULL) OR
        (break_start_time IS NOT NULL AND break_end_time IS NOT NULL AND break_start_time < break_end_time)
      );
    `);

    await db.execute(sql`
      ALTER TABLE stylist_working_hours
      ADD CONSTRAINT break_within_working_hours 
      CHECK (
        (break_start_time IS NULL AND break_end_time IS NULL) OR
        (break_start_time >= start_time AND break_end_time <= end_time)
      );
    `);
  },
  down: async (db) => {
    // Remove constraints first
    await db.execute(sql`
      ALTER TABLE stylist_working_hours
      DROP CONSTRAINT IF EXISTS break_time_check,
      DROP CONSTRAINT IF EXISTS break_within_working_hours;
    `);

    // Remove columns
    await db.execute(sql`
      ALTER TABLE stylist_working_hours
      DROP COLUMN IF EXISTS break_start_time,
      DROP COLUMN IF EXISTS break_end_time;
    `);
  },
}); 