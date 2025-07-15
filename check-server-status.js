// Check if server is running and healthy
import fetch from 'node-fetch';

async function checkServerStatus() {
  console.log('🔍 Checking server status...\n');
  
  const baseUrl = 'https://sallon1-1.onrender.com';
  
  try {
    // 1. Check health endpoint
    console.log('📡 Checking health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Server is healthy:');
      console.log(JSON.stringify(health, null, 2));
    } else {
      console.log(`❌ Health check failed: ${healthResponse.status}`);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. Check debug endpoint
    console.log('📊 Checking debug endpoint...');
    const debugResponse = await fetch(`${baseUrl}/api/debug-reminder`);
    
    if (debugResponse.ok) {
      const debug = await debugResponse.json();
      console.log('✅ Debug endpoint working:');
      console.log(JSON.stringify(debug, null, 2));
    } else {
      console.log(`❌ Debug endpoint failed: ${debugResponse.status}`);
      const errorText = await debugResponse.text();
      console.log('Error:', errorText);
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. Check if scheduler is running (try to trigger manually)
    console.log('🔄 Trying to trigger scheduler manually...');
    const reminderResponse = await fetch(`${baseUrl}/api/reminders`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' }
    });
    
    if (reminderResponse.ok) {
      const result = await reminderResponse.json();
      console.log('✅ Manual trigger successful:');
      console.log(JSON.stringify(result, null, 2));
    } else {
      console.log(`❌ Manual trigger failed: ${reminderResponse.status}`);
      const errorText = await reminderResponse.text();
      console.log('Error:', errorText);
    }
    
  } catch (error) {
    console.error('❌ Network error - server might be completely down:', error.message);
  }
}

checkServerStatus().catch(console.error);