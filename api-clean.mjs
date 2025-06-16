async function cleanViaAPI() {
  try {
    console.log('🧹 Pulizia duplicati via API...\n');
    
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
      console.error('❌ Login fallito:', await loginResponse.text());
      return;
    }
    
    console.log('✅ Login riuscito');
    
    // Get the session cookie
    const cookies = loginResponse.headers.get('set-cookie');
    
    // Now call the cleanup endpoint
    console.log('🧹 Chiamata endpoint pulizia...');
    const cleanResponse = await fetch('http://localhost:5000/api/admin/clean-duplicates', {
      method: 'POST',
      headers: {
        'Cookie': cookies || '',
        'Content-Type': 'application/json'
      }
    });
    
    if (!cleanResponse.ok) {
      console.error('❌ Pulizia fallita:', cleanResponse.status, await cleanResponse.text());
      return;
    }
    
    const result = await cleanResponse.json();
    console.log('✅ Pulizia completata!');
    console.log(`🗑️ Eliminati: ${result.deleted} duplicati`);
    console.log(`📊 Gruppi di duplicati: ${result.duplicateGroups}`);
    console.log(`💬 Messaggio: ${result.message}`);
    
    // Check today's appointments
    console.log('\n📅 Controllo appuntamenti di oggi...');
    const today = new Date().toISOString().split('T')[0];
    const appointmentsResponse = await fetch(`http://localhost:5000/api/appointments?date=${today}`, {
      headers: {
        'Cookie': cookies || ''
      }
    });
    
    if (appointmentsResponse.ok) {
      const appointments = await appointmentsResponse.json();
      console.log(`📊 Appuntamenti di oggi: ${appointments.length}`);
      appointments.forEach(apt => {
        console.log(`  ID:${apt.id} | ${apt.startTime} - ${apt.client.firstName} ${apt.client.lastName} - ${apt.service.name} - ${apt.stylist.name}`);
      });
    }
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

cleanViaAPI(); 