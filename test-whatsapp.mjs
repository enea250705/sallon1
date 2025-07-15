// Simple WhatsApp test script
import { whatsAppService } from './server/services/whatsapp.js';

async function testWhatsApp() {
  console.log('🧪 Testing WhatsApp integration...');
  
  // Check service status
  const status = whatsAppService.getStatus();
  console.log('📊 WhatsApp Status:', status);
  
  // Test phone number validation
  const testPhone = '+393761024080';
  const isValid = whatsAppService.validatePhoneNumber(testPhone);
  console.log(`📱 Phone validation for ${testPhone}:`, isValid);
  
  // Send test message
  const testMessage = '🧪 Test message from salon management system - WhatsApp integration test! 💇‍♀️';
  console.log(`📤 Sending test message to ${testPhone}...`);
  
  try {
    const result = await whatsAppService.sendCustomMessage(testPhone, testMessage);
    console.log('✅ Test result:', result);
    
    if (result) {
      console.log('🎉 WhatsApp message sent successfully!');
    } else {
      console.log('❌ Failed to send WhatsApp message');
    }
  } catch (error) {
    console.error('❌ Error sending WhatsApp message:', error);
  }
}

// Run the test
testWhatsApp().then(() => {
  console.log('🏁 Test completed');
  process.exit(0);
}).catch((error) => {
  console.error('💥 Test failed:', error);
  process.exit(1);
}); 