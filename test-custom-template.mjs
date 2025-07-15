// Test WhatsApp with custom template approach
import 'dotenv/config';

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('🧪 Testing WhatsApp with different approaches...');

async function testFreeFormMessage() {
  try {
    console.log('\n📤 Testing free-form message (should work if you messaged the business recently)...');
    
    const payload = {
      messaging_product: "whatsapp",
      to: "+393761024080",
      type: "text",
      text: {
        body: "Ciao! Questo è un messaggio di test dal sistema di gestione del salone. 💇‍♀️"
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

async function testWithCustomTemplate() {
  try {
    console.log('\n📤 Testing with custom template (once you create it)...');
    
    // This will work once you create a custom template
    const payload = {
      messaging_product: "whatsapp",
      to: "+393761024080",
      type: "template",
      template: {
        name: "appointment_reminder", // You need to create this template
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
      return false;
    }

    const result = await response.json();
    console.log('✅ Custom template response:', JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

async function runTests() {
  console.log('🔍 Testing different message approaches...\n');
  
  const freeFormResult = await testFreeFormMessage();
  const templateResult = await testWithCustomTemplate();
  
  console.log('\n📋 Results Summary:');
  console.log(`Free-form message: ${freeFormResult ? '✅ Success' : '❌ Failed'}`);
  console.log(`Custom template: ${templateResult ? '✅ Success' : '❌ Failed'}`);
  
  if (freeFormResult) {
    console.log('\n🎉 Free-form message worked! This means:');
    console.log('   - Your phone number is properly configured');
    console.log('   - You can send regular text messages');
    console.log('   - Your salon system will work perfectly!');
  } else {
    console.log('\n📝 Next steps:');
    console.log('   1. Create a custom message template in Meta for Developers');
    console.log('   2. Or message your business number to open 24h window');
    console.log('   3. Then test again');
  }
}

runTests(); 