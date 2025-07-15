import { storage } from '../storage';
import { whatsAppService } from './whatsapp';
import { format, addHours, subHours, isAfter, isBefore } from 'date-fns';
import { it } from 'date-fns/locale';

export class ReminderScheduler {
  private isRunning: boolean = false;
  private scheduledReminders: Map<string, NodeJS.Timeout> = new Map();

  /**
   * Checks for appointments that need reminders sent exactly 24 hours before
   */
  async sendPreciseReminders(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Reminder scheduler already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🔔 Starting precise 24-hour reminder check...');

    try {
      const now = new Date();
      const next24Hours = addHours(now, 24);
      const next25Hours = addHours(now, 25); // Check 1-hour window
      
      // Get appointments in the next 24-25 hour window
      const startDate = format(next24Hours, 'yyyy-MM-dd');
      const endDate = format(next25Hours, 'yyyy-MM-dd');
      
      console.log(`🔍 Checking for appointments between ${startDate} and ${endDate}`);
      
      let appointments = [];
      
      // Get appointments for today if next24Hours is today
      if (format(next24Hours, 'yyyy-MM-dd') === format(now, 'yyyy-MM-dd')) {
        appointments = [...appointments, ...(await storage.getAppointmentsByDate(startDate))];
      }
      
      // Get appointments for tomorrow if next24Hours spans to tomorrow
      if (startDate !== endDate) {
        appointments = [...appointments, ...(await storage.getAppointmentsByDate(endDate))];
      } else {
        appointments = await storage.getAppointmentsByDate(startDate);
      }

      if (!appointments || appointments.length === 0) {
        console.log(`📅 No appointments found in 24-hour window`);
        this.isRunning = false;
        return;
      }

      console.log(`📋 Found ${appointments.length} appointments to check for 24h reminders`);

      let remindersSent = 0;

      for (const appointment of appointments) {
        try {
          // Calculate exact appointment datetime
          const appointmentDateTime = new Date(`${appointment.date}T${appointment.startTime}`);
          const reminderTime = subHours(appointmentDateTime, 24);
          const timeDiff = reminderTime.getTime() - now.getTime();
          
          // Send reminder if it's within the next 60 minutes (to account for check frequency)
          if (timeDiff <= 60 * 60 * 1000 && timeDiff >= -10 * 60 * 1000) { // Next hour or last 10 minutes
            
            // Check if reminder already sent
            if (appointment.reminderSent) {
              console.log(`✅ Reminder already sent for ${appointment.client.firstName} ${appointment.client.lastName} on ${appointment.date} at ${appointment.startTime}`);
              continue;
            }

            // Validate phone number
            if (!appointment.client.phone || !whatsAppService.validatePhoneNumber(appointment.client.phone)) {
              console.log(`⚠️ Invalid phone number for ${appointment.client.firstName}: ${appointment.client.phone}`);
              continue;
            }

            // Send WhatsApp reminder
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
              
              const exactTime = format(appointmentDateTime, 'PPpp', { locale: it });
              console.log(`✅ 24h reminder sent to ${appointment.client.firstName} ${appointment.client.lastName} for appointment at ${exactTime}`);
            } else {
              console.log(`❌ Failed to send 24h reminder to ${appointment.client.firstName} ${appointment.client.lastName}`);
            }

            // Add small delay between messages to avoid rate limiting
            await new Promise(resolve => setTimeout(resolve, 1000));
          }
          
        } catch (error) {
          console.error(`❌ Error processing appointment ${appointment.id}:`, error);
        }
      }

      console.log(`📊 Precise reminder summary: ${remindersSent} reminders sent`);

    } catch (error) {
      console.error('❌ Error in precise reminder check:', error);
    } finally {
      this.isRunning = false;
      console.log('🏁 Precise reminder check completed');
    }
  }

  /**
   * Legacy method for backwards compatibility - now calls precise reminders
   */
  async sendDailyReminders(): Promise<void> {
    return this.sendPreciseReminders();
  }

  /**
   * Starts the scheduler to run every 30 minutes for precise timing
   */
  startScheduler(): void {
    console.log('⏰ Starting precise 24-hour WhatsApp reminder scheduler...');
    console.log('📅 Reminders will be sent exactly 24 hours before each appointment');

    // Run immediately for testing
    this.sendPreciseReminders();

    // Schedule execution every 30 minutes for precision
    setInterval(() => {
      this.sendPreciseReminders();
    }, 30 * 60 * 1000); // 30 minutes

    console.log(`⏰ Scheduler running every 30 minutes for precise 24-hour reminders`);
  }

  /**
   * Manual trigger for testing purposes
   */
  async triggerManualReminder(): Promise<void> {
    console.log('🧪 Manual precise reminder trigger activated');
    await this.sendPreciseReminders();
  }

  /**
   * Schedule a specific reminder for an appointment (for future use)
   */
  async scheduleSpecificReminder(appointmentId: number, appointmentDateTime: Date): Promise<void> {
    const reminderTime = subHours(appointmentDateTime, 24);
    const now = new Date();
    const delay = reminderTime.getTime() - now.getTime();

    if (delay > 0) {
      const timeoutId = setTimeout(async () => {
        try {
          // Get fresh appointment data
          const appointment = await storage.getAppointment(appointmentId);
          if (appointment && !appointment.reminderSent) {
            const reminderSent = await whatsAppService.sendClientDailyReminder({
              clientName: appointment.client.firstName,
              clientPhone: appointment.client.phone,
              appointments: [{
                appointmentTime: appointment.startTime.slice(0, 5),
                serviceName: appointment.service.name
              }]
            });

            if (reminderSent) {
              await storage.markReminderSent(appointmentId);
              console.log(`✅ Scheduled 24h reminder sent for appointment ${appointmentId}`);
            }
          }
        } catch (error) {
          console.error(`❌ Error sending scheduled reminder for appointment ${appointmentId}:`, error);
        } finally {
          this.scheduledReminders.delete(appointmentId.toString());
        }
      }, delay);

      this.scheduledReminders.set(appointmentId.toString(), timeoutId);
      console.log(`📅 Scheduled 24h reminder for appointment ${appointmentId} at ${format(reminderTime, 'PPpp', { locale: it })}`);
    }
  }

  /**
   * Cancel a scheduled reminder
   */
  cancelScheduledReminder(appointmentId: number): void {
    const timeoutId = this.scheduledReminders.get(appointmentId.toString());
    if (timeoutId) {
      clearTimeout(timeoutId);
      this.scheduledReminders.delete(appointmentId.toString());
      console.log(`❌ Cancelled scheduled reminder for appointment ${appointmentId}`);
    }
  }
}

export const reminderScheduler = new ReminderScheduler();