-- Create recurring_reminders table
CREATE TABLE IF NOT EXISTS recurring_reminders (
    id SERIAL PRIMARY KEY,
    client_id INTEGER NOT NULL REFERENCES clients(id),
    service_id INTEGER NOT NULL REFERENCES services(id),
    stylist_id INTEGER NOT NULL REFERENCES stylists(id),
    frequency VARCHAR(20) NOT NULL CHECK (frequency IN ('weekly', 'biweekly', 'monthly')),
    day_of_week INTEGER CHECK (day_of_week >= 0 AND day_of_week <= 6),
    day_of_month INTEGER CHECK (day_of_month >= 1 AND day_of_month <= 31),
    preferred_time TIME,
    is_active BOOLEAN DEFAULT true,
    last_reminder_sent DATE,
    next_reminder_date DATE,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_recurring_reminders_client_id ON recurring_reminders(client_id);
CREATE INDEX IF NOT EXISTS idx_recurring_reminders_next_date ON recurring_reminders(next_reminder_date);
CREATE INDEX IF NOT EXISTS idx_recurring_reminders_active ON recurring_reminders(is_active);

-- Add comments for documentation
COMMENT ON TABLE recurring_reminders IS 'Stores recurring reminder configurations for clients';
COMMENT ON COLUMN recurring_reminders.frequency IS 'How often to send reminders: weekly, biweekly, monthly';
COMMENT ON COLUMN recurring_reminders.day_of_week IS 'Day of week for weekly/biweekly reminders (0=Sunday, 6=Saturday)';
COMMENT ON COLUMN recurring_reminders.day_of_month IS 'Day of month for monthly reminders (1-31)';
COMMENT ON COLUMN recurring_reminders.preferred_time IS 'Preferred appointment time for the client';
COMMENT ON COLUMN recurring_reminders.next_reminder_date IS 'When to send the next reminder';

-- Insert some example data (optional)
-- INSERT INTO recurring_reminders (client_id, service_id, stylist_id, frequency, day_of_week, preferred_time, next_reminder_date)
-- VALUES 
--     (1, 1, 1, 'weekly', 1, '10:00', CURRENT_DATE + INTERVAL '1 day'),
--     (2, 2, 2, 'biweekly', 5, '14:30', CURRENT_DATE + INTERVAL '3 days'); 