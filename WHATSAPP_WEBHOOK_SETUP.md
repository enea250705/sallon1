# WhatsApp Webhook Setup Guide

This guide will help you set up webhook tracking for WhatsApp message delivery status.

## Environment Variables

Add these to your `.env` file:

```bash
# WhatsApp Webhook Verification Token (create a random string)
WHATSAPP_VERIFY_TOKEN=your_secure_random_token_here
```

## Meta Business API Configuration

### 1. Configure Webhook URL

In your Meta Business account:

1. Go to **WhatsApp Business API** > **Configuration** > **Webhooks**
2. Set the webhook URL to: `https://yourdomain.com/api/whatsapp-webhook`
3. Set the verify token to the same value as `WHATSAPP_VERIFY_TOKEN`
4. Subscribe to the following webhook fields:
   - `messages` (for message status updates)

### 2. Webhook Events

The webhook will receive these events:
- `sent` - Message was sent successfully
- `delivered` - Message was delivered to recipient's device
- `read` - Message was read by recipient
- `failed` - Message delivery failed

## Updated Scheduler Features

### Daily Schedule
- Runs at **09:00** and **19:00** only (no more hourly checks)
- Shows estimated completion time
- Progress tracking with `[1/18]` format

### Message Spacing
- **1-minute delay** between each message
- Prevents rate limiting
- Better delivery success rates
- Example: 18 appointments = 18 minutes total

### Webhook Tracking
- All sent messages are stored with Message ID
- Delivery status tracked in real-time
- Failed message analysis with error codes
- Delivery statistics API available

## API Endpoints

### View Delivery Statistics
```bash
GET /api/whatsapp-stats

# With filters
GET /api/whatsapp-stats?dateFrom=2025-01-01&dateTo=2025-01-31&phone=+393401234567
```

### Webhook Endpoint
```bash
# Verification (GET)
GET /api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=TOKEN&hub.challenge=CHALLENGE

# Status Updates (POST)
POST /api/whatsapp-webhook
```

## Database Tables

Two new tables are created automatically:

### `whatsapp_sent_messages`
Stores all sent messages for tracking:
- `message_id` - WhatsApp message ID
- `recipient_phone` - Recipient phone number
- `message_content` - Message text or template info
- `sent_at` - Timestamp when sent

### `whatsapp_message_status`
Stores delivery status updates from webhooks:
- `message_id` - Links to sent message
- `status` - Current status (sent/delivered/read/failed)
- `timestamp` - When status was updated
- `error_code` - Error code if failed
- `error_message` - Error description if failed

## Testing

### 1. Test Webhook Verification
```bash
curl "https://yourdomain.com/api/whatsapp-webhook?hub.mode=subscribe&hub.verify_token=your_token&hub.challenge=test123"
```

### 2. Test Manual Reminder
The manual reminder trigger still works for testing:
```bash
# In your application
await dailyReminderService.triggerManualReminder();
```

### 3. Check Delivery Stats
Visit: `https://yourdomain.com/api/whatsapp-stats` to see delivery statistics.

## Monitoring

### Console Logs
- `📱 [1/18] Sending reminder...` - Progress tracking
- `⏳ Waiting 1 minute before next message (17 remaining)...` - Delay confirmation
- `✅ WhatsApp message sent successfully. Message ID: wamid.xyz` - Message sent
- `📊 Message wamid.xyz stored for tracking` - Tracking enabled
- `📨 WhatsApp webhook received:` - Webhook status update

### Error Monitoring
- Failed messages are logged with error codes
- Webhook failures are logged for debugging
- Database errors are caught and logged

## Benefits

1. **Scheduled Sending**: No more middle-of-night messages
2. **Rate Limiting**: 1-minute spacing prevents API limits
3. **Delivery Tracking**: Know if messages actually reach clients
4. **Error Analysis**: Identify problematic phone numbers
5. **Statistics**: Track delivery success rates over time

## Troubleshooting

### Messages Not Being Tracked
- Check that `WHATSAPP_ACCESS_TOKEN` and `WHATSAPP_PHONE_NUMBER_ID` are set
- Verify webhook URL is accessible from Meta's servers
- Check webhook verification token matches

### Webhook Not Receiving Updates
- Verify webhook URL is HTTPS
- Check webhook fields subscription includes 'messages'
- Test webhook endpoint manually

### Database Errors
- Tables are created automatically on first run
- Check database permissions for CREATE TABLE
- Verify storage service is properly configured