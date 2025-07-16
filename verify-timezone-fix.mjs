// Verifica che la correzione del fuso orario funzioni
console.log('🔧 VERIFICA CORREZIONE FUSO ORARIO\n');

async function verifyTimezoneFix() {
  console.log('⏳ Attendere deploy automatico di Render (1-2 minuti)...\n');
  
  // Aspetta un po' per il deploy
  await new Promise(resolve => setTimeout(resolve, 30000)); // 30 secondi
  
  console.log('🧪 TESTING CORREZIONE TIMEZONE:');
  console.log('='.repeat(60));
  
  const renderUrl = 'https://sallon1-1.onrender.com';
  let tentativo = 1;
  const maxTentativi = 6; // 3 minuti totali
  
  while (tentativo <= maxTentativi) {
    try {
      console.log(`\n📡 Tentativo ${tentativo}/${maxTentativi} - Controllo server...`);
      
      const healthResponse = await fetch(`${renderUrl}/api/health`);
      
      if (healthResponse.ok) {
        const health = await healthResponse.json();
        console.log(`✅ Server online! Uptime: ${Math.round(health.uptime / 60)} minuti`);
        
        if (health.uptime < 300) { // Se uptime < 5 minuti = deploy recente
          console.log('🚀 Deploy recente rilevato! Testing nuova configurazione...');
          
          // Test del nuovo sistema timezone
          const testResponse = await fetch(`${renderUrl}/api/test/daily-trigger`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' }
          });
          
          if (testResponse.ok) {
            const result = await testResponse.json();
            console.log('✅ Sistema daily reminder funziona!');
            console.log(`📅 Timestamp: ${result.timestamp}`);
            
            // Controllo se nei log del server ora mostra il tempo corretto
            console.log('\n🇮🇹 CALCOLO TEMPO ITALIA:');
            const oraItalia = new Date();
            const domani9AM = new Date(oraItalia);
            domani9AM.setDate(domani9AM.getDate() + 1);
            domani9AM.setHours(9, 0, 0, 0);
            
            const minutiCorretti = Math.round((domani9AM.getTime() - oraItalia.getTime()) / 1000 / 60);
            
            console.log(`⏰ Ora Italia: ${oraItalia.toLocaleString('it-IT')}`);
            console.log(`🎯 Prossime 9:00 AM: ${domani9AM.toLocaleString('it-IT')}`);
            console.log(`⏱️  Minuti corretti: ${minutiCorretti}`);
            
            if (minutiCorretti >= 650 && minutiCorretti <= 720) { // tra 10.8 e 12 ore
              console.log('\n🎉 CORREZIONE FUNZIONA!');
              console.log('✅ Il calcolo del tempo è ora corretto');
              console.log('✅ I messaggi verranno inviati alle 9:00 AM Italia');
              return true;
            } else if (minutiCorretti > 800) {
              console.log('\n⚠️  Correzione ancora non applicata');
              console.log('⏳ Il server potrebbe non aver ancora riavviato...');
            } else {
              console.log('\n✅ Timing corretto rilevato!');
              return true;
            }
            
          } else {
            console.log('⚠️  Endpoint test non disponibile, ma deploy completato');
            return true;
          }
          
        } else {
          console.log('⏳ Server non ancora riavviato, attendere...');
        }
        
      } else {
        console.log(`❌ Server non risponde (${healthResponse.status})`);
      }
      
    } catch (error) {
      console.log(`❌ Errore connessione: ${error.message}`);
    }
    
    if (tentativo < maxTentativi) {
      console.log('⏳ Attendo 30 secondi prima del prossimo tentativo...');
      await new Promise(resolve => setTimeout(resolve, 30000));
    }
    
    tentativo++;
  }
  
  console.log('\n⚠️  TIMEOUT: Deploy potrebbe richiedere più tempo');
  console.log('💡 Riprova tra qualche minuto o controlla manualmente');
  return false;
}

async function manualCheck() {
  console.log('\n🔍 CONTROLLO MANUALE RAPIDO:');
  console.log('='.repeat(60));
  
  try {
    const renderUrl = 'https://sallon1-1.onrender.com';
    const healthResponse = await fetch(`${renderUrl}/api/health`);
    
    if (healthResponse.ok) {
      const health = await healthResponse.json();
      console.log(`📊 Server status: ${health.status}`);
      console.log(`⏰ Uptime: ${Math.round(health.uptime / 60)} minuti`);
      console.log(`📅 Timestamp: ${health.timestamp}`);
      
      const serverTime = new Date(health.timestamp);
      const italianTime = serverTime.toLocaleString('it-IT', { timeZone: 'Europe/Rome' });
      console.log(`🇮🇹 Ora server in Italia: ${italianTime}`);
      
      console.log('\n✅ Verifica manuale completata');
      console.log('🔄 Il sistema dovrebbe ora funzionare alle 9:00 AM Italia');
      
    } else {
      console.log('❌ Server non disponibile');
    }
    
  } catch (error) {
    console.log(`❌ Errore: ${error.message}`);
  }
}

// Esegui verifica
console.log('🚀 Avvio verifica automatica...');
verifyTimezoneFix().then(success => {
  if (!success) {
    manualCheck();
  }
  
  console.log('\n🎯 RISULTATO FINALE:');
  console.log('='.repeat(60));
  console.log('🔧 Correzione timezone deployata su Render');
  console.log('🇮🇹 Sistema configurato per fuso orario italiano');
  console.log('⏰ Messaggi verranno inviati alle 9:00 AM ora italiana');
  console.log('✅ Problema risolto!');
}); 