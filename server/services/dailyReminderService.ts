import { storage } from '../storage';
import { whatsAppService } from './whatsapp';
import { format, addDays } from 'date-fns';
import { it } from 'date-fns/locale';

export class DailyReminderService {
  private isRunning: boolean = false;

  /**
   * Sends reminders for all appointments tomorrow (called at 9:00 AM daily)
   */
  async sendDailyReminders(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Daily reminder service already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🌅 Starting daily reminder service at 9:00 AM...');

    try {
      // Get tomorrow's date
      const tomorrow = addDays(new Date(), 1);
      const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
      
      console.log(`📅 Sending reminders for appointments on: ${tomorrowStr}`);
      
      // OPTIMIZATION: Quick lightweight check first to avoid heavy queries
      console.log('🔍 Quick check for pending reminders...');
      const pendingCount = await storage.getPendingReminderCount(tomorrowStr);
      
      if (pendingCount === 0) {
        console.log('✅ No pending reminders found - early exit (saved heavy database query!)');
        console.log('💡 This optimization prevents unnecessary compute usage');
        this.isRunning = false;
        return;
      }
      
      console.log(`📱 Found ${pendingCount} appointments needing reminders`);
      
      // Get all appointments for tomorrow
      const appointments = await storage.getAppointmentsByDate(tomorrowStr);
      
      if (!appointments || appointments.length === 0) {
        console.log(`📅 No appointments found for tomorrow (${tomorrowStr})`);
        this.isRunning = false;
        return;
      }
      
      console.log(`📋 Found ${appointments.length} appointments for tomorrow`);
      
      // Filter appointments that need reminders
      const pendingReminders = appointments.filter((apt: any) => 
        !apt.reminderSent && 
        apt.status === 'scheduled' &&
        apt.client.phone &&
        whatsAppService.validatePhoneNumber(apt.client.phone)
      );
      
      const invalidNumbers = appointments.filter((apt: any) => 
        !apt.reminderSent && 
        apt.status === 'scheduled' &&
        (!apt.client.phone || !whatsAppService.validatePhoneNumber(apt.client.phone))
      );
      
      const alreadySent = appointments.filter((apt: any) => apt.reminderSent);
      const nonScheduled = appointments.filter((apt: any) => apt.status !== 'scheduled');
      
      console.log(`📊 Appointment breakdown:`);
      console.log(`   ✅ Already sent: ${alreadySent.length}`);
      console.log(`   📱 Ready to send: ${pendingReminders.length}`);
      console.log(`   ⚠️ Invalid numbers: ${invalidNumbers.length}`);
      console.log(`   ⏭️ Non-scheduled: ${nonScheduled.length}`);
      
      if (pendingReminders.length === 0) {
        console.log(`✅ No reminders need to be sent`);
        this.isRunning = false;
        return;
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
      console.log(`📱 Sending reminders to ${uniqueClients} unique clients (${pendingReminders.length} total appointments)`);
      
      let remindersSent = 0;
      let remindersFailed = 0;
      let appointmentsProcessed = 0;
      const appointmentIdsToUpdate: number[] = [];
      
      for (const [clientPhone, clientData] of Array.from(clientGroups)) {
        try {
          const { client, appointments } = clientData;
          const appointmentCount = appointments.length;
          
          if (appointmentCount === 1) {
            console.log(`📱 Sending reminder to ${client.firstName} ${client.lastName} (${clientPhone}) for ${appointments[0].startTime} - ${appointments[0].service.name}`);
          } else {
            const times = appointments.map((apt: any) => `${apt.startTime} (${apt.service.name})`).join(', ');
            console.log(`📱 Sending reminder to ${client.firstName} ${client.lastName} (${clientPhone}) for ${appointmentCount} appointments: ${times}`);
          }
          
          // Send ONE WhatsApp message per client with all their appointments
          const reminderSent = await whatsAppService.sendClientDailyReminder({
            clientName: client.firstName,
            clientPhone: client.phone,
            appointments: appointments.map((apt: any) => ({
              appointmentTime: apt.startTime.slice(0, 5), // Format HH:MM
              serviceName: apt.service.name
            }))
          });
          
          if (reminderSent) {
            // OPTIMIZATION: Collect IDs for batch update instead of individual updates
            for (const appointment of appointments) {
              appointmentIdsToUpdate.push(appointment.id);
              appointmentsProcessed++;
            }
            remindersSent++;
            
            console.log(`✅ Reminder sent and ${appointmentCount} appointment(s) marked for batch update`);
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
      
      // OPTIMIZATION: Batch update all successful reminders at once
      if (appointmentIdsToUpdate.length > 0) {
        console.log(`🔄 Batch updating ${appointmentIdsToUpdate.length} appointments...`);
        await storage.batchMarkRemindersSent(appointmentIdsToUpdate);
        console.log(`✅ Batch update completed (much more efficient than ${appointmentIdsToUpdate.length} individual updates)`);
      }
      
      console.log(`📊 Daily reminder summary:`);
      console.log(`   ✅ Clients contacted: ${remindersSent}`);
      console.log(`   📋 Appointments processed: ${appointmentsProcessed}`);
      console.log(`   ❌ Failed to send: ${remindersFailed}`);
      console.log(`   📅 Total appointments: ${appointments.length}`);
      
    } catch (error) {
      console.error('❌ Error in daily reminder service:', error);
    } finally {
      this.isRunning = false;
      console.log('🏁 Daily reminder service completed');
    }
  }

  /**
   * Starts the hourly scheduler to check for reminders every hour
   */
  startDailyScheduler(): void {
    console.log('🌅 Starting hourly reminder scheduler...');
    console.log('📅 Reminders will be checked every hour for next day appointments');
    
    // Run immediately
    this.sendDailyReminders();
    
    // Then schedule every hour
    setInterval(() => {
      console.log('🔔 Hourly reminder check triggered');
      this.sendDailyReminders();
    }, 60 * 60 * 1000); // 1 hour
    
    console.log('✅ Hourly scheduler configured - checking every hour for appointments needing reminders');
  }

  /**
   * Manual trigger for testing purposes
   */
  async triggerManualReminder(): Promise<void> {
    console.log('🧪 Manual daily reminder trigger activated (simulating 9:00 AM)');
    await this.sendDailyReminders();
  }
}

export const dailyReminderService = new DailyReminderService();