import { storage } from '../storage';
import { whatsAppService } from './whatsapp';
import { format, addDays } from 'date-fns';
import { it } from 'date-fns/locale';

export class ReminderScheduler {
  private isRunning: boolean = false;

  /**
   * Checks for appointments 24 hours from now and sends reminders
   */
  async sendDailyReminders(): Promise<void> {
    if (this.isRunning) {
      console.log('⏳ Reminder scheduler already running, skipping...');
      return;
    }

    this.isRunning = true;
    console.log('🔔 Starting daily reminder check...');

    try {
      // Get tomorrow's date
      const tomorrow = addDays(new Date(), 1);
      const tomorrowDate = format(tomorrow, 'yyyy-MM-dd');

      // Get all appointments for tomorrow
      const appointments = await storage.getAppointmentsByDate(tomorrowDate);

      if (!appointments || appointments.length === 0) {
        console.log(`📅 No appointments found for ${tomorrowDate}`);
        return;
      }

      console.log(`📋 Found ${appointments.length} appointments for tomorrow`);

      // Group appointments by client
      const appointmentsByClient = new Map();
      
      for (const appointment of appointments) {
        const clientId = appointment.client.id;
        
        if (!appointmentsByClient.has(clientId)) {
          appointmentsByClient.set(clientId, {
            client: appointment.client,
            appointments: []
          });
        }
        
        appointmentsByClient.get(clientId).appointments.push(appointment);
      }

      let successCount = 0;
      let failureCount = 0;

      // Process each client (send one message per client)
      for (const [clientId, clientData] of appointmentsByClient) {
        try {
          const { client, appointments: clientAppointments } = clientData;
          
          // Check if any reminder was already sent for this client today
          const alreadySent = clientAppointments.some(apt => apt.reminderSent);
          if (alreadySent) {
            console.log(`✅ Reminder already sent for client ${client.firstName} ${client.lastName}`);
            continue;
          }

          // Validate phone number
          if (!client.phone || !whatsAppService.validatePhoneNumber(client.phone)) {
            console.log(`⚠️ Invalid phone number for ${client.firstName}: ${client.phone}`);
            failureCount++;
            continue;
          }

          // Send WhatsApp reminder with all appointments
          const reminderSent = await whatsAppService.sendClientDailyReminder({
            clientName: client.firstName,
            clientPhone: client.phone,
            appointments: clientAppointments.map(apt => ({
              appointmentTime: apt.startTime.slice(0, 5), // Format HH:MM
              serviceName: apt.service.name
            }))
          });

          if (reminderSent) {
            // Mark reminder as sent for ALL appointments of this client
            for (const appointment of clientAppointments) {
              await storage.markReminderSent(appointment.id);
            }
            successCount++;
            console.log(`✅ Reminder sent to ${client.firstName} for ${clientAppointments.length} appointment(s)`);
          } else {
            failureCount++;
            console.log(`❌ Failed to send reminder to ${client.firstName}`);
          }

          // Add small delay between messages to avoid rate limiting
          await new Promise(resolve => setTimeout(resolve, 1000));

        } catch (error) {
          failureCount++;
          console.error(`❌ Error processing client ${clientId}:`, error);
        }
      }

      console.log(`📊 Reminder summary: ${successCount} clients notified, ${failureCount} failed`);

    } catch (error) {
      console.error('❌ Error in daily reminder check:', error);
    } finally {
      this.isRunning = false;
      console.log('🏁 Daily reminder check completed');
    }
  }

  /**
   * Starts the scheduler to run daily at 9 AM
   */
  startScheduler(): void {
    console.log('⏰ Starting WhatsApp reminder scheduler...');

    // Run immediately for testing
    this.sendDailyReminders();

    // Schedule daily execution at 9:00 AM
    const scheduleDaily = () => {
      const now = new Date();
      const next9AM = new Date();
      next9AM.setHours(9, 0, 0, 0);

      // If it's already past 9 AM today, schedule for tomorrow
      if (now.getTime() > next9AM.getTime()) {
        next9AM.setDate(next9AM.getDate() + 1);
      }

      const timeUntilNext9AM = next9AM.getTime() - now.getTime();

      setTimeout(() => {
        this.sendDailyReminders();
        // Schedule the next execution
        setInterval(() => {
          this.sendDailyReminders();
        }, 24 * 60 * 60 * 1000); // 24 hours
      }, timeUntilNext9AM);

      console.log(`⏰ Next reminder check scheduled for: ${format(next9AM, 'PPpp', { locale: it })}`);
    };

    scheduleDaily();
  }

  /**
   * Manual trigger for testing purposes
   */
  async triggerManualReminder(): Promise<void> {
    console.log('🧪 Manual reminder trigger activated');
    await this.sendDailyReminders();
  }
}

export const reminderScheduler = new ReminderScheduler();