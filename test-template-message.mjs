// Test WhatsApp with approved template
import 'dotenv/config';

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const templateId = "696533923377466"; // Your approved hello_world template

console.log('🧪 Testing WhatsApp with approved template...');

async function testWithTemplate() {
  try {
    console.log('📤 Sending template message...');
    
    const payload = {
      messaging_product: "whatsapp",
      to: "+393761024080",
      type: "template",
      template: {
        name: "hello_world",
        language: {
          code: "en_US"
        }
      }
    };

    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}/messages`, {
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
      return;
    }

    const result = await response.json();
    console.log('✅ Template message response:', JSON.stringify(result, null, 2));
    
    if (result.messages && result.messages.length > 0) {
      console.log('🎉 Template message sent successfully!');
      console.log('📱 You should receive the "Hello World" template message now.');
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

testWithTemplate(); 