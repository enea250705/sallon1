-- Add break time columns to stylist_working_hours table
ALTER TABLE stylist_working_hours
ADD COLUMN break_start_time TIME,
ADD COLUMN break_end_time TIME;

-- Update existing records with default break time (13:00-14:00)
UPDATE stylist_working_hours
SET break_start_time = '13:00',
    break_end_time = '14:00'
WHERE is_working = true;

-- Add check constraint to ensure break times are valid
ALTER TABLE stylist_working_hours
ADD CONSTRAINT break_time_check 
CHECK (
  (break_start_time IS NULL AND break_end_time IS NULL) OR
  (break_start_time IS NOT NULL AND break_end_time IS NOT NULL AND break_start_time < break_end_time)
);

-- Add check constraint to ensure break times are within working hours
ALTER TABLE stylist_working_hours
ADD CONSTRAINT break_within_working_hours 
CHECK (
  (break_start_time IS NULL AND break_end_time IS NULL) OR
  (break_start_time >= start_time AND break_end_time <= end_time)
); 