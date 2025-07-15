import { storage } from './server/storage';
import { format } from 'date-fns';
import { it } from 'date-fns/locale';

async function checkReminderStatus() {
  console.log('🔍 Checking reminder status for tomorrow appointments...\n');
  
  const tomorrow = new Date();
  tomorrow.setDate(tomorrow.getDate() + 1);
  const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
  
  console.log(`Looking for appointments on: ${tomorrowStr}`);
  
  try {
    // Get all appointments for tomorrow
    const appointments = await storage.getAppointmentsByDate(tomorrowStr);
    
    if (appointments.length === 0) {
      console.log('❌ No appointments found for tomorrow');
      return;
    }
    
    console.log(`\n📋 Found ${appointments.length} appointments for tomorrow:`);
    console.log('='.repeat(80));
    
    for (const appointment of appointments) {
      const reminderStatus = appointment.reminderSent ? '✅ SENT' : '⏰ PENDING';
      const clientPhone = appointment.client?.phone || 'No phone';
      
      console.log(`ID: ${appointment.id}`);
      console.log(`Client: ${appointment.client?.firstName} ${appointment.client?.lastName}`);
      console.log(`Phone: ${clientPhone}`);
      console.log(`Time: ${appointment.startTime}`);
      console.log(`Service: ${appointment.service?.name}`);
      console.log(`Reminder Status: ${reminderStatus}`);
      console.log(`Status: ${appointment.status}`);
      console.log('-'.repeat(50));
    }
    
    // Check specifically for your phone number
    const yourPhone = '3761024080';
    const yourAppointment = appointments.find(apt => 
      apt.client?.phone === yourPhone || 
      apt.client?.phone === `+39${yourPhone}` ||
      apt.client?.phone === `39${yourPhone}`
    );
    
    if (yourAppointment) {
      console.log(`\n🎯 YOUR APPOINTMENT FOUND:`);
      console.log(`ID: ${yourAppointment.id}`);
      console.log(`Time: ${yourAppointment.startTime}`);
      console.log(`Reminder Sent: ${yourAppointment.reminderSent ? 'YES ✅' : 'NO ❌'}`);
      console.log(`Phone: ${yourAppointment.client?.phone}`);
      
      if (yourAppointment.reminderSent) {
        console.log('\n❗ This is why no reminder was sent - it was already marked as sent!');
      } else {
        console.log('\n✅ Reminder not sent yet - should be sent by scheduler');
      }
    } else {
      console.log(`\n❌ No appointment found with phone number: ${yourPhone}`);
      console.log('Check that your client profile has the correct phone number');
    }
    
  } catch (error) {
    console.error('❌ Error checking reminder status:', error);
  }
}

checkReminderStatus().catch(console.error);