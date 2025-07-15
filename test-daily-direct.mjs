// Direct test of the daily reminder service
import { format, addDays } from 'date-fns';
import { it } from 'date-fns/locale';

async function testDailyDirect() {
  console.log('🧪 Direct test of Daily Reminder Service...\n');
  
  const tomorrow = addDays(new Date(), 1);
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
  
  console.log(`📅 Testing reminders for: ${format(tomorrow, 'EEEE, PPP', { locale: it })} (${tomorrowStr})`);
  
  try {
    // Import the service directly
    console.log('📦 Importing daily reminder service...');
    const { dailyReminderService } = await import('./server/services/dailyReminderService.ts');
    
    console.log('✅ Service imported successfully');
    
    // Test manual trigger
    console.log('🚀 Triggering manual reminder check...');
    await dailyReminderService.triggerManualReminder();
    
    console.log('✅ Manual trigger completed');
    
  } catch (error) {
    console.error('❌ Error testing daily reminder service:', error);
    console.log('\n🔧 Possible issues:');
    console.log('1. TypeScript files not compiled');
    console.log('2. Missing dependencies');
    console.log('3. Database connection issues');
  }
  
  console.log('\n📋 Next steps:');
  console.log('1. Check WhatsApp for messages');
  console.log('2. Verify the service starts at server boot');
  console.log('3. Check if appointments exist for tomorrow');
}

testDailyDirect(); 