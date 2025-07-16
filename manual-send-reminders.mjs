import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

// Import the database and WhatsApp service
import('./server/database.js').then(async (dbModule) => {
  const { storage } = await import('./server/storage.js');
  const { whatsAppService } = await import('./server/services/whatsapp.js');
  
  console.log('🚀 Starting manual WhatsApp reminder sending...');
  
  try {
    // Get tomorrow's date (2025-07-17 based on your debug output)
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0]; // Format: YYYY-MM-DD
    
    console.log(`📅 Sending reminders for appointments on: ${tomorrowStr}`);
    
    // Get all appointments for tomorrow
    const appointments = await storage.getAppointmentsByDate(tomorrowStr);
    
    if (!appointments || appointments.length === 0) {
      console.log(`📅 No appointments found for tomorrow (${tomorrowStr})`);
      process.exit(0);
    }
    
    console.log(`📋 Found ${appointments.length} total appointments for tomorrow`);
    
    // Filter for appointments that haven't been sent reminders yet
    const pendingReminders = appointments.filter(apt => 
      !apt.reminderSent && 
      apt.status === 'scheduled' &&
      apt.client.phone &&
      whatsAppService.validatePhoneNumber(apt.client.phone)
    );
    
    const invalidNumbers = appointments.filter(apt => 
      !apt.reminderSent && 
      apt.status === 'scheduled' &&
      (!apt.client.phone || !whatsAppService.validatePhoneNumber(apt.client.phone))
    );
    
    const alreadySent = appointments.filter(apt => apt.reminderSent);
    
    // Count unique clients for better summary
    const uniquePendingClients = new Set(pendingReminders.map(apt => apt.client.phone)).size;
    
    console.log(`\n📊 Summary:`);
    console.log(`   ✅ Already sent: ${alreadySent.length} appointments`);
    console.log(`   📱 Ready to send: ${pendingReminders.length} appointments (${uniquePendingClients} unique clients)`);
    console.log(`   ⚠️ Invalid numbers: ${invalidNumbers.length} appointments`);
    
    if (invalidNumbers.length > 0) {
      console.log(`\n⚠️ Appointments with invalid phone numbers:`);
      invalidNumbers.forEach(apt => {
        console.log(`   - ${apt.client.firstName} ${apt.client.lastName} (${apt.client.phone}) at ${apt.startTime}`);
      });
    }
    
    if (pendingReminders.length === 0) {
      console.log(`\n✅ No reminders need to be sent (all valid appointments already have reminders sent)`);
      process.exit(0);
    }
    
    // Group appointments by client phone number to avoid duplicate messages
    const clientGroups = new Map();
    
    pendingReminders.forEach(appointment => {
      const clientKey = appointment.client.phone;
      if (!clientGroups.has(clientKey)) {
        clientGroups.set(clientKey, {
          client: appointment.client,
          appointments: []
        });
      }
      clientGroups.get(clientKey).appointments.push(appointment);
    });
    
    const uniqueClients = clientGroups.size;
    console.log(`\n📱 Sending reminders to ${uniqueClients} unique clients (${pendingReminders.length} total appointments)...\n`);
    
    let remindersSent = 0;
    let remindersFailed = 0;
    let appointmentsProcessed = 0;
    
    for (const [clientPhone, clientData] of clientGroups) {
      try {
        const { client, appointments } = clientData;
        const appointmentCount = appointments.length;
        
        if (appointmentCount === 1) {
          console.log(`📱 Sending reminder to ${client.firstName} ${client.lastName} (${clientPhone}) for ${appointments[0].startTime} - ${appointments[0].service.name}`);
        } else {
          const times = appointments.map(apt => `${apt.startTime} (${apt.service.name})`).join(', ');
          console.log(`📱 Sending reminder to ${client.firstName} ${client.lastName} (${clientPhone}) for ${appointmentCount} appointments: ${times}`);
        }
        
        // Send ONE WhatsApp message per client with all their appointments
        const reminderSent = await whatsAppService.sendClientDailyReminder({
          clientName: client.firstName,
          clientPhone: client.phone,
          appointments: appointments.map(apt => ({
            appointmentTime: apt.startTime.slice(0, 5), // Format HH:MM
            serviceName: apt.service.name
          }))
        });
        
        if (reminderSent) {
          // Mark ALL appointments for this client as sent
          for (const appointment of appointments) {
            await storage.markReminderSent(appointment.id);
            appointmentsProcessed++;
          }
          remindersSent++;
          
          console.log(`✅ Reminder sent and ${appointmentCount} appointment(s) marked as sent for ${client.firstName} ${client.lastName}`);
        } else {
          remindersFailed++;
          console.log(`❌ Failed to send reminder to ${client.firstName} ${client.lastName}`);
        }
        
        // Add small delay between messages to avoid rate limiting
        await new Promise(resolve => setTimeout(resolve, 2000));
        
      } catch (error) {
        remindersFailed++;
        console.error(`❌ Error processing client ${clientPhone}:`, error);
      }
    }
    
    console.log(`\n📊 Final Summary:`);
    console.log(`   ✅ Clients contacted successfully: ${remindersSent}`);
    console.log(`   📋 Appointments marked as sent: ${appointmentsProcessed}`);
    console.log(`   ❌ Failed to send: ${remindersFailed}`);
    console.log(`   👥 Total unique clients: ${uniqueClients}`);
    console.log(`   📅 Date: ${tomorrowStr}`);
    
    if (remindersSent > 0) {
      console.log(`\n🎉 Successfully sent ${remindersSent} WhatsApp reminders covering ${appointmentsProcessed} appointments!`);
    }
    
  } catch (error) {
    console.error('❌ Error in manual reminder sending:', error);
  } finally {
    console.log('\n🏁 Manual reminder sending completed');
    process.exit(0);
  }
  
}).catch(error => {
  console.error('❌ Error loading modules:', error);
  process.exit(1);
}); 