import { format } from "date-fns";
import { it } from "date-fns/locale";

interface WhatsAppMessage {
  to: string;
  message: string;
}

interface AppointmentReminder {
  clientName: string;
  clientPhone: string;
  appointmentTime: string;
  serviceName: string;
}

interface ClientAppointment {
  appointmentTime: string;
  serviceName: string;
}

interface ClientDailyReminder {
  clientName: string;
  clientPhone: string;
  appointments: ClientAppointment[];
}

interface WhatsAppAPIResponse {
  messaging_product: string;
  contacts: Array<{
    input: string;
    wa_id: string;
  }>;
  messages: Array<{
    id: string;
  }>;
}

export class WhatsAppService {
  private apiUrl: string;
  private accessToken: string;
  private phoneNumberId: string;
  private businessAccountId: string;

  constructor() {
    // WhatsApp Business API configuration
    this.apiUrl = "https://graph.facebook.com/v18.0";
    this.accessToken = process.env.WHATSAPP_ACCESS_TOKEN || "";
    this.phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID || "";
    this.businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID || "";

    // Validate required environment variables
    if (!this.accessToken) {
      console.warn("⚠️ WHATSAPP_ACCESS_TOKEN not configured - WhatsApp messages will be logged only");
    }
    if (!this.phoneNumberId) {
      console.warn("⚠️ WHATSAPP_PHONE_NUMBER_ID not configured - WhatsApp messages will be logged only");
    }
  }

  /**
   * Formats the reminder message template for single appointment
   */
  private formatReminderMessage(reminder: AppointmentReminder): string {
    return `Ciao ${reminder.clientName}, ti ricordiamo il tuo appuntamento di domani alle ${reminder.appointmentTime} per ${reminder.serviceName}. A presto! 💇‍♀️`;
  }

  /**
   * Formats the reminder message for multiple appointments in the same day
   */
  private formatClientDailyReminderMessage(reminder: ClientDailyReminder): string {
    const { clientName, appointments } = reminder;
    
    if (appointments.length === 1) {
      // Single appointment - use the standard format
      return `Ciao ${clientName}, ti ricordiamo il tuo appuntamento di domani alle ${appointments[0].appointmentTime} per ${appointments[0].serviceName}. A presto! 💇‍♀️`;
    } else {
      // Multiple appointments - use same format but mention the first appointment
      // This keeps the same message structure but still sends only one message per client
      return `Ciao ${clientName}, ti ricordiamo il tuo appuntamento di domani alle ${appointments[0].appointmentTime} per ${appointments[0].serviceName}. A presto! 💇‍♀️`;
    }
  }

  /**
   * Formats phone number for WhatsApp API (removes spaces, ensures + prefix)
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let formatted = phone.replace(/[^\d+]/g, '');
    
    // Ensure it starts with +
    if (!formatted.startsWith('+')) {
      formatted = '+' + formatted;
    }
    
    return formatted;
  }

  /**
   * Sends a WhatsApp message using the real WhatsApp Business API
   */
  private async sendMessage(message: WhatsAppMessage): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(message.to);
      
      console.log(`📱 [WhatsApp] Sending to ${formattedPhone}:`);
      console.log(`📝 [Message] ${message.message}`);

      // If credentials are not configured, log the message and return success (for development)
      if (!this.accessToken || !this.phoneNumberId) {
        console.log("🔧 WhatsApp credentials not configured - message logged only");
        return true;
      }

      // Prepare the API request
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "text",
        text: {
          body: message.message
        }
      };

      // Make the API call
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${this.accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error(`❌ WhatsApp API error (${response.status}):`, errorText);
        return false;
      }

      const result: WhatsAppAPIResponse = await response.json();
      
      if (result.messages && result.messages.length > 0) {
        console.log(`✅ WhatsApp message sent successfully. Message ID: ${result.messages[0].id}`);
        return true;
      } else {
        console.error("❌ WhatsApp API returned no message ID");
        return false;
      }

    } catch (error) {
      console.error('❌ WhatsApp sending failed:', error);
      return false;
    }
  }

  /**
   * Sends appointment reminder via WhatsApp (legacy method for single appointments)
   */
  async sendAppointmentReminder(reminder: AppointmentReminder): Promise<boolean> {
    const message = this.formatReminderMessage(reminder);
    
    return await this.sendMessage({
      to: reminder.clientPhone,
      message: message
    });
  }

  /**
   * Sends daily reminder to client with all their appointments for the day
   */
  async sendClientDailyReminder(reminder: ClientDailyReminder): Promise<boolean> {
    const message = this.formatClientDailyReminderMessage(reminder);
    
    return await this.sendMessage({
      to: reminder.clientPhone,
      message: message
    });
  }

  /**
   * Sends a custom message using a template from the database
   */
  async sendCustomMessage(phoneNumber: string, message: string): Promise<boolean> {
    return await this.sendMessage({
      to: phoneNumber,
      message: message
    });
  }

  /**
   * Validates phone number format
   */
  validatePhoneNumber(phone: string): boolean {
    // Basic phone number validation - adjust regex as needed
    const phoneRegex = /^\+?[1-9]\d{1,14}$/;
    return phoneRegex.test(phone.replace(/\s+/g, ''));
  }

  /**
   * Get service status and configuration
   */
  getStatus() {
    return {
      configured: !!(this.accessToken && this.phoneNumberId),
      hasAccessToken: !!this.accessToken,
      hasPhoneNumberId: !!this.phoneNumberId,
      hasBusinessAccountId: !!this.businessAccountId,
      apiUrl: this.apiUrl
    };
  }
}

export const whatsAppService = new WhatsAppService();