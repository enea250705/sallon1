import { NextRequest, NextResponse } from 'next/server';
import { storage } from '../lib/storage';

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

// GET handler for webhook verification
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  
  // WhatsApp webhook verification
  const mode = searchParams.get('hub.mode');
  const token = searchParams.get('hub.verify_token');
  const challenge = searchParams.get('hub.challenge');
  
  const VERIFY_TOKEN = process.env.WHATSAPP_VERIFY_TOKEN;
  
  console.log('🔗 WhatsApp webhook verification request:', { mode, token, challenge });
  
  if (mode === 'subscribe' && token === VERIFY_TOKEN) {
    console.log('✅ WhatsApp webhook verified successfully');
    return new NextResponse(challenge, { status: 200 });
  } else {
    console.error('❌ WhatsApp webhook verification failed');
    return new NextResponse('Forbidden', { status: 403 });
  }
}

// POST handler for webhook events
export async function POST(request: NextRequest) {
  try {
    const body: WhatsAppStatusUpdate = await request.json();
    
    console.log('📨 WhatsApp webhook received:', JSON.stringify(body, null, 2));
    
    // Validate webhook structure
    if (!body.object || body.object !== 'whatsapp_business_account') {
      console.log('⚠️ Invalid webhook object type:', body.object);
      return new NextResponse('OK', { status: 200 });
    }
    
    // Process each entry
    for (const entry of body.entry) {
      for (const change of entry.changes) {
        if (change.field === 'messages') {
          await processMessageUpdates(change.value);
        }
      }
    }
    
    return new NextResponse('OK', { status: 200 });
    
  } catch (error) {
    console.error('❌ Error processing WhatsApp webhook:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
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

// Helper function to get message delivery status
export async function getMessageStatus(messageId: string) {
  try {
    const result = await storage.query(`
      SELECT * FROM whatsapp_message_status 
      WHERE message_id = ? 
      ORDER BY created_at DESC
    `, [messageId]);
    
    return result;
  } catch (error) {
    console.error('❌ Error retrieving message status:', error);
    return [];
  }
}

// Helper function to get delivery statistics
export async function getDeliveryStats(dateFrom?: string, dateTo?: string) {
  try {
    let query = `
      SELECT 
        status,
        COUNT(*) as count,
        DATE(created_at) as date
      FROM whatsapp_message_status
    `;
    
    const params: string[] = [];
    
    if (dateFrom && dateTo) {
      query += ` WHERE DATE(created_at) BETWEEN ? AND ?`;
      params.push(dateFrom, dateTo);
    } else if (dateFrom) {
      query += ` WHERE DATE(created_at) >= ?`;
      params.push(dateFrom);
    }
    
    query += ` GROUP BY status, DATE(created_at) ORDER BY date DESC, status`;
    
    const result = await storage.query(query, params);
    
    return result;
  } catch (error) {
    console.error('❌ Error retrieving delivery stats:', error);
    return [];
  }
}