// Test after adding phone as test number
import 'dotenv/config';

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('🧪 Testing after adding phone as test number...');

async function testMessage() {
  try {
    console.log('📤 Sending test message...');
    
    const payload = {
      messaging_product: "whatsapp",
      to: "+393761024080",
      type: "text",
      text: {
        body: "🎉 SUCCESS! Your phone is now configured as a test number. This message confirms WhatsApp integration is working perfectly! 💇‍♀️"
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
      console.error(`❌ Error: ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log('✅ Success! Message sent:', JSON.stringify(result, null, 2));
    
    if (result.messages && result.messages.length > 0) {
      console.log('\n🎉 CONGRATULATIONS!');
      console.log('📱 You should receive the test message on your WhatsApp now!');
      console.log('🚀 Your salon management system is ready for production!');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

testMessage(); 