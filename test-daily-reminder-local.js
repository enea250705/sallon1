// Test the daily reminder service locally
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

async function testDailyReminderLocally() {
  console.log('🧪 Testing daily reminder service logic locally...\n');
  
  // Simulate the daily reminder service logic
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  if (!accessToken || !phoneNumberId) {
    console.log('❌ Missing WhatsApp credentials');
    return;
  }
  
  console.log('✅ WhatsApp credentials found');
  
  // Test data from your appointment
  const testAppointment = {
    id: 758,
    clientName: 'Enea Muja',
    phone: '+393761024080',
    time: '20:15:00',
    service: 'Ricostruzione + Piega',
    reminderSent: false,
    status: 'scheduled'
  };
  
  console.log('📱 Testing appointment:', JSON.stringify(testAppointment, null, 2));
  
  // Test phone number validation (like in whatsapp.ts)
  function validatePhoneNumber(phone) {
    const cleanPhone = phone.replace(/\s+/g, '');
    
    const italianMobileRegex = /^3\d{9}$/;
    const italianWithCountryRegex = /^39\d{10}$/;
    const internationalRegex = /^\+39\d{10}$/;
    const generalInternationalRegex = /^\+[1-9]\d{1,14}$/;
    
    return italianMobileRegex.test(cleanPhone) || 
           italianWithCountryRegex.test(cleanPhone) ||
           internationalRegex.test(cleanPhone) ||
           generalInternationalRegex.test(cleanPhone);
  }
  
  // Test phone number formatting (like in whatsapp.ts)
  function formatPhoneNumber(phone) {
    let formatted = phone.replace(/[^\d+]/g, '');
    
    if (!formatted.startsWith('+')) {
      if (formatted.length === 10 && formatted.startsWith('3')) {
        formatted = '+39' + formatted;
      } else if (formatted.startsWith('39') && formatted.length === 12) {
        formatted = '+' + formatted;
      } else {
        formatted = '+39' + formatted;
      }
    }
    
    return formatted;
  }
  
  // Validate the appointment
  console.log('\n🔍 Validation checks:');
  
  // Check 1: reminderSent
  if (testAppointment.reminderSent) {
    console.log('❌ reminderSent is true - would skip');
    return;
  }
  console.log('✅ reminderSent is false - would process');
  
  // Check 2: status
  if (testAppointment.status !== 'scheduled') {
    console.log(`❌ status is '${testAppointment.status}' - would skip`);
    return;
  }
  console.log('✅ status is scheduled - would process');
  
  // Check 3: phone number validation
  const isValidPhone = validatePhoneNumber(testAppointment.phone);
  if (!isValidPhone) {
    console.log(`❌ Invalid phone number: ${testAppointment.phone}`);
    return;
  }
  console.log(`✅ Valid phone number: ${testAppointment.phone}`);
  
  // Check 4: phone number formatting
  const formattedPhone = formatPhoneNumber(testAppointment.phone);
  console.log(`📱 Formatted phone: ${formattedPhone}`);
  
  // Test WhatsApp template message
  console.log('\n📤 Testing WhatsApp template message...');
  
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  const payload = {
    messaging_product: 'whatsapp',
    to: formattedPhone,
    type: 'template',
    template: {
      name: 'appointment_reminder',
      language: { code: 'it' },
      components: [{
        type: 'body',
        parameters: [
          { type: 'text', text: testAppointment.clientName },
          { type: 'text', text: testAppointment.time.slice(0, 5) },
          { type: 'text', text: testAppointment.service }
        ]
      }]
    }
  };
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ WhatsApp template message sent successfully!');
      console.log('📱 Check your WhatsApp now!');
      console.log('Message ID:', result.messages[0]?.id);
    } else {
      const error = await response.text();
      console.log('❌ WhatsApp API error:', error);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
  
  console.log('\n🎯 This simulates exactly what the daily reminder service would do!');
}

testDailyReminderLocally().catch(console.error);