// Verifica e risolve il problema del fuso orario
console.log('🌍 ANALISI PROBLEMA FUSO ORARIO\n');

async function fixTimezoneIssue() {
  console.log('🔍 DIAGNOSI PROBLEMA:');
  console.log('='.repeat(60));
  
  // Ora locale (Italia)
  const oraItalia = new Date();
  console.log(`🇮🇹 Ora Italia: ${oraItalia.toLocaleString('it-IT', { timeZone: 'Europe/Rome' })}`);
  console.log(`🇮🇹 Ora Italia (ISO): ${oraItalia.toISOString()}`);
  
  // Ora UTC
  const oraUTC = new Date();
  console.log(`🌍 Ora UTC: ${oraUTC.toUTCString()}`);
  
  // Differenza
  const offsetMinuti = oraItalia.getTimezoneOffset();
  console.log(`⏰ Differenza UTC: ${-offsetMinuti / 60} ore`);
  
  console.log('\n📊 CALCOLO CORRETTO:');
  console.log('='.repeat(60));
  
  // Calcolo per le 9:00 AM Italia
  const domani9AMItalia = new Date();
  domani9AMItalia.setDate(domani9AMItalia.getDate() + 1);
  domani9AMItalia.setHours(9, 0, 0, 0);
  
  // Converti in UTC per il server
  const domani9AMUTC = new Date(domani9AMItalia.getTime() - (offsetMinuti * 60000));
  
  console.log(`🎯 9:00 AM Italia (domani): ${domani9AMItalia.toLocaleString('it-IT')}`);
  console.log(`🌍 9:00 AM Italia in UTC: ${domani9AMUTC.toUTCString()}`);
  
  const minutiCorretti = Math.round((domani9AMItalia.getTime() - oraItalia.getTime()) / 1000 / 60);
  console.log(`⏱️  Minuti corretti fino alle 9:00 AM Italia: ${minutiCorretti}`);
  
  console.log('\n⚠️  PROBLEMA IDENTIFICATO:');
  console.log('='.repeat(60));
  console.log('❌ Il server Render usa UTC, non il fuso orario italiano');
  console.log('❌ 813 minuti = 13.5 ore = esecuzione alle 11:01 AM Italia');
  console.log('❌ Invece delle 9:00 AM come volevi');
  
  console.log('\n🔧 SOLUZIONI:');
  console.log('='.repeat(60));
  
  console.log('\n💡 SOLUZIONE 1 - Correzione Automatica:');
  console.log('   • Modificare il codice per usare il fuso orario italiano');
  console.log('   • Usare process.env.TZ = "Europe/Rome"');
  console.log('   • O calcolare manualmente l\'offset');
  
  console.log('\n💡 SOLUZIONE 2 - Accettare UTC:');
  console.log('   • Lasciare il server in UTC');
  console.log('   • Ma configurarlo per le 7:00 AM UTC = 9:00 AM Italia');
  
  console.log('\n💡 SOLUZIONE 3 - Verifica Render:');
  console.log('   • Controllare se il server funziona davvero alle 9:00 AM Italia');
  console.log('   • Potrebbe autocorreggersi in base al deploy location');
  
  console.log('\n🧪 TEST VERIFICA SERVER RENDER:');
  console.log('='.repeat(60));
  
  try {
    const renderUrl = 'https://sallon1-1.onrender.com';
    
    // Test endpoint per vedere l'ora del server
    console.log('🔍 Controllando ora del server Render...');
    
    const healthResponse = await fetch(`${renderUrl}/api/health`);
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log(`📊 Server timestamp: ${health.timestamp}`);
      
      const serverTime = new Date(health.timestamp);
      const serverLocal = serverTime.toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
      console.log(`🕘 Ora server in Italia: ${serverLocal}`);
      
      const diffMinuti = Math.abs(oraItalia.getTime() - serverTime.getTime()) / 1000 / 60;
      console.log(`⏰ Differenza con ora locale: ${Math.round(diffMinuti)} minuti`);
      
      if (diffMinuti < 5) {
        console.log('✅ Server sincronizzato con ora italiana!');
        console.log('✅ Il problema potrebbe risolversi automaticamente');
      } else {
        console.log('❌ Server non sincronizzato - serve correzione');
      }
    }
    
  } catch (error) {
    console.log(`❌ Errore test server: ${error.message}`);
  }
  
  console.log('\n🎯 RACCOMANDAZIONE IMMEDIATA:');
  console.log('='.repeat(60));
  console.log('1. 🔧 APPLICA correzione fuso orario nel codice');
  console.log('2. 📤 DEPLOY la correzione');
  console.log('3. 🧪 TESTA il nuovo calcolo');
  console.log('4. ✅ VERIFICA che mostri il tempo corretto');
  
  console.log('\n⚠️  STATO ATTUALE:');
  if (813 > 720) { // se più di 12 ore
    console.log('❌ SISTEMA ATTUALE: Invierà messaggi alle 11:00+ AM Italia');
    console.log('❌ NON alle 9:00 AM come desiderato');
    console.log('🔧 SERVE CORREZIONE IMMEDIATA!');
  } else {
    console.log('✅ Sistema funzionerà alle 9:00 AM');
  }
}

fixTimezoneIssue(); 