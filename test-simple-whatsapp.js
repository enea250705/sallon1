// Simple test - send to different number or use template
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

async function testSimpleWhatsApp() {
  console.log('🔄 Testing simple WhatsApp message...\n');
  
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  // Test with the business phone number itself (this should work)
  const testPhoneNumber = '+393474230216'; // The verified business number
  
  console.log(`📱 Testing message to business number: ${testPhoneNumber}`);
  
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: testPhoneNumber,
    type: 'text',
    text: {
      body: 'Test message from salon system - checking delivery'
    }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Success:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      const error = await response.text();
      console.log('❌ Error:');
      console.log(error);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
  
  console.log('\n' + '='.repeat(40) + '\n');
  
  // Also test the original number with a simple "hello"
  console.log('📱 Testing simple "hello" to your number...');
  
  const simplePayload = {
    messaging_product: 'whatsapp',
    to: '+393761024080',
    type: 'text',
    text: {
      body: 'hello'
    }
  };
  
  try {
    const response2 = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(simplePayload)
    });
    
    console.log(`Status: ${response2.status}`);
    
    if (response2.ok) {
      const result2 = await response2.json();
      console.log('✅ Success:');
      console.log(JSON.stringify(result2, null, 2));
    } else {
      const error2 = await response2.text();
      console.log('❌ Error:');
      console.log(error2);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

testSimpleWhatsApp().catch(console.error);