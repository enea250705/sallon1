// Simple WhatsApp test script
import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { createRequire } from 'module';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);
const require = createRequire(import.meta.url);

// Load environment variables
import 'dotenv/config';

console.log('🧪 Testing WhatsApp integration...');
console.log('📊 Environment variables:');
console.log('   WHATSAPP_ACCESS_TOKEN:', process.env.WHATSAPP_ACCESS_TOKEN ? '✅ Set' : '❌ Not set');
console.log('   WHATSAPP_PHONE_NUMBER_ID:', process.env.WHATSAPP_PHONE_NUMBER_ID ? '✅ Set' : '❌ Not set');
console.log('   WHATSAPP_BUSINESS_ACCOUNT_ID:', process.env.WHATSAPP_BUSINESS_ACCOUNT_ID ? '✅ Set' : '❌ Not set');

// Test phone number validation function
function validatePhoneNumber(phone) {
  const phoneRegex = /^\+?[1-9]\d{1,14}$/;
  return phoneRegex.test(phone.replace(/\s+/g, ''));
}

// Test phone number formatting function
function formatPhoneNumber(phone) {
  let formatted = phone.replace(/[^\d+]/g, '');
  if (!formatted.startsWith('+')) {
    formatted = '+' + formatted;
  }
  return formatted;
}

// Test phone number
const testPhone = '+393761024080';
const isValid = validatePhoneNumber(testPhone);
const formattedPhone = formatPhoneNumber(testPhone);

console.log(`📱 Phone validation for ${testPhone}:`, isValid);
console.log(`📱 Formatted phone: ${formattedPhone}`);

// Test WhatsApp API call
async function testWhatsAppAPI() {
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (!accessToken || !phoneNumberId) {
    console.log('❌ WhatsApp credentials not configured');
    return false;
  }
  
  const apiUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  const testMessage = '🧪 Test message from salon management system - WhatsApp integration test! 💇‍♀️';
  
  const payload = {
    messaging_product: "whatsapp",
    to: formattedPhone,
    type: "text",
    text: {
      body: testMessage
    }
  };
  
  console.log(`📤 Sending test message to ${formattedPhone}...`);
  console.log(`📤 API URL: ${apiUrl}`);
  
  try {
    const response = await fetch(apiUrl, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`📊 Response status: ${response.status}`);
    
    if (!response.ok) {
      const errorText = await response.text();
      console.error(`❌ WhatsApp API error: ${errorText}`);
      return false;
    }
    
    const result = await response.json();
    console.log('✅ WhatsApp API response:', JSON.stringify(result, null, 2));
    
    if (result.messages && result.messages.length > 0) {
      console.log(`🎉 WhatsApp message sent successfully! Message ID: ${result.messages[0].id}`);
      return true;
    } else {
      console.error('❌ WhatsApp API returned no message ID');
      return false;
    }
    
  } catch (error) {
    console.error('❌ Error calling WhatsApp API:', error);
    return false;
  }
}

// Run the test
testWhatsAppAPI().then((success) => {
  console.log('🏁 Test completed');
  console.log(success ? '🎉 SUCCESS: WhatsApp integration is working!' : '❌ FAILED: WhatsApp integration needs configuration');
  process.exit(success ? 0 : 1);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 