# WhatsApp Business API Setup Guide

## Overview
Your salon management system now supports real WhatsApp Business API integration for sending appointment reminders and notifications to clients.

## Required Environment Variables

Add these variables to your `deploy-config.env` file:

```env
# WhatsApp Business API Configuration
WHATSAPP_ACCESS_TOKEN=your_access_token_here
WHATSAPP_PHONE_NUMBER_ID=your_phone_number_id_here
WHATSAPP_BUSINESS_ACCOUNT_ID=your_business_account_id_here
```

## How to Get Your WhatsApp Credentials

### 1. WhatsApp Business Account Setup
1. Go to [Meta for Developers](https://developers.facebook.com/)
2. Create a new app or use an existing one
3. Add the "WhatsApp" product to your app
4. Set up your WhatsApp Business Account

### 2. Get Your Access Token
1. In your Meta app dashboard, go to "WhatsApp" → "Getting Started"
2. Copy your **Permanent Access Token**
3. This token starts with `EAA...`

### 3. Get Your Phone Number ID
1. In your Meta app dashboard, go to "WhatsApp" → "Phone Numbers"
2. Add a phone number to your WhatsApp Business Account
3. Copy the **Phone Number ID** (it's a long number like `123456789012345`)

### 4. Get Your Business Account ID (Optional)
1. In your Meta app dashboard, go to "WhatsApp" → "Business Account"
2. Copy the **Business Account ID**

## Testing Your Setup

### 1. Check WhatsApp Status
Visit: `GET /api/whatsapp/status`

This will return:
```json
{
  "configured": true,
  "hasAccessToken": true,
  "hasPhoneNumberId": true,
  "hasBusinessAccountId": true,
  "apiUrl": "https://graph.facebook.com/v18.0"
}
```

### 2. Send Test Message
Send a POST request to: `/api/whatsapp/test`

```json
{
  "phoneNumber": "+393331234567",
  "message": "Test message from salon management system"
}
```

## Message Templates Available

### 1. Default Appointment Reminder
- **Template**: `"Ciao [NOME], ti ricordiamo il tuo appuntamento di domani alle [ORA] per [SERVIZIO]. A presto! 💇‍♀️"`
- **Variables**: `[NOME]`, `[ORA]`, `[SERVIZIO]`, `[STILISTA]`

### 2. Daily Appointment Reminder
- **Used for**: Clients with appointments tomorrow
- **Format**: Personalized message with appointment details

### 3. Recurring Reminder
- **Used for**: Clients with recurring appointments
- **Format**: Multi-line message with booking suggestions

## Phone Number Format

The system automatically formats phone numbers for WhatsApp:
- Removes spaces and special characters
- Ensures the number starts with `+`
- Example: `+39 333 123 4567` → `+393331234567`

## Features

### ✅ What's Working
- Real WhatsApp Business API integration
- Automatic phone number formatting
- Error handling and logging
- Test message functionality
- Status checking
- Appointment reminders
- Recurring appointment reminders

### 🔧 Configuration
- Environment variable based configuration
- Graceful fallback to logging when not configured
- Admin-only test endpoints

### 📱 Message Types
- Appointment reminders (daily)
- Recurring appointment reminders
- Custom messages via templates
- Test messages

## Troubleshooting

### Common Issues

1. **"WhatsApp credentials not configured"**
   - Check that all environment variables are set
   - Restart the server after adding variables

2. **"WhatsApp API error (400)"**
   - Verify your access token is correct
   - Check that your phone number ID is valid
   - Ensure your WhatsApp Business Account is active

3. **"Invalid phone number"**
   - Phone numbers must be in international format
   - Must start with country code (e.g., +39 for Italy)

4. **"Message not delivered"**
   - Recipient must have opted in to receive messages
   - Check WhatsApp Business API status
   - Verify message template compliance

### Debug Steps

1. Check WhatsApp status: `GET /api/whatsapp/status`
2. Send test message: `POST /api/whatsapp/test`
3. Check server logs for detailed error messages
4. Verify environment variables are loaded correctly

## Security Notes

- Keep your access token secure and never commit it to version control
- Use environment variables for all sensitive credentials
- Regularly rotate your access tokens
- Monitor API usage to stay within limits

## API Limits

WhatsApp Business API has rate limits:
- 1000 messages per second per phone number
- 250,000 messages per month per phone number
- Template messages must be pre-approved by Meta

## Support

If you encounter issues:
1. Check the server logs for detailed error messages
2. Verify your Meta app configuration
3. Test with the provided endpoints
4. Contact Meta Developer Support if needed 