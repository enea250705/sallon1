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
      const clientArray = Array.from(clientGroups);
      const totalClients = clientArray.length;
      
      console.log(`📱 Starting to send ${totalClients} reminders with 1-minute intervals`);
      console.log(`⏱️ Estimated completion time: ${Math.ceil(totalClients)} minutes`);
      
      for (let i = 0; i < clientArray.length; i++) {
        const [clientPhone, clientData] = clientArray[i];
        const clientNumber = i + 1;
        
        try {
          const { client, appointments } = clientData;
          const appointmentCount = appointments.length;
          
          if (appointmentCount === 1) {
            console.log(`📱 [${clientNumber}/${totalClients}] Sending reminder to ${client.firstName} ${client.lastName} (${clientPhone}) for ${appointments[0].startTime} - ${appointments[0].service.name}`);
          } else {
            const times = appointments.map((apt: any) => `${apt.startTime} (${apt.service.name})`).join(', ');
            console.log(`📱 [${clientNumber}/${totalClients}] Sending reminder to ${client.firstName} ${client.lastName} (${clientPhone}) for ${appointmentCount} appointments: ${times}`);
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
            
            console.log(`✅ [${clientNumber}/${totalClients}] Reminder sent and ${appointmentCount} appointment(s) marked for batch update`);
          } else {
            remindersFailed++;
            console.log(`❌ [${clientNumber}/${totalClients}] Failed to send reminder to ${client.firstName} ${client.lastName}`);
          }
          
          // Wait 1 minute before sending the next message (except for the last one)
          if (i < clientArray.length - 1) {
            const remainingMessages = totalClients - clientNumber;
            console.log(`⏳ Waiting 1 minute before next message (${remainingMessages} remaining)...`);
            await new Promise(resolve => setTimeout(resolve, 60000)); // 1 minute = 60000ms
          }
          
        } catch (error) {
          remindersFailed++;
          console.error(`❌ [${clientNumber}/${totalClients}] Error processing client ${clientPhone}:`, error);
          
          // Still wait 1 minute even if there was an error (except for the last one)
          if (i < clientArray.length - 1) {
            const remainingMessages = totalClients - clientNumber;
            console.log(`⏳ Waiting 1 minute before next message (${remainingMessages} remaining)...`);
            await new Promise(resolve => setTimeout(resolve, 60000));
          }
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
   * Starts the scheduler to run at 09:00 and 19:00 daily
   */
  startDailyScheduler(): void {
    console.log('🌅 Starting daily reminder scheduler...');
    console.log('📅 Reminders will be sent at 09:00 and 19:00 daily');
    
    this.scheduleAtSpecificTimes();
    
    console.log('✅ Daily scheduler configured - will run at 09:00 and 19:00');
  }

  /**
   * Schedule reminders to run at 09:00 and 19:00 daily
   */
  private scheduleAtSpecificTimes(): void {
    const scheduleNextRun = () => {
      const now = new Date();
      const today9AM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 9, 0, 0, 0);
      const today7PM = new Date(now.getFullYear(), now.getMonth(), now.getDate(), 19, 0, 0, 0);
      const tomorrow9AM = new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 9, 0, 0, 0);

      let nextRun: Date;
      let timeLabel: string;

      if (now < today9AM) {
        nextRun = today9AM;
        timeLabel = '09:00';
      } else if (now < today7PM) {
        nextRun = today7PM;
        timeLabel = '19:00';
      } else {
        nextRun = tomorrow9AM;
        timeLabel = '09:00 (tomorrow)';
      }

      const timeUntilNext = nextRun.getTime() - now.getTime();
      
      console.log(`⏰ Next reminder run scheduled for ${timeLabel} (in ${Math.round(timeUntilNext / 1000 / 60)} minutes)`);

      setTimeout(() => {
        console.log(`🔔 Scheduled reminder triggered at ${timeLabel}`);
        this.sendDailyReminders().then(() => {
          scheduleNextRun(); // Schedule the next run
        });
      }, timeUntilNext);
    };

    scheduleNextRun();
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