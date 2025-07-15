// Test for Live Mode WhatsApp Business API
import 'dotenv/config';

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('🚀 Testing WhatsApp Business API in LIVE MODE...\n');

async function checkBusinessAccountStatus() {
  try {
    console.log('🏢 Checking business account status...');
    
    // Try to get business account info
    const response = await fetch(`https://graph.facebook.com/v18.0/me?fields=id,name,email`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error checking account:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ Account Info:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testFreeFormMessage() {
  try {
    console.log('\n📤 Testing free-form message (24h window rule)...');
    
    const payload = {
      messaging_product: "whatsapp",
      to: "+393761024080",
      type: "text",
      text: {
        body: "Ciao! Questo è un messaggio di test dal salone. Se ricevi questo messaggio, significa che hai interagito con il nostro business recentemente. 💇‍♀️"
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
      
      // Check if it's a 24h window error
      if (errorText.includes('24') || errorText.includes('window')) {
        console.log('\n💡 This error means you need to message the business first!');
        console.log('📱 Try sending a message to: +39 347 423 0216');
        console.log('⏰ Then test again within 24 hours');
      }
      return false;
    }

    const result = await response.json();
    console.log('✅ Free-form message response:', JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

async function testWithPendingTemplate() {
  try {
    console.log('\n📤 Testing with pending appointment_reminder template...');
    
    const payload = {
      messaging_product: "whatsapp",
      to: "+393761024080",
      type: "template",
      template: {
        name: "appointment_reminder",
        language: {
          code: "it_IT"
        },
        components: [
          {
            type: "body",
            parameters: [
              {
                type: "text",
                text: "Test Client"
              },
              {
                type: "text", 
                text: "14:30"
              },
              {
                type: "text",
                text: "Taglio"
              }
            ]
          }
        ]
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
      
      if (errorText.includes('PENDING')) {
        console.log('\n💡 Template is still pending approval!');
        console.log('⏳ Wait for Meta to approve your appointment_reminder template');
      }
      return false;
    }

    const result = await response.json();
    console.log('✅ Template message response:', JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

async function checkMessageDelivery() {
  try {
    console.log('\n📊 Checking message delivery status...');
    
    // Note: WhatsApp doesn't provide delivery status via API for privacy reasons
    console.log('ℹ️ WhatsApp Business API does not provide delivery status');
    console.log('📱 Check your phone directly for received messages');
    console.log('🔍 Also check spam/filtered messages in WhatsApp');
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function runLiveModeTests() {
  console.log('🧪 Running live mode tests...\n');
  
  await checkBusinessAccountStatus();
  const freeFormResult = await testFreeFormMessage();
  const templateResult = await testWithPendingTemplate();
  await checkMessageDelivery();
  
  console.log('\n📋 Live Mode Analysis:');
  console.log(`Free-form message: ${freeFormResult ? '✅ API Success' : '❌ API Error'}`);
  console.log(`Template message: ${templateResult ? '✅ API Success' : '❌ API Error'}`);
  
  if (freeFormResult) {
    console.log('\n🎉 Free-form message API call successful!');
    console.log('📱 Check your WhatsApp for the message');
    console.log('💡 If you don\'t see it, try messaging the business first');
  }
  
  console.log('\n🔧 Next Steps for Live Mode:');
  console.log('1. Message your business number: +39 347 423 0216');
  console.log('2. Wait for appointment_reminder template approval');
  console.log('3. Test again after 24h window opens');
  console.log('4. Check WhatsApp spam/filtered messages');
}

runLiveModeTests(); 