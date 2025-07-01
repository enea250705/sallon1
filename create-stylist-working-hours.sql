-- Create stylist working hours table and insert example data
-- This will create the table if it doesn't exist and add sample working hours

-- Create table (Drizzle will handle this, but keeping for reference)
-- CREATE TABLE IF NOT EXISTS "stylist_working_hours" (
--   "id" SERIAL PRIMARY KEY,
--   "stylist_id" INTEGER NOT NULL,
--   "day_of_week" INTEGER NOT NULL,
--   "start_time" TIME NOT NULL,
--   "end_time" TIME NOT NULL,
--   "is_working" BOOLEAN DEFAULT true,
--   "created_at" TIMESTAMP DEFAULT NOW(),
--   "updated_at" TIMESTAMP DEFAULT NOW()
-- );

-- Insert example working hours for all existing stylists
-- Assuming stylist IDs 1, 2, 3, etc. exist

-- Stylist 1 - Full time (Monday to Saturday)
INSERT INTO stylist_working_hours (stylist_id, day_of_week, start_time, end_time, is_working) VALUES
(1, 1, '08:00', '17:00', true),  -- Monday
(1, 2, '08:00', '17:00', true),  -- Tuesday
(1, 3, '08:00', '17:00', true),  -- Wednesday
(1, 4, '08:00', '17:00', true),  -- Thursday
(1, 5, '08:00', '17:00', true),  -- Friday
(1, 6, '09:00', '16:00', true),  -- Saturday
(1, 0, '00:00', '00:00', false); -- Sunday (day off)

-- Stylist 2 - Part time (Tuesday to Friday)
INSERT INTO stylist_working_hours (stylist_id, day_of_week, start_time, end_time, is_working) VALUES
(2, 1, '00:00', '00:00', false), -- Monday (day off)
(2, 2, '10:00', '18:00', true),  -- Tuesday
(2, 3, '10:00', '18:00', true),  -- Wednesday
(2, 4, '10:00', '18:00', true),  -- Thursday
(2, 5, '10:00', '18:00', true),  -- Friday
(2, 6, '00:00', '00:00', false), -- Saturday (day off)
(2, 0, '00:00', '00:00', false); -- Sunday (day off)

-- Stylist 3 - Different schedule (Monday, Wednesday, Friday, Saturday)
INSERT INTO stylist_working_hours (stylist_id, day_of_week, start_time, end_time, is_working) VALUES
(3, 1, '09:00', '16:00', true),  -- Monday
(3, 2, '00:00', '00:00', false), -- Tuesday (day off)
(3, 3, '09:00', '16:00', true),  -- Wednesday
(3, 4, '00:00', '00:00', false), -- Thursday (day off)
(3, 5, '09:00', '16:00', true),  -- Friday
(3, 6, '08:00', '14:00', true),  -- Saturday
(3, 0, '00:00', '00:00', false); -- Sunday (day off)

-- Note: Day of week mapping:
-- 0 = Sunday
-- 1 = Monday
-- 2 = Tuesday
-- 3 = Wednesday
-- 4 = Thursday
-- 5 = Friday
-- 6 = Saturday 