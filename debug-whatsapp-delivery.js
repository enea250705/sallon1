// Debug WhatsApp message delivery issues
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

async function debugWhatsAppDelivery() {
  console.log('🔍 Debugging WhatsApp message delivery...\n');
  
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  
  if (!accessToken || !phoneNumberId) {
    console.log('❌ Missing credentials');
    return;
  }
  
  try {
    // 1. Check phone number info
    console.log('📞 Checking phone number info...');
    const phoneInfoUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}`;
    const phoneInfoResponse = await fetch(phoneInfoUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (phoneInfoResponse.ok) {
      const phoneInfo = await phoneInfoResponse.json();
      console.log('📋 Phone Number Info:');
      console.log(JSON.stringify(phoneInfo, null, 2));
    } else {
      console.log('❌ Failed to get phone info');
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. Check business account info
    if (businessAccountId) {
      console.log('🏢 Checking business account info...');
      const businessUrl = `https://graph.facebook.com/v18.0/${businessAccountId}`;
      const businessResponse = await fetch(businessUrl, {
        headers: { 'Authorization': `Bearer ${accessToken}` }
      });
      
      if (businessResponse.ok) {
        const businessInfo = await businessResponse.json();
        console.log('📋 Business Account Info:');
        console.log(JSON.stringify(businessInfo, null, 2));
      } else {
        console.log('❌ Failed to get business info');
      }
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. Test different phone number formats
    const testNumbers = [
      '+393761024080',
      '393761024080',
      '3761024080'
    ];
    
    for (const number of testNumbers) {
      console.log(`📱 Testing format: ${number}`);
      
      const testUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
      const testPayload = {
        messaging_product: 'whatsapp',
        to: number,
        type: 'text',
        text: {
          body: `Test message to ${number} at ${new Date().toLocaleTimeString()}`
        }
      };
      
      const testResponse = await fetch(testUrl, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${accessToken}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(testPayload)
      });
      
      console.log(`   Status: ${testResponse.status}`);
      
      if (testResponse.ok) {
        const result = await testResponse.json();
        console.log(`   ✅ Message ID: ${result.messages[0]?.id}`);
        console.log(`   📍 WhatsApp ID: ${result.contacts[0]?.wa_id}`);
      } else {
        const error = await testResponse.text();
        console.log(`   ❌ Error: ${error}`);
      }
      
      console.log('');
      
      // Wait 2 seconds between tests to avoid rate limiting
      await new Promise(resolve => setTimeout(resolve, 2000));
    }
    
  } catch (error) {
    console.error('❌ Debug error:', error);
  }
}

debugWhatsAppDelivery().catch(console.error);