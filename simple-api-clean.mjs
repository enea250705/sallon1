async function cleanViaSimpleAPI() {
  try {
    console.log('🧹 Pulizia duplicati via API semplice...\n');
    
    // First, let's try to login
    console.log('🔐 Login...');
    const loginResponse = await fetch('http://localhost:5000/api/auth/login', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        username: 'admin',
        password: 'admin123'
      })
    });
    
    if (!loginResponse.ok) {
      console.error('❌ Login fallito:', loginResponse.status);
      return;
    }
    
    console.log('✅ Login riuscito');
    
    // Get the session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    console.log('🍪 Cookie:', cookies ? 'presente' : 'assente');
    
    // Now call the simple cleanup endpoint
    console.log('🧹 Chiamata endpoint pulizia semplice...');
    const cleanResponse = await fetch('http://localhost:5000/api/admin/clean-duplicates-simple', {
      method: 'GET',
      headers: {
        'Cookie': cookies || ''
      }
    });
    
    console.log('📡 Response status:', cleanResponse.status);
    console.log('📡 Response headers:', cleanResponse.headers.get('content-type'));
    
    const responseText = await cleanResponse.text();
    console.log('📡 Response text:', responseText.substring(0, 200));
    
    if (!cleanResponse.ok) {
      console.error('❌ Pulizia fallita:', cleanResponse.status);
      return;
    }
    
    try {
      const result = JSON.parse(responseText);
      console.log('✅ Pulizia completata!');
      console.log(`🗑️ Eliminati: ${result.deleted} duplicati`);
      console.log(`📊 Totale appuntamenti: ${result.total}`);
      console.log(`💬 Messaggio: ${result.message}`);
    } catch (parseError) {
      console.error('❌ Errore parsing JSON:', parseError.message);
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

cleanViaSimpleAPI(); 