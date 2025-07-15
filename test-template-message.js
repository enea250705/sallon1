// Test WhatsApp approved template message
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

async function testTemplateMessage() {
  console.log('📋 Testing WhatsApp approved template message...\n');
  
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const phoneNumberId = process.env.WHATSAPP_PHONE_NUMBER_ID;
  
  // Use your approved template
  const templateName = 'appointment_reminder';
  const targetPhone = '+393761024080';
  
  console.log(`📱 Sending template "${templateName}" to ${targetPhone}`);
  
  const url = `https://graph.facebook.com/v18.0/${phoneNumberId}/messages`;
  
  // Template message payload
  const payload = {
    messaging_product: 'whatsapp',
    to: targetPhone,
    type: 'template',
    template: {
      name: templateName,
      language: {
        code: 'it' // Italian language
      },
      components: [
        {
          type: 'body',
          parameters: [
            {
              type: 'text',
              text: 'Bruno' // {{1}} - Client name
            },
            {
              type: 'text',
              text: '19:00' // {{2}} - Time
            },
            {
              type: 'text',
              text: 'Taglio' // {{3}} - Service
            }
          ]
        }
      ]
    }
  };
  
  console.log('📄 Template payload:');
  console.log(JSON.stringify(payload, null, 2));
  console.log('\n');
  
  try {
    const response = await fetch(url, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${accessToken}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(payload)
    });
    
    console.log(`📡 Response Status: ${response.status}`);
    
    if (response.ok) {
      const result = await response.json();
      console.log('✅ Template message sent successfully!');
      console.log(JSON.stringify(result, null, 2));
      console.log('\n📱 Check your WhatsApp now for the template message!');
    } else {
      const error = await response.text();
      console.log('❌ Template message failed:');
      console.log(error);
      
      // Try to get more details about the template
      console.log('\n🔍 Let me check your template details...');
      await checkTemplate(accessToken, phoneNumberId, templateName);
    }
    
  } catch (error) {
    console.error('❌ Network error:', error);
  }
}

async function checkTemplate(accessToken, phoneNumberId, templateName) {
  try {
    const templateUrl = `https://graph.facebook.com/v18.0/${phoneNumberId}/message_templates?name=${templateName}`;
    const response = await fetch(templateUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (response.ok) {
      const templates = await response.json();
      console.log('📋 Template details:');
      console.log(JSON.stringify(templates, null, 2));
    } else {
      console.log('❌ Could not fetch template details');
    }
  } catch (error) {
    console.log('❌ Error checking template:', error);
  }
}

testTemplateMessage().catch(console.error);