import { NextRequest, NextResponse } from 'next/server';
import { whatsAppService } from '../../server/services/whatsapp';
import { getDeliveryStats } from '../whatsapp-webhook';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const recipientPhone = searchParams.get('phone');
    
    // Get message delivery status
    const messageStatus = await whatsAppService.getMessageDeliveryStatus(
      recipientPhone || undefined,
      dateFrom || undefined,
      dateTo || undefined
    );
    
    // Get aggregated delivery statistics
    const deliveryStats = await getDeliveryStats(
      dateFrom || undefined,
      dateTo || undefined
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
    
    return NextResponse.json({
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
    return NextResponse.json({
      success: false,
      error: 'Failed to retrieve statistics'
    }, { status: 500 });
  }
}