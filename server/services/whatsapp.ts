import { format } from "date-fns";
import { it } from "date-fns/locale";
import { pool } from '../db';

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
   * Automatically adds +39 for Italian numbers
   */
  private formatPhoneNumber(phone: string): string {
    // Remove all non-digit characters except +
    let formatted = phone.replace(/[^\d+]/g, '');
    
    // If it doesn't start with +, add Italian country code
    if (!formatted.startsWith('+')) {
      // If it's a 10-digit number starting with 3, assume it's Italian mobile
      if (formatted.length === 10 && formatted.startsWith('3')) {
        formatted = '+39' + formatted;
      }
      // If it already has 39 prefix, just add +
      else if (formatted.startsWith('39') && formatted.length === 12) {
        formatted = '+' + formatted;
      }
      // Otherwise, assume Italian and add +39
      else {
        formatted = '+39' + formatted;
      }
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
        const messageId = result.messages[0].id;
        console.log(`✅ WhatsApp message sent successfully. Message ID: ${messageId}`);
        
        // Store message for tracking
        await this.storeMessageForTracking(messageId, formattedPhone, message.message);
        
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
   * Sends daily reminder to client with all their appointments for the day using approved template
   */
  async sendClientDailyReminder(reminder: ClientDailyReminder): Promise<boolean> {
    // Use the first appointment for the reminder (as before)
    const appointment = reminder.appointments[0];
    
    return await this.sendTemplateMessage({
      to: reminder.clientPhone,
      templateName: 'appointment_reminder',
      parameters: [
        reminder.clientName,           // {{1}} - Client name
        appointment.appointmentTime    // {{2}} - Time
        // Note: Service name removed - template only has 2 parameters
      ]
    });
  }

  /**
   * Sends a WhatsApp message using approved template
   */
  private async sendTemplateMessage(templateMessage: {
    to: string;
    templateName: string;
    parameters: string[];
  }): Promise<boolean> {
    try {
      const formattedPhone = this.formatPhoneNumber(templateMessage.to);
      
      console.log(`📱 [WhatsApp Template] Sending "${templateMessage.templateName}" to ${formattedPhone}:`);
      console.log(`📝 [Parameters] ${templateMessage.parameters.join(', ')}`);
      
      // If credentials are not configured, log the message and return success (for development)
      if (!this.accessToken || !this.phoneNumberId) {
        console.log("🔧 WhatsApp credentials not configured - template message logged only");
        return true;
      }

      // Prepare the template API request
      const url = `${this.apiUrl}/${this.phoneNumberId}/messages`;
      const payload = {
        messaging_product: "whatsapp",
        to: formattedPhone,
        type: "template",
        template: {
          name: templateMessage.templateName,
          language: {
            code: "it"
          },
          components: [
            {
              type: "body",
              parameters: templateMessage.parameters.map(param => ({
                type: "text",
                text: param
              }))
            }
          ]
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
        console.error(`❌ WhatsApp Template API error (${response.status}):`, errorText);
        return false;
      }

      const result: WhatsAppAPIResponse = await response.json();
      
      if (result.messages && result.messages.length > 0) {
        const messageId = result.messages[0].id;
        console.log(`✅ WhatsApp template message sent successfully. Message ID: ${messageId}`);
        
        // Store template message for tracking
        const templateText = `Template: ${templateMessage.templateName} with params: ${templateMessage.parameters.join(', ')}`;
        await this.storeMessageForTracking(messageId, formattedPhone, templateText);
        
        return true;
      } else {
        console.error("❌ WhatsApp Template API returned no message ID");
        return false;
      }

    } catch (error) {
      console.error('❌ WhatsApp template sending failed:', error);
      return false;
    }
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
   * Accepts Italian mobile numbers (10 digits starting with 3) and international format
   */
  validatePhoneNumber(phone: string): boolean {
    // Sanitize: allow only digits and optional leading +
    const cleanedPhone = phone.replace(/[^\d+]/g, '');

    // Support 0039 prefix by normalizing to +39
    const normalizedPhone = cleanedPhone.startsWith('0039')
      ? '+39' + cleanedPhone.slice(4)
      : cleanedPhone;

    // Italian mobile number patterns
    const italianMobileRegex = /^3\d{9}$/; // 10 digits starting with 3
    const italianWithCountryRegex = /^39\d{10}$/; // 39 + 10 digits
    const internationalRegex = /^\+39\d{10}$/; // +39 + 10 digits
    const generalInternationalRegex = /^\+[1-9]\d{1,14}$/; // General international format
    
    return italianMobileRegex.test(normalizedPhone) || 
           italianWithCountryRegex.test(normalizedPhone) ||
           internationalRegex.test(normalizedPhone) ||
           generalInternationalRegex.test(normalizedPhone);
  }

  /**
   * Store message information for delivery tracking
   */
  private async storeMessageForTracking(messageId: string, recipientPhone: string, messageContent: string): Promise<void> {
    try {
      // Create table if it doesn't exist (PostgreSQL syntax)
      await pool.query(`
        CREATE TABLE IF NOT EXISTS whatsapp_sent_messages (
          id SERIAL PRIMARY KEY,
          message_id TEXT NOT NULL UNIQUE,
          recipient_phone TEXT NOT NULL,
          message_content TEXT NOT NULL,
          sent_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
          last_status TEXT DEFAULT 'sent',
          last_status_update TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
      `);
      
      // Insert sent message
      await pool.query(`
        INSERT INTO whatsapp_sent_messages 
        (message_id, recipient_phone, message_content)
        VALUES ($1, $2, $3)
      `, [messageId, recipientPhone, messageContent]);
      
      console.log(`📊 Message ${messageId} stored for tracking`);
      
    } catch (error) {
      console.error('❌ Error storing message for tracking:', error);
    }
  }

  /**
   * Get delivery status for messages sent to a specific phone number
   */
  async getMessageDeliveryStatus(recipientPhone?: string, dateFrom?: string, dateTo?: string) {
    try {
      let query = `
        SELECT 
          sm.message_id,
          sm.recipient_phone,
          sm.message_content,
          sm.sent_at,
          COALESCE(ms.status, 'pending') as current_status,
          ms.timestamp as status_timestamp,
          ms.error_code,
          ms.error_message
        FROM whatsapp_sent_messages sm
        LEFT JOIN whatsapp_message_status ms ON sm.message_id = ms.message_id
        WHERE 1=1
      `;
      
      const params: (string | number)[] = [];
      let paramIndex = 1;
      
      if (recipientPhone) {
        query += ` AND sm.recipient_phone = $${paramIndex}`;
        params.push(recipientPhone);
        paramIndex++;
      }
      
      if (dateFrom) {
        query += ` AND DATE(sm.sent_at) >= $${paramIndex}`;
        params.push(dateFrom);
        paramIndex++;
      }
      
      if (dateTo) {
        query += ` AND DATE(sm.sent_at) <= $${paramIndex}`;
        params.push(dateTo);
        paramIndex++;
      }
      
      query += ` ORDER BY sm.sent_at DESC`;
      
      const result = await pool.query(query, params);
      return result.rows;
      
    } catch (error) {
      console.error('❌ Error retrieving message delivery status:', error);
      return [];
    }
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