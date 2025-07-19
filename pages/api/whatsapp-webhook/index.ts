import type { NextApiRequest, NextApiResponse } from 'next';
import { storage } from '../../../api-serverless/lib/storage';

interface WhatsAppStatusUpdate {
  object: string;
  entry: Array<{
    id: string;
    changes: Array<{
      value: {
        messaging_product: string;
        metadata: {
          display_phone_number: string;
          phone_number_id: string;
        };
        statuses?: Array<{
          id: string;
          status: 'sent' | 'delivered' | 'read' | 'failed';
          timestamp: string;
          recipient_id: string;
          errors?: Array<{
            code: number;
            title: string;
            message: string;
          }>;
        }>;
        messages?: Array<{
          from: string;
          id: string;
          timestamp: string;
          text?: {
            body: string;
          };
          type: string;
        }>;
      };
      field: string;
    }>;
  }>;
}

interface MessageStatus {
  messageId: string;
  status: 'sent' | 'delivered' | 'read' | 'failed';
  timestamp: string;
  recipientPhone: string;
  errorCode?: number;
  errorMessage?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method === 'GET') {
    // WhatsApp webhook verification
    const { 'hub.mode': mode, 'hub.verify_token': token, 'hub.challenge': challenge } = req.query;
    
    const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
    
    console.log('🔗 WhatsApp webhook verification request:', { mode, token, challenge });
    
    if (mode === 'subscribe' && token === VERIFY_TOKEN) {
      console.log('✅ WhatsApp webhook verified successfully');
      return res.status(200).send(challenge as string);
    } else {
      console.error('❌ WhatsApp webhook verification failed');
      return res.status(403).send('Forbidden');
    }
  }

  if (req.method === 'POST') {
    try {
      const body: WhatsAppStatusUpdate = req.body;
      
      console.log('📨 WhatsApp webhook received:', JSON.stringify(body, null, 2));
      
      // Validate webhook structure
      if (!body.object || body.object !== 'whatsapp_business_account') {
        console.log('⚠️ Invalid webhook object type:', body.object);
        return res.status(200).send('OK');
      }
      
      // Process each entry
      for (const entry of body.entry) {
        for (const change of entry.changes) {
          if (change.field === 'messages') {
            await processMessageUpdates(change.value);
          }
        }
      }
      
      return res.status(200).send('OK');
      
    } catch (error) {
      console.error('❌ Error processing WhatsApp webhook:', error);
      return res.status(500).send('Internal Server Error');
    }
  }

  return res.status(405).send('Method Not Allowed');
}

async function processMessageUpdates(value: any) {
  // Process status updates (delivery receipts)
  if (value.statuses && value.statuses.length > 0) {
    for (const status of value.statuses) {
      const messageStatus: MessageStatus = {
        messageId: status.id,
        status: status.status,
        timestamp: status.timestamp,
        recipientPhone: status.recipient_id,
        errorCode: status.errors?.[0]?.code,
        errorMessage: status.errors?.[0]?.message
      };
      
      console.log(`📊 Message status update:`, messageStatus);
      
      // Store message status in database
      await storeMessageStatus(messageStatus);
    }
  }
  
  // Process incoming messages (optional - for future use)
  if (value.messages && value.messages.length > 0) {
    for (const message of value.messages) {
      console.log(`📥 Incoming message from ${message.from}:`, message.text?.body);
      // Could be used for handling customer replies in the future
    }
  }
}

async function storeMessageStatus(messageStatus: MessageStatus) {
  try {
    // Create table if it doesn't exist
    await storage.query(`
      CREATE TABLE IF NOT EXISTS whatsapp_message_status (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        message_id TEXT NOT NULL,
        status TEXT NOT NULL,
        timestamp TEXT NOT NULL,
        recipient_phone TEXT NOT NULL,
        error_code INTEGER,
        error_message TEXT,
        created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
        UNIQUE(message_id, status) ON CONFLICT REPLACE
      )
    `);
    
    // Insert message status
    await storage.query(`
      INSERT OR REPLACE INTO whatsapp_message_status 
      (message_id, status, timestamp, recipient_phone, error_code, error_message)
      VALUES (?, ?, ?, ?, ?, ?)
    `, [
      messageStatus.messageId,
      messageStatus.status,
      messageStatus.timestamp,
      messageStatus.recipientPhone,
      messageStatus.errorCode || null,
      messageStatus.errorMessage || null
    ]);
    
    console.log(`✅ Stored message status: ${messageStatus.messageId} -> ${messageStatus.status}`);
    
    // Log delivery failures for monitoring
    if (messageStatus.status === 'failed') {
      console.error(`🚨 Message delivery failed:`, {
        messageId: messageStatus.messageId,
        recipient: messageStatus.recipientPhone,
        errorCode: messageStatus.errorCode,
        errorMessage: messageStatus.errorMessage
      });
    }
    
  } catch (error) {
    console.error('❌ Error storing message status:', error);
  }
}