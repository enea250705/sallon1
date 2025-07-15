// Test the new 9:00 AM daily reminder service
import { format, addDays } from 'date-fns';
import { it } from 'date-fns/locale';

async function testDailyReminder() {
  console.log('🧪 Testing 9:00 AM Daily Reminder Service...\n');
  
  const tomorrow = addDays(new Date(), 1);
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
  
  console.log(`📅 Testing reminders for: ${format(tomorrow, 'EEEE, PPP', { locale: it })} (${tomorrowStr})`);
  
  try {
    // Test the new daily reminder endpoint
    console.log('📞 Triggering daily reminder service...');
    
    const response = await fetch('http://localhost:5000/api/reminders/daily-trigger', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Note: This endpoint requires authentication in production
        // For testing, you might need to bypass auth or use test credentials
      }
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Daily reminder service response:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`❌ Error (${response.status}):`, await response.text());
    }
    
  } catch (error) {
    console.error('❌ Error testing daily reminder:', error);
  }
  
  console.log('\n🔍 Manual check:');
  console.log('1. Check your WhatsApp for test messages');
  console.log('2. Look at server logs for reminder activity');
  console.log('3. Verify appointments for tomorrow exist in database');
  
  console.log('\n📋 Expected behavior:');
  console.log('• Service runs every day at 9:00 AM automatically');
  console.log('• Sends reminders for ALL appointments tomorrow');
  console.log('• Skips already sent reminders');
  console.log('• Logs detailed activity');
}

testDailyReminder(); 