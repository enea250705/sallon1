import type { NextApiRequest, NextApiResponse } from 'next';
import { whatsAppService } from '../../../server/services/whatsapp';
import { storage } from '../../../api-serverless/lib/storage';

// Helper function to get delivery statistics
async function getDeliveryStats(dateFrom?: string, dateTo?: string) {
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

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method Not Allowed' });
  }

  try {
    const { dateFrom, dateTo, phone } = req.query;
    
    // Get message delivery status
    const messageStatus = await whatsAppService.getMessageDeliveryStatus(
      phone as string || undefined,
      dateFrom as string || undefined,
      dateTo as string || undefined
    );
    
    // Get aggregated delivery statistics
    const deliveryStats = await getDeliveryStats(
      dateFrom as string || undefined,
      dateTo as string || undefined
    );
    
    // Calculate summary statistics
    const summary = {
      total: messageStatus.length,
      sent: messageStatus.filter(m => m.current_status === 'sent').length,
      delivered: messageStatus.filter(m => m.current_status === 'delivered').length,
      read: messageStatus.filter(m => m.current_status === 'read').length,
      failed: messageStatus.filter(m => m.current_status === 'failed').length,
      pending: messageStatus.filter(m => m.current_status === 'pending').length
    };
    
    // Group failed messages by error code for analysis
    const failedMessages = messageStatus.filter(m => m.current_status === 'failed');
    const errorAnalysis = failedMessages.reduce((acc: any, msg) => {
      const errorCode = msg.error_code || 'unknown';
      if (!acc[errorCode]) {
        acc[errorCode] = {
          count: 0,
          errorMessage: msg.error_message || 'Unknown error',
          recipients: []
        };
      }
      acc[errorCode].count++;
      acc[errorCode].recipients.push(msg.recipient_phone);
      return acc;
    }, {});
    
    return res.status(200).json({
      success: true,
      data: {
        summary,
        messages: messageStatus,
        deliveryStats,
        errorAnalysis,
        whatsappStatus: whatsAppService.getStatus()
      }
    });
    
  } catch (error) {
    console.error('❌ Error retrieving WhatsApp statistics:', error);
    return res.status(500).json({
      success: false,
      error: 'Failed to retrieve statistics'
    });
  }
}