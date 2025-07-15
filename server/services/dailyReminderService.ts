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
      
      // Get all appointments for tomorrow
      const appointments = await storage.getAppointmentsByDate(tomorrowStr);
      
      if (!appointments || appointments.length === 0) {
        console.log(`📅 No appointments found for tomorrow (${tomorrowStr})`);
        this.isRunning = false;
        return;
      }
      
      console.log(`📋 Found ${appointments.length} appointments for tomorrow`);
      
      let remindersSent = 0;
      let remindersSkipped = 0;
      
      for (const appointment of appointments) {
        try {
          // Skip if reminder already sent
          if (appointment.reminderSent) {
            console.log(`⏭️ Reminder already sent for ${appointment.client.firstName} ${appointment.client.lastName} at ${appointment.startTime}`);
            remindersSkipped++;
            continue;
          }
          
          // Skip if appointment is not scheduled
          if (appointment.status !== 'scheduled') {
            console.log(`⏭️ Skipping ${appointment.client.firstName} ${appointment.client.lastName} - status: ${appointment.status}`);
            remindersSkipped++;
            continue;
          }
          
          // Validate phone number
          if (!appointment.client.phone || !whatsAppService.validatePhoneNumber(appointment.client.phone)) {
            console.log(`⚠️ Invalid phone number for ${appointment.client.firstName} ${appointment.client.lastName}: ${appointment.client.phone}`);
            remindersSkipped++;
            continue;
          }
          
          // Send WhatsApp reminder using approved template
          console.log(`📱 Sending reminder to ${appointment.client.firstName} ${appointment.client.lastName} (${appointment.client.phone}) for ${appointment.startTime}`);
          
          const reminderSent = await whatsAppService.sendClientDailyReminder({
            clientName: appointment.client.firstName,
            clientPhone: appointment.client.phone,
            appointments: [{
              appointmentTime: appointment.startTime.slice(0, 5), // Format HH:MM
              serviceName: appointment.service.name
            }]
          });
          
          if (reminderSent) {
            // Mark reminder as sent
            await storage.markReminderSent(appointment.id);
            remindersSent++;
            
            console.log(`✅ Reminder sent to ${appointment.client.firstName} ${appointment.client.lastName} for ${appointment.startTime}`);
          } else {
            console.log(`❌ Failed to send reminder to ${appointment.client.firstName} ${appointment.client.lastName}`);
          }
          
          // Add small delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 2000));
          
        } catch (error) {
          console.error(`❌ Error processing appointment ${appointment.id}:`, error);
        }
      }
      
      console.log(`📊 Daily reminder summary:`);
      console.log(`   ✅ Reminders sent: ${remindersSent}`);
      console.log(`   ⏭️ Reminders skipped: ${remindersSkipped}`);
      console.log(`   📋 Total appointments: ${appointments.length}`);
      
    } catch (error) {
      console.error('❌ Error in daily reminder service:', error);
    } finally {
      this.isRunning = false;
      console.log('🏁 Daily reminder service completed');
    }
  }

  /**
   * Starts the daily scheduler to run at 9:00 AM every day
   */
  startDailyScheduler(): void {
    console.log('🌅 Starting daily reminder scheduler...');
    console.log('📅 Reminders will be sent every day at 9:00 AM for next day appointments');
    
    // Calculate milliseconds until next 9:00 AM
    const now = new Date();
    const next9AM = new Date(now);
    next9AM.setHours(9, 0, 0, 0);
    
    // If it's already past 9:00 AM today, schedule for tomorrow
    if (now.getTime() >= next9AM.getTime()) {
      next9AM.setDate(next9AM.getDate() + 1);
    }
    
    const timeUntilNext9AM = next9AM.getTime() - now.getTime();
    
    console.log(`⏰ Next reminder run scheduled for: ${format(next9AM, 'PPpp', { locale: it })}`);
    console.log(`⏱️ Time until next run: ${Math.round(timeUntilNext9AM / 1000 / 60)} minutes`);
    
    // Schedule first run
    setTimeout(() => {
      this.sendDailyReminders();
      
      // Then schedule every 24 hours
      setInterval(() => {
        this.sendDailyReminders();
      }, 24 * 60 * 60 * 1000); // 24 hours
      
    }, timeUntilNext9AM);
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