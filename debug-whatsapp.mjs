// Comprehensive WhatsApp debugging
import 'dotenv/config';

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('🔍 Comprehensive WhatsApp Debugging...\n');

async function testHelloWorldTemplate() {
  try {
    console.log('📤 Testing with approved hello_world template...');
    
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
      console.error(`❌ Error: ${errorText}`);
      return false;
    }

    const result = await response.json();
    console.log('✅ Response:', JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

async function testSimpleText() {
  try {
    console.log('\n📤 Testing simple text message...');
    
    const payload = {
      messaging_product: "whatsapp",
      to: "+393761024080",
      type: "text",
      text: {
        body: "Test message from salon system"
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
    console.log('✅ Response:', JSON.stringify(result, null, 2));
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

async function checkPhoneNumberDetails() {
  try {
    console.log('\n📱 Checking detailed phone number info...');
    
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}?fields=verified_name,code_verification_status,quality_rating,display_phone_number`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ Phone Number Details:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testWithDifferentPhoneFormat() {
  try {
    console.log('\n📤 Testing with different phone format...');
    
    // Test with different phone number formats
    const phoneNumbers = [
      "+393761024080",
      "393761024080",
      "+39 376 102 4080"
    ];

    for (const phone of phoneNumbers) {
      console.log(`\n📱 Testing with: ${phone}`);
      
      const payload = {
        messaging_product: "whatsapp",
        to: phone,
        type: "text",
        text: {
          body: `Test message to ${phone}`
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
      } else {
        const result = await response.json();
        console.log('✅ Success:', JSON.stringify(result, null, 2));
      }
    }
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function runAllTests() {
  console.log('🧪 Running comprehensive tests...\n');
  
  await checkPhoneNumberDetails();
  await testHelloWorldTemplate();
  await testSimpleText();
  await testWithDifferentPhoneFormat();
  
  console.log('\n📋 Debug Summary:');
  console.log('1. Check if your phone number is added as a test number in Meta for Developers');
  console.log('2. Check if you have messaged your business number recently');
  console.log('3. Check your WhatsApp spam/filtered messages');
  console.log('4. Try messaging your business number first, then test again');
  console.log('5. Wait for your appointment_reminder template to be approved');
}

runAllTests(); 