// Check WhatsApp template structure
import { config } from 'dotenv';
import fetch from 'node-fetch';

config();

async function checkTemplateStructure() {
  console.log('🔍 Checking WhatsApp template structure...\n');
  
  const accessToken = process.env.WHATSAPP_ACCESS_TOKEN;
  const businessAccountId = process.env.WHATSAPP_BUSINESS_ACCOUNT_ID;
  
  try {
    // Get all templates for the business account
    const templateUrl = `https://graph.facebook.com/v18.0/${businessAccountId}/message_templates`;
    const response = await fetch(templateUrl, {
      headers: { 'Authorization': `Bearer ${accessToken}` }
    });
    
    if (response.ok) {
      const templates = await response.json();
      console.log('📋 All templates:');
      console.log(JSON.stringify(templates, null, 2));
      
      // Find the appointment_reminder template
      const appointmentTemplate = templates.data?.find(t => t.name === 'appointment_reminder');
      
      if (appointmentTemplate) {
        console.log('\n🎯 Found appointment_reminder template:');
        console.log(JSON.stringify(appointmentTemplate, null, 2));
        
        // Show the body component details
        const bodyComponent = appointmentTemplate.components?.find(c => c.type === 'BODY');
        if (bodyComponent) {
          console.log('\n📝 Body component:');
          console.log(JSON.stringify(bodyComponent, null, 2));
          console.log(`\n📊 Expected parameters: ${bodyComponent.text?.match(/\{\{[^}]+\}\}/g)?.length || 0}`);
        }
      } else {
        console.log('\n❌ appointment_reminder template not found');
      }
      
    } else {
      const error = await response.text();
      console.log('❌ Failed to get templates:');
      console.log(error);
    }
    
  } catch (error) {
    console.error('❌ Error checking templates:', error);
  }
}

checkTemplateStructure().catch(console.error);