// Test the new test endpoint without authentication
console.log('🧪 Testing /api/test/daily-trigger endpoint (no auth)...\n');

async function testNewEndpoint() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    // 1. Test health endpoint first
    console.log('🔍 Testing health endpoint...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    console.log(`Health status: ${healthResponse.status}`);
    
    if (healthResponse.ok) {
      try {
        const health = await healthResponse.json();
        console.log('✅ Health check OK:', health.status);
      } catch {
        console.log('⚠️ Health endpoint returned HTML instead of JSON');
      }
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 2. Test the new test endpoint
    console.log('📡 Testing new test endpoint: /api/test/daily-trigger');
    const response = await fetch(`${baseUrl}/api/test/daily-trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`📊 Response status: ${response.status}`);
    console.log(`📊 Content-Type: ${response.headers.get('content-type')}`);
    
    const responseText = await response.text();
    
    if (response.ok) {
      try {
        const result = JSON.parse(responseText);
        console.log('✅ SUCCESS: Endpoint funziona!');
        console.log('📋 Risposta JSON:', JSON.stringify(result, null, 2));
      } catch {
        console.log('⚠️ Response is not JSON:');
        console.log(responseText.substring(0, 500) + '...');
      }
    } else {
      console.log(`❌ Error (${response.status}):`, responseText.substring(0, 500));
    }
    
    console.log('\n' + '='.repeat(50) + '\n');
    
    // 3. Test original endpoint for comparison
    console.log('📡 Testing original endpoint: /api/reminders/daily-trigger');
    const originalResponse = await fetch(`${baseUrl}/api/reminders/daily-trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      }
    });
    
    console.log(`📊 Original endpoint status: ${originalResponse.status}`);
    console.log(`📊 Original Content-Type: ${originalResponse.headers.get('content-type')}`);
    
    const originalText = await originalResponse.text();
    if (originalText.includes('<html>')) {
      console.log('⚠️ Original endpoint returns HTML (routing issue)');
    } else {
      console.log('✅ Original endpoint returns proper response');
    }
    
  } catch (error) {
    console.error('❌ Connection error:', error.message);
  }
  
  console.log('\n🔧 Next steps:');
  console.log('1. Use /api/test/daily-trigger for testing');
  console.log('2. Fix routing issue for production endpoints');
  console.log('3. Check server logs for any errors');
}

testNewEndpoint(); 