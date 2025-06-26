-- Create stylist schedules table for individual working hours and breaks
CREATE TABLE IF NOT EXISTS stylist_schedules (
  id SERIAL PRIMARY KEY,
  stylist_id INTEGER NOT NULL REFERENCES stylists(id),
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  is_working BOOLEAN DEFAULT true,
  breaks JSONB,
  notes TEXT,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(stylist_id, date)
);

-- Create stylist weekly template table for default schedules
CREATE TABLE IF NOT EXISTS stylist_weekly_template (
  id SERIAL PRIMARY KEY,
  stylist_id INTEGER NOT NULL REFERENCES stylists(id),
  day_of_week INTEGER NOT NULL CHECK (day_of_week >= 0 AND day_of_week <= 6),
  start_time TIME,
  end_time TIME,
  is_working BOOLEAN DEFAULT true,
  breaks JSONB,
  created_at TIMESTAMP DEFAULT NOW(),
  updated_at TIMESTAMP DEFAULT NOW(),
  UNIQUE(stylist_id, day_of_week)
);

-- Create index for faster queries
CREATE INDEX IF NOT EXISTS idx_stylist_schedules_date ON stylist_schedules(date);
CREATE INDEX IF NOT EXISTS idx_stylist_schedules_stylist_date ON stylist_schedules(stylist_id, date);
CREATE INDEX IF NOT EXISTS idx_stylist_weekly_template_stylist ON stylist_weekly_template(stylist_id);

-- Insert default weekly templates for existing stylists
INSERT INTO stylist_weekly_template (stylist_id, day_of_week, start_time, end_time, is_working, breaks)
SELECT 
  s.id as stylist_id,
  d.day_of_week,
  CASE 
    WHEN d.day_of_week = 0 THEN NULL -- Sunday - closed
    WHEN d.day_of_week = 6 THEN '09:00'::TIME -- Saturday - half day
    ELSE '08:00'::TIME -- Monday-Friday
  END as start_time,
  CASE 
    WHEN d.day_of_week = 0 THEN NULL -- Sunday - closed
    WHEN d.day_of_week = 6 THEN '14:00'::TIME -- Saturday - half day
    ELSE '18:00'::TIME -- Monday-Friday
  END as end_time,
  CASE 
    WHEN d.day_of_week = 0 THEN false -- Sunday - closed
    ELSE true
  END as is_working,
  CASE 
    WHEN d.day_of_week = 0 THEN NULL -- Sunday - no breaks
    WHEN d.day_of_week = 6 THEN NULL -- Saturday - no breaks (short day)
    ELSE '[{"startTime": "12:30", "endTime": "13:30", "type": "lunch"}]'::JSONB
  END as breaks
FROM stylists s
CROSS JOIN (
  SELECT generate_series(0, 6) as day_of_week
) d
ON CONFLICT (stylist_id, day_of_week) DO NOTHING; 