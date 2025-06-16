import { storage } from "../storage";
import type { RecurringReminderWithDetails } from "@shared/schema";

export class RecurringReminderService {
  private isRunning = false;
  private intervalId: NodeJS.Timeout | null = null;

  constructor() {
    // Start the service automatically
    this.start();
  }

  /**
   * Start the recurring reminder service
   * Checks for active reminders every hour
   */
  start() {
    if (this.isRunning) {
      console.log("🔔 Recurring reminder service is already running");
      return;
    }

    this.isRunning = true;
    console.log("🔔 Starting recurring reminder service...");

    // Check immediately on start
    this.checkAndSendReminders();

    // Then check every hour
    this.intervalId = setInterval(() => {
      this.checkAndSendReminders();
    }, 60 * 60 * 1000); // 1 hour

    console.log("✅ Recurring reminder service started successfully");
  }

  /**
   * Stop the recurring reminder service
   */
  stop() {
    if (!this.isRunning) {
      console.log("🔔 Recurring reminder service is not running");
      return;
    }

    this.isRunning = false;
    if (this.intervalId) {
      clearInterval(this.intervalId);
      this.intervalId = null;
    }

    console.log("🛑 Recurring reminder service stopped");
  }

  /**
   * Check for active reminders and send them
   */
  private async checkAndSendReminders() {
    try {
      console.log("🔍 Checking for active recurring reminders...");
      
      const activeReminders = await storage.getActiveRecurringReminders();
      
      if (activeReminders.length === 0) {
        console.log("📭 No active reminders to send");
        return;
      }

      console.log(`📬 Found ${activeReminders.length} active reminders to process`);

      for (const reminder of activeReminders) {
        await this.processReminder(reminder);
      }

      console.log("✅ Finished processing all active reminders");
    } catch (error) {
      console.error("❌ Error checking recurring reminders:", error);
    }
  }

  /**
   * Process a single reminder
   */
  private async processReminder(reminder: RecurringReminderWithDetails) {
    try {
      console.log(`📤 Processing reminder for ${reminder.client.firstName} ${reminder.client.lastName}`);

      // Create the reminder message
      const message = this.createReminderMessage(reminder);

      // Send WhatsApp message (simulate for now)
      const success = await this.sendWhatsAppMessage(reminder.client.phone, message);

      if (success) {
        // Calculate next reminder date
        const nextDate = this.calculateNextReminderDate(
          reminder.frequency,
          reminder.dayOfWeek,
          reminder.dayOfMonth
        );

        // Update the reminder with next date
        await storage.updateNextReminderDate(reminder.id, nextDate);

        console.log(`✅ Reminder sent successfully to ${reminder.client.firstName} ${reminder.client.lastName}`);
        console.log(`📅 Next reminder scheduled for: ${nextDate}`);
      } else {
        console.error(`❌ Failed to send reminder to ${reminder.client.firstName} ${reminder.client.lastName}`);
      }
    } catch (error) {
      console.error(`❌ Error processing reminder for ${reminder.client.firstName} ${reminder.client.lastName}:`, error);
    }
  }

  /**
   * Create a personalized reminder message
   */
  private createReminderMessage(reminder: RecurringReminderWithDetails): string {
    const clientName = reminder.client.firstName;
    const serviceName = reminder.service.name;
    const stylistName = reminder.stylist.name;
    const preferredTime = reminder.preferredTime || "orario da concordare";

    // Get tomorrow's date for the reminder
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toLocaleDateString('it-IT', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });

    return `Ciao ${clientName}! 💇‍♀️

È il momento di prenotare il tuo appuntamento per ${serviceName.toLowerCase()} con ${stylistName}.

📅 Ti suggeriamo per ${tomorrowStr} alle ${preferredTime}

Chiamaci per confermare o scegliere un altro orario che ti è più comodo.

A presto! ✨

*Questo è un promemoria automatico basato sui tuoi appuntamenti abituali*`;
  }

  /**
   * Send WhatsApp message (placeholder implementation)
   * In a real implementation, this would integrate with WhatsApp Business API
   */
  private async sendWhatsAppMessage(phoneNumber: string, message: string): Promise<boolean> {
    try {
      // Simulate API call delay
      await new Promise(resolve => setTimeout(resolve, 1000));

      // Log the message that would be sent
      console.log(`📱 WhatsApp message to ${phoneNumber}:`);
      console.log(`📝 Message: ${message}`);
      console.log("---");

      // For now, always return success
      // In a real implementation, you would:
      // 1. Format the phone number correctly
      // 2. Call WhatsApp Business API
      // 3. Handle API response and errors
      // 4. Return actual success/failure status

      return true;
    } catch (error) {
      console.error("❌ Error sending WhatsApp message:", error);
      return false;
    }
  }

  /**
   * Calculate the next reminder date based on frequency
   */
  private calculateNextReminderDate(
    frequency: string,
    dayOfWeek?: number | null,
    dayOfMonth?: number | null
  ): string {
    const today = new Date();
    let nextDate = new Date(today);

    switch (frequency) {
      case 'weekly':
        if (dayOfWeek !== undefined && dayOfWeek !== null) {
          // Find next occurrence of the specified day of week
          const daysUntilTarget = (dayOfWeek - today.getDay() + 7) % 7;
          if (daysUntilTarget === 0) {
            // If today is the target day, schedule for next week
            nextDate.setDate(today.getDate() + 7);
          } else {
            nextDate.setDate(today.getDate() + daysUntilTarget);
          }
        } else {
          // Default to next week
          nextDate.setDate(today.getDate() + 7);
        }
        break;

      case 'biweekly':
        if (dayOfWeek !== undefined && dayOfWeek !== null) {
          const daysUntilTarget = (dayOfWeek - today.getDay() + 7) % 7;
          nextDate.setDate(today.getDate() + daysUntilTarget + 14);
        } else {
          nextDate.setDate(today.getDate() + 14);
        }
        break;

      case 'monthly':
        if (dayOfMonth !== undefined && dayOfMonth !== null) {
          nextDate.setMonth(today.getMonth() + 1);
          nextDate.setDate(dayOfMonth);
          
          // If the day doesn't exist in the next month, set to last day of month
          if (nextDate.getDate() !== dayOfMonth) {
            nextDate.setDate(0); // Last day of previous month
          }
        } else {
          // Default to same day next month
          nextDate.setMonth(today.getMonth() + 1);
        }
        break;

      default:
        // Default to weekly
        nextDate.setDate(today.getDate() + 7);
    }

    return nextDate.toISOString().split('T')[0];
  }

  /**
   * Get service status
   */
  getStatus() {
    return {
      isRunning: this.isRunning,
      intervalId: this.intervalId !== null,
    };
  }

  /**
   * Manually trigger reminder check (for testing)
   */
  async triggerCheck() {
    console.log("🔧 Manually triggering reminder check...");
    await this.checkAndSendReminders();
  }
}

// Create and export a singleton instance
export const recurringReminderService = new RecurringReminderService(); 