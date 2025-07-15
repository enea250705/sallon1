// Test WhatsApp message sending with actual credentials
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

async function testWhatsAppSend() {
  console.log('📱 Testing WhatsApp message sending...\n');
  
  // Test phone number
  const phoneNumber = '+393761024080';
  const message = 'Ciao, ti ricordiamo il tuo appuntamento di domani alle 19:00 per Taglio. A presto! 💇‍♀️';
  
  // Get credentials from environment
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const apiUrl = 'https://graph.facebook.com/v18.0';
  
  console.log('📋 Configuration Check:');
  console.log(`Access Token: ${accessToken ? `${accessToken.substring(0, 20)}...` : '❌ Missing'}`);
  console.log(`Phone Number ID: ${phoneNumberId || '❌ Missing'}`);
  console.log(`Target Phone: ${phoneNumber}`);
  console.log(`Message: ${message}\n`);
  
  if (!accessToken || !phoneNumberId) {
    console.log('❌ Missing WhatsApp credentials!');
    console.log('Make sure these environment variables are set:');
    console.log('- WHATSAPP_ACCESS_TOKEN');
    console.log('- WHATSAPP_PHONE_NUMBER_ID');
    return;
  }
  
  try {
    // Prepare the API request
    const url = `${apiUrl}/${phoneNumberId}/messages`;
    const payload = {
      messaging_product: 'whatsapp',
      to: phoneNumber,
      type: 'text',
      text: {
        body: message
      }
    };
    
    console.log('🚀 Sending WhatsApp message...');
    console.log(`URL: ${url}`);
    console.log(`Payload: ${JSON.stringify(payload, null, 2)}\n`);
    
    // Make the API call
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`📡 Response Status: ${response.status} ${response.statusText}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.log(`❌ WhatsApp API Error:`);
      console.log(errorText);
      return;
    }
    
    const result = await response.json();
    console.log('✅ WhatsApp API Response:');
    console.log(JSON.stringify(result, null, 2));
    
    if (result.messages && result.messages.length > 0) {
      console.log(`\n🎉 Message sent successfully!`);
      console.log(`Message ID: ${result.messages[0].id}`);
      console.log(`Contact WhatsApp ID: ${result.contacts[0].wa_id}`);
      console.log(`\n📱 Check your WhatsApp now!`);
    } else {
      console.log(`❌ No message ID returned - send may have failed`);
    }
    
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
  }
}

testWhatsAppSend().catch(console.error);