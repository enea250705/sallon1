const { Pool } = require('pg');
require('dotenv').config();

console.log('🚀 Starting migration script...');
console.log('📡 Database URL:', process.env.DATABASE_URL ? 'Found' : 'Missing');

const pool = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: process.env.NODE_ENV === 'production' ? { rejectUnauthorized: false } : false
});

const createRecurringRemindersTable = `
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
`;

async function runMigration() {
  const client = await pool.connect();
  console.log('✅ Connected to database');
  
  try {
    console.log('🔄 Running recurring reminders migration...');
    
    // Execute the migration
    await client.query(createRecurringRemindersTable);
    
    console.log('✅ Migration completed successfully!');
    console.log('📋 Created table: recurring_reminders');
    console.log('📋 Created indexes for performance');
    
    // Check if table was created
    const result = await client.query(`
      SELECT column_name, data_type, is_nullable 
      FROM information_schema.columns 
      WHERE table_name = 'recurring_reminders'
      ORDER BY ordinal_position;
    `);
    
    console.log('\n📊 Table structure:');
    result.rows.forEach(row => {
      console.log(`  - ${row.column_name}: ${row.data_type} ${row.is_nullable === 'NO' ? '(NOT NULL)' : ''}`);
    });
    
  } catch (error) {
    console.error('❌ Migration failed:', error);
    process.exit(1);
  } finally {
    client.release();
    await pool.end();
  }
}

runMigration().catch(error => {
  console.error('❌ Script failed:', error);
  process.exit(1);
}); 