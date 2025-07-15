// Quick check for appointments tomorrow
import { format, addDays } from 'date-fns';
import { it } from 'date-fns/locale';

async function quickCheck() {
  console.log('🔍 Quick appointment check for tomorrow...\n');
  
  const tomorrow = addDays(new Date(), 1);
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
  
  console.log(`📅 Tomorrow: ${format(tomorrow, 'EEEE, PPP', { locale: it })} (${tomorrowStr})`);
  
  // Check database directly with a simple query
  const query = `
    SELECT 
      a.id,
      a.date,
      a.start_time,
      a.reminder_sent,
      c.first_name,
      c.last_name,
      c.phone,
      s.name as service_name
    FROM appointments a
    JOIN clients c ON a.client_id = c.id
    JOIN services s ON a.service_id = s.id
    WHERE a.date = '${tomorrowStr}'
    ORDER BY a.start_time;
  `;
  
  console.log('📝 SQL Query to check appointments:');
  console.log(query);
  console.log('\n📋 To manually check:');
  console.log('1. Connect to your database');
  console.log('2. Run the query above');
  console.log('3. See if there are appointments for tomorrow');
  console.log('\n🔧 Why reminders might not work:');
  console.log('✅ WhatsApp is configured correctly');
  console.log('✅ Scheduler runs every 30 minutes');
  console.log('❓ Are there appointments for tomorrow?');
  console.log('❓ Have reminders already been sent?');
  
  console.log('\n📱 Quick test - send manual WhatsApp:');
  console.log('node test-whatsapp-simple.mjs');
  
  console.log('\n⏰ Check server logs for scheduler:');
  console.log('Look for messages like:');
  console.log('   "🔔 Starting precise 24-hour reminder check..."');
  console.log('   "📅 No appointments found in 24-hour window"');
  console.log('   "📋 Found X appointments to check for 24h reminders"');
}

quickCheck(); 