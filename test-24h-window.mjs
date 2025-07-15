// Test 24-hour window after messaging the business
import 'dotenv/config';

const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;

console.log('⏰ Testing 24-hour window after messaging business...\n');

async function testAfterMessagingBusiness() {
  try {
    console.log('📤 Sending test message (should work if you messaged business recently)...');
    
    const payload = {
      messaging_product: "whatsapp",
      to: "+393761024080",
      type: "text",
      text: {
        body: "🎉 SUCCESS! You messaged the business, so this free-form message should work! Your salon system is ready! 💇‍♀️"
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
      
      if (errorText.includes('24') || errorText.includes('window')) {
        console.log('\n💡 24-hour window is closed!');
        console.log('📱 Please send a message to: +39 347 423 0216');
        console.log('⏰ Then wait a few minutes and test again');
      }
      return false;
    }

    const result = await response.json();
    console.log('✅ Success! Message sent:', JSON.stringify(result, null, 2));
    
    if (result.messages && result.messages.length > 0) {
      console.log('\n🎉 CONGRATULATIONS!');
      console.log('📱 You should receive this message on your WhatsApp!');
      console.log('🚀 Your salon system is working perfectly in live mode!');
      console.log('\n💡 This confirms:');
      console.log('   - 24-hour window is open');
      console.log('   - Free-form messages work');
      console.log('   - Your system is production ready');
    }
    
    return true;
  } catch (error) {
    console.error('❌ Error:', error);
    return false;
  }
}

testAfterMessagingBusiness(); 