const { storage } = require('./server/storage.ts');
const { format, addDays } = require('date-fns');
const { it } = require('date-fns/locale');

async function debugAppointmentCheck() {
  console.log('🔍 Debug: Checking appointments for tomorrow reminders...\n');
  
  const tomorrow = addDays(new Date(), 1);
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
  
  console.log(`📅 Tomorrow date: ${tomorrowStr}`);
  console.log(`📅 Tomorrow formatted: ${format(tomorrow, 'EEEE, PPP', { locale: it })}\n`);
  
  try {
    // Get appointments for tomorrow
    const appointments = await storage.getAppointmentsByDate(tomorrowStr);
    
    console.log(`📋 Found ${appointments.length} appointments for tomorrow:`);
    
    if (appointments.length === 0) {
      console.log('❌ No appointments found for tomorrow');
      console.log('💡 This is why the scheduler is not sending reminders!');
      console.log('\n📝 To test reminders:');
      console.log('   1. Create an appointment for tomorrow in the calendar');
      console.log('   2. Wait for the next 30-minute check');
      console.log('   3. Or trigger manual reminder check');
      return;
    }
    
    console.log('='.repeat(60));
    
    for (const appointment of appointments) {
      const reminderStatus = appointment.reminderSent ? '✅ SENT' : '⏰ PENDING';
      const clientPhone = appointment.client?.phone || 'No phone';
      
      console.log(`\n📋 Appointment ID: ${appointment.id}`);
      console.log(`👤 Client: ${appointment.client?.firstName} ${appointment.client?.lastName}`);
      console.log(`📱 Phone: ${clientPhone}`);
      console.log(`⏰ Time: ${appointment.startTime}`);
      console.log(`💇 Service: ${appointment.service?.name}`);
      console.log(`📨 Reminder Status: ${reminderStatus}`);
      console.log(`📊 Status: ${appointment.status}`);
      
      if (!appointment.reminderSent) {
        console.log(`🎯 This appointment will receive a reminder!`);
      }
      
      console.log('-'.repeat(40));
    }
    
    const pendingReminders = appointments.filter(apt => !apt.reminderSent);
    console.log(`\n📊 Summary:`);
    console.log(`   Total appointments: ${appointments.length}`);
    console.log(`   Reminders already sent: ${appointments.length - pendingReminders.length}`);
    console.log(`   Reminders pending: ${pendingReminders.length}`);
    
    if (pendingReminders.length > 0) {
      console.log(`\n🔔 Next scheduler check will send ${pendingReminders.length} reminder(s)`);
      console.log('⏰ Scheduler runs every 30 minutes');
    }
    
  } catch (error) {
    console.error('❌ Error checking appointments:', error);
  }
}

// Run the debug check
debugAppointmentCheck().then(() => {
  console.log('\n✅ Debug check completed');
  process.exit(0);
}).catch(error => {
  console.error('❌ Debug failed:', error);
  process.exit(1);
}); 