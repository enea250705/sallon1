// Test the daily-trigger endpoint
console.log('🧪 Testing /api/reminders/daily-trigger endpoint...\n');

async function testDailyTriggerEndpoint() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Wait for server to start
    console.log('⏳ Waiting for server to start...');
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // 1. First check if server is running
    console.log('🔍 Checking if server is running...');
    const healthResponse = await fetch(`${baseUrl}/api/health`);
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log('✅ Server is running:', health.status);
      console.log(`⏰ Uptime: ${Math.round(health.uptime / 60)} minutes\n`);
    } else {
      console.log('❌ Server not responding to health check');
      return;
    }
    
    // 2. Try to access the daily-trigger endpoint
    console.log('📡 Testing daily-trigger endpoint...');
    const response = await fetch(`${baseUrl}/api/reminders/daily-trigger`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        // Try without authentication first
      }
    });
    
    console.log(`📊 Response status: ${response.status}`);
    const responseText = await response.text();
    
    if (response.status === 401) {
      console.log('🔐 PROBLEMA: Endpoint richiede autenticazione!');
      console.log('📋 Risposta:', responseText);
      console.log('\n💡 Soluzioni:');
      console.log('1. Effettua login dal browser prima');
      console.log('2. Usa endpoint di test senza auth');
      console.log('3. Aggiungi credenziali al test');
    } else if (response.status === 404) {
      console.log('❌ PROBLEMA: Endpoint non trovato (404)');
      console.log('📋 Risposta:', responseText);
      console.log('\n💡 Possibili cause:');
      console.log('1. Router non registrato correttamente');
      console.log('2. URL sbagliato');
      console.log('3. Server non completamente avviato');
    } else if (response.ok) {
      console.log('✅ SUCCESS: Endpoint funziona!');
      try {
        const result = JSON.parse(responseText);
        console.log('📋 Risposta:', JSON.stringify(result, null, 2));
      } catch {
        console.log('📋 Risposta:', responseText);
      }
    } else {
      console.log(`⚠️ Errore (${response.status}):`, responseText);
    }
    
  } catch (error) {
    console.error('❌ Errore di connessione:', error.message);
    console.log('\n💡 Verifica:');
    console.log('1. Server avviato con: npm run dev');
    console.log('2. Porta 5000 libera');
    console.log('3. Nessun firewall attivo');
  }
  
  console.log('\n🔧 Debug info:');
  console.log('• Endpoint: POST /api/reminders/daily-trigger');
  console.log('• Richiede autenticazione: SÌ');
  console.log('• Funzione: triggerManualReminder del dailyReminderService');
}

testDailyTriggerEndpoint(); 