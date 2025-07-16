import { fileURLToPath } from 'url';
import { dirname } from 'path';
import { config } from 'dotenv';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables
config();

console.log('🧪 Starting WhatsApp format test...');

try {
  // Import the WhatsApp service
  const { whatsAppService } = await import('./server/services/whatsapp.js');
  
  console.log('📱 Testing WhatsApp message format for number: 3761024080');
  
  // Test data - simulating an appointment
  const testReminder = {
    clientName: "Test Cliente",
    clientPhone: "3761024080", // The number to test
    appointments: [{
      appointmentTime: "10:30", // Format HH:MM
      serviceName: "Test Service" // This won't be used since template only has 2 params
    }]
  };
  
  console.log(`📝 Test message will be sent to: ${testReminder.clientPhone}`);
  console.log(`👤 Client name: ${testReminder.clientName}`);
  console.log(`⏰ Time: ${testReminder.appointments[0].appointmentTime}`);
  console.log('🔄 Sending test message...\n');
  
  // Send the test WhatsApp message
  const success = await whatsAppService.sendClientDailyReminder(testReminder);
  
  if (success) {
    console.log('✅ Test message sent successfully!');
    console.log(`📱 The message was delivered to +39${testReminder.clientPhone}`);
    console.log('📧 Check your WhatsApp to confirm the message format is correct.');
  } else {
    console.log('❌ Test message failed to send.');
    console.log('🔍 Check the server logs for error details.');
  }
  
} catch (error) {
  console.error('❌ Error in WhatsApp test:', error);
}

console.log('\n🏁 WhatsApp format test completed'); 