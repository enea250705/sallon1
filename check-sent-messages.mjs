// Check which phone numbers received WhatsApp messages
console.log('📱 Controllo messaggi WhatsApp inviati...\n');

async function checkSentMessages() {
  const baseUrl = 'http://localhost:5000';
  
  try {
    // Get tomorrow's date
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];
    
    console.log(`📅 Controllo appuntamenti per domani: ${tomorrowStr}`);
    console.log(`📅 Data completa: ${tomorrow.toLocaleDateString('it-IT', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}\n`);
    
    // 1. Get debug info about tomorrow's appointments
    console.log('🔍 Recupero informazioni appuntamenti...');
    const debugResponse = await fetch(`${baseUrl}/api/test/debug-reminder`);
    
    if (debugResponse.ok) {
      const debugData = await debugResponse.json();
      
      console.log(`📊 RIEPILOGO APPUNTAMENTI PER DOMANI:`);
      console.log(`📅 Data: ${debugData.date}`);
      console.log(`📋 Totale appuntamenti: ${debugData.totalAppointments}`);
      console.log(`✅ Reminder già inviati: ${debugData.remindersSent}`);
      console.log(`📱 Reminder da inviare: ${debugData.remindersNeeded}\n`);
      
      if (debugData.appointments && debugData.appointments.length > 0) {
        console.log('📱 DETTAGLI CLIENTI E NUMERI DI TELEFONO:');
        console.log('='.repeat(80));
        
        debugData.appointments.forEach((apt, index) => {
          const status = apt.reminderSent ? '✅ GIÀ INVIATO' : '📱 DA INVIARE';
          console.log(`${index + 1}. ${apt.clientName}`);
          console.log(`   📞 Telefono: ${apt.phone || 'NON DISPONIBILE'}`);
          console.log(`   🕐 Orario: ${apt.time}`);
          console.log(`   💅 Servizio: ${apt.service}`);
          console.log(`   📲 Stato reminder: ${status}`);
          console.log(`   📊 Status appuntamento: ${apt.status}`);
          console.log('');
        });
        
        // Count numbers that would receive messages
        const numbersToSend = debugData.appointments
          .filter(apt => !apt.reminderSent && apt.phone && apt.status === 'scheduled')
          .map(apt => apt.phone);
          
        console.log('📱 NUMERI CHE RICEVERANNO IL MESSAGGIO:');
        console.log('='.repeat(50));
        if (numbersToSend.length > 0) {
          numbersToSend.forEach((phone, index) => {
            console.log(`${index + 1}. ${phone}`);
          });
          console.log(`\n📊 Totale messaggi da inviare: ${numbersToSend.length}`);
        } else {
          console.log('❌ Nessun messaggio da inviare');
          console.log('💡 Possibili motivi:');
          console.log('   • Reminder già inviati');
          console.log('   • Numeri di telefono mancanti');
          console.log('   • Appuntamenti non in stato "scheduled"');
          console.log('   • Nessun appuntamento per domani');
        }
        
      } else {
        console.log('📅 Non ci sono appuntamenti per domani');
      }
      
    } else {
      console.log('❌ Errore nel recupero dati appuntamenti:', debugResponse.status);
    }
    
    console.log('\n' + '='.repeat(80));
    console.log('🧪 TRIGGER MANUALE EFFETTUATO');
    console.log('Se hai visto questo output, il sistema ha tentato di inviare messaggi');
    console.log('ai numeri elencati sopra (se ce ne sono).');
    
  } catch (error) {
    console.error('❌ Errore:', error.message);
  }
}

checkSentMessages(); 