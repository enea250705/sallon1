// Test WhatsApp service configuration and phone validation
console.log('📱 WhatsApp Service Debug Test\n');

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

// Test common Italian phone number formats + your number
const testPhones = [
  '3761024080',           // Your actual number
  '3123456789',           // Standard Italian mobile
  '+393123456789',        // International format
  '393123456789',         // With country code
  '312 345 6789',         // With spaces
  '+39 312 345 6789',     // International with spaces
];

console.log('🔍 Phone Number Validation Tests:');
console.log('='.repeat(50));

testPhones.forEach(phone => {
  const isValid = validatePhoneNumber(phone);
  const formatted = formatPhoneNumber(phone);
  console.log(`${phone.padEnd(20)} -> Valid: ${isValid ? '✅' : '❌'} -> Formatted: ${formatted}`);
});

console.log('\n📋 Environment Variables Check:');
console.log('='.repeat(50));

const requiredEnvs = [
  'WHATSAPP_ACCESS_TOKEN',
  'WHATSAPP_PHONE_NUMBER_ID', 
  'WHATSAPP_BUSINESS_ACCOUNT_ID'
];

requiredEnvs.forEach(env => {
  const value = process.env[env];
  const status = value ? '✅ Set' : '❌ Missing';
  const preview = value ? `(${value.substring(0, 20)}...)` : '';
  console.log(`${env.padEnd(30)} -> ${status} ${preview}`);
});

console.log('\n🎯 Debugging Tips:');
console.log('• Check Render dashboard environment variables');
console.log('• Verify WhatsApp Business API credentials');
console.log('• Check server logs for "WhatsApp credentials not configured"');
console.log('• Ensure phone number in client profile is valid Italian format');