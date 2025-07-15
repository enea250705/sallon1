// Check WhatsApp message delivery status
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

async function checkMessageStatus() {
  console.log('📊 Checking WhatsApp message delivery status...\n');
  
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  
  if (!accessToken || !businessAccountId) {
    console.log('❌ Missing credentials');
    return;
  }
  
  try {
    // Get recent messages from the business account
    console.log('📱 Fetching recent message analytics...');
    const analyticsUrl = `https://graph.facebook.com/v18.0/${businessAccountId}/message_analytics`;
    const response = await fetch(analyticsUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (response.ok) {
      const analytics = await response.json();
      console.log('📊 Message Analytics:');
      console.log(JSON.stringify(analytics, null, 2));
    } else {
      console.log('❌ Failed to get analytics:', response.status);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Check webhooks (if configured)
    console.log('🔗 Checking webhook configuration...');
    const webhookUrl = `https://graph.facebook.com/v18.0/${businessAccountId}/subscribed_apps`;
    const webhookResponse = await fetch(webhookUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (webhookResponse.ok) {
      const webhooks = await webhookResponse.json();
      console.log('📋 Webhook Configuration:');
      console.log(JSON.stringify(webhooks, null, 2));
    } else {
      console.log('❌ Failed to get webhook info:', webhookResponse.status);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // Try to get phone number capabilities
    console.log('📞 Checking phone number capabilities...');
    const phoneCapUrl = `https://graph.facebook.com/v18.0/393761024080`;
    const phoneCapResponse = await fetch(phoneCapUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (phoneCapResponse.ok) {
      const phoneCap = await phoneCapResponse.json();
      console.log('📱 Phone Number Capabilities:');
      console.log(JSON.stringify(phoneCap, null, 2));
    } else {
      console.log('❌ Failed to get phone capabilities:', phoneCapResponse.status);
      const error = await phoneCapResponse.text();
      console.log('Error details:', error);
    }
    
  } catch (error) {
    console.error('❌ Status check error:', error);
  }
}

checkMessageStatus().catch(console.error);