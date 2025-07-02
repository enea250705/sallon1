-- Create stylist working hours table and insert example data
-- This will create the table if it doesn't exist and add sample working hours

-- Create table (Drizzle will handle this, but keeping for reference)
-- CREATE TABLE IF NOT EXISTS "stylist_working_hours" (
--   "id" SERIAL PRIMARY KEY,
--   "stylist_id" INTEGER NOT NULL,
--   "day_of_week" INTEGER NOT NULL,
--   "start_time" TIME NOT NULL,
--   "end_time" TIME NOT NULL,
--   "break_start_time" TIME,
--   "break_end_time" TIME,
--   "is_working" BOOLEAN DEFAULT true,
--   "created_at" TIMESTAMP DEFAULT NOW(),
--   "updated_at" TIMESTAMP DEFAULT NOW()
-- );

-- Insert example working hours for all existing stylists
-- Assuming stylist IDs 1, 2, 3, etc. exist

-- Stylist 1 - Full time (Monday to Saturday) with lunch break
INSERT INTO stylist_working_hours (stylist_id, day_of_week, start_time, end_time, break_start_time, break_end_time, is_working) VALUES
(1, 1, '08:00', '17:00', '13:00', '14:00', true),  -- Monday with 1h lunch break
(1, 2, '08:00', '17:00', '13:00', '14:00', true),  -- Tuesday with 1h lunch break
(1, 3, '08:00', '17:00', '13:00', '14:00', true),  -- Wednesday with 1h lunch break
(1, 4, '08:00', '17:00', '13:00', '14:00', true),  -- Thursday with 1h lunch break
(1, 5, '08:00', '17:00', '13:00', '14:00', true),  -- Friday with 1h lunch break
(1, 6, '09:00', '16:00', '13:00', '14:00', true),  -- Saturday with 1h lunch break
(1, 0, '00:00', '00:00', null, null, false); -- Sunday (day off)

-- Stylist 2 - Part time (Tuesday to Friday) with short break
INSERT INTO stylist_working_hours (stylist_id, day_of_week, start_time, end_time, break_start_time, break_end_time, is_working) VALUES
(2, 1, '00:00', '00:00', null, null, false), -- Monday (day off)
(2, 2, '10:00', '18:00', '13:00', '13:30', true),  -- Tuesday with 30min break
(2, 3, '10:00', '18:00', '13:00', '13:30', true),  -- Wednesday with 30min break
(2, 4, '10:00', '18:00', '13:00', '13:30', true),  -- Thursday with 30min break
(2, 5, '10:00', '18:00', '13:00', '13:30', true),  -- Friday with 30min break
(2, 6, '00:00', '00:00', null, null, false), -- Saturday (day off)
(2, 0, '00:00', '00:00', null, null, false); -- Sunday (day off)

-- Stylist 3 - Different schedule (Monday, Wednesday, Friday, Saturday) with varied breaks
INSERT INTO stylist_working_hours (stylist_id, day_of_week, start_time, end_time, break_start_time, break_end_time, is_working) VALUES
(3, 1, '09:00', '16:00', '12:30', '13:15', true),  -- Monday with 45min break
(3, 2, '00:00', '00:00', null, null, false), -- Tuesday (day off)
(3, 3, '09:00', '16:00', '12:30', '13:15', true),  -- Wednesday with 45min break
(3, 4, '00:00', '00:00', null, null, false), -- Thursday (day off)
(3, 5, '09:00', '16:00', '12:30', '13:15', true),  -- Friday with 45min break
(3, 6, '08:00', '14:00', '11:30', '12:00', true),  -- Saturday with 30min break
(3, 0, '00:00', '00:00', null, null, false); -- Sunday (day off)

-- Note: Day of week mapping:
-- 0 = Sunday
-- 1 = Monday
-- 2 = Tuesday
-- 3 = Wednesday
-- 4 = Thursday
-- 5 = Friday
-- 6 = Saturday

-- Break times examples:
-- Stylist 1: Standard 1 hour lunch break (13:00-14:00) all working days
-- Stylist 2: Short 30 minute break (13:00-13:30) on working days
-- Stylist 3: 45 minute break (12:30-13:15) on weekdays, 30 minute break (11:30-12:00) on Saturday 