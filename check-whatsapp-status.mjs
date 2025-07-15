// Check WhatsApp Business API status
import 'dotenv/config';

console.log('🔍 Checking WhatsApp Business API status...');

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;

console.log('📊 Configuration:');
console.log('   Access Token:', accessToken ? `${accessToken.substring(0, 20)}...` : '❌ Not set');
console.log('   Phone Number ID:', phoneNumberId || '❌ Not set');
console.log('   Business Account ID:', businessAccountId || '❌ Not set');

async function checkPhoneNumberStatus() {
  if (!accessToken || !phoneNumberId) {
    console.log('❌ Missing credentials');
    return;
  }

  try {
    console.log('\n📱 Checking phone number status...');
    const response = await fetch(`https://graph.facebook.com/v18.0/${phoneNumberId}?fields=verified_name,code_verification_status,quality_rating`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error checking phone number:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ Phone Number Status:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function checkBusinessAccountStatus() {
  if (!accessToken || !businessAccountId) {
    console.log('❌ Missing business account ID');
    return;
  }

  try {
    console.log('\n🏢 Checking business account status...');
    const response = await fetch(`https://graph.facebook.com/v18.0/${businessAccountId}?fields=name,account_review_status,account_status`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error checking business account:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ Business Account Status:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function checkMessageTemplates() {
  if (!accessToken || !businessAccountId) {
    console.log('❌ Missing credentials for template check');
    return;
  }

  try {
    console.log('\n📝 Checking message templates...');
    const response = await fetch(`https://graph.facebook.com/v18.0/${businessAccountId}/message_templates?fields=name,status,category`, {
      headers: {
        'Authorization': `Bearer ${accessToken}`,
      }
    });

    if (!response.ok) {
      const error = await response.text();
      console.error('❌ Error checking templates:', error);
      return;
    }

    const data = await response.json();
    console.log('✅ Message Templates:', JSON.stringify(data, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

async function testWithTemplate() {
  if (!accessToken || !phoneNumberId) {
    console.log('❌ Missing credentials for template test');
    return;
  }

  try {
    console.log('\n🧪 Testing with a simple template message...');
    
    // Try a very simple message without special characters
    const payload = {
      messaging_product: "whatsapp",
      to: "+393761024080",
      type: "text",
      text: {
        body: "Hello! This is a test message from your salon management system."
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
    console.log('✅ Template test response:', JSON.stringify(result, null, 2));
  } catch (error) {
    console.error('❌ Error:', error);
  }
}

// Run all checks
async function runAllChecks() {
  await checkPhoneNumberStatus();
  await checkBusinessAccountStatus();
  await checkMessageTemplates();
  await testWithTemplate();
  
  console.log('\n📋 Troubleshooting Tips:');
  console.log('1. Make sure your phone number has opted in to receive messages');
  console.log('2. Check if you have messaged your business number recently (24h window)');
  console.log('3. Verify your business account is approved and active');
  console.log('4. Check if you need to use message templates for new conversations');
  console.log('5. Ensure your phone number is in the correct international format');
}

runAllChecks().catch(console.error); 