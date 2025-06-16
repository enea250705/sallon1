import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function cleanDuplicatesDirectly() {
  try {
    console.log('🧹 Pulizia diretta appuntamenti duplicati...\n');
    
    // Count total appointments before
    const countBefore = await sql`SELECT COUNT(*) as count FROM appointments`;
    console.log(`📊 Totale appuntamenti prima: ${countBefore[0].count}`);
    
    // Find duplicates with a simpler approach
    console.log('🔍 Ricerca duplicati...');
    
    // Get all appointments ordered by ID (oldest first)
    const allAppointments = await sql`
      SELECT id, date, start_time, client_id, stylist_id, service_id, created_at
      FROM appointments 
      ORDER BY id ASC
    `;
    
    console.log(`📋 Appuntamenti totali trovati: ${allAppointments.length}`);
    
    // Group by key fields to find duplicates
    const seen = new Set();
    const toDelete = [];
    
    for (const apt of allAppointments) {
      const key = `${apt.date}-${apt.start_time}-${apt.client_id}-${apt.stylist_id}-${apt.service_id}`;
      
      if (seen.has(key)) {
        // This is a duplicate - mark for deletion
        toDelete.push(apt.id);
        console.log(`❌ Duplicato trovato: ID ${apt.id} (${apt.date} ${apt.start_time})`);
      } else {
        // First occurrence - keep it
        seen.add(key);
        console.log(`✅ Mantengo: ID ${apt.id} (${apt.date} ${apt.start_time})`);
      }
    }
    
    if (toDelete.length === 0) {
      console.log('✅ Nessun duplicato trovato!');
      return;
    }
    
    console.log(`\n🗑️ Eliminazione di ${toDelete.length} duplicati...`);
    
    // Delete duplicates one by one
    for (const id of toDelete) {
      await sql`DELETE FROM appointments WHERE id = ${id}`;
      console.log(`🗑️ Eliminato ID: ${id}`);
    }
    
    // Count after cleanup
    const countAfter = await sql`SELECT COUNT(*) as count FROM appointments`;
    console.log(`\n✅ Pulizia completata!`);
    console.log(`📊 Appuntamenti prima: ${countBefore[0].count}`);
    console.log(`📊 Appuntamenti dopo: ${countAfter[0].count}`);
    console.log(`🗑️ Eliminati: ${countBefore[0].count - countAfter[0].count}`);
    
    // Show today's appointments after cleanup
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = await sql`
      SELECT a.id, a.start_time, c.first_name, c.last_name, s.name as stylist_name, sv.name as service_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN stylists s ON a.stylist_id = s.id
      LEFT JOIN services sv ON a.service_id = sv.id
      WHERE a.date = ${today}
      ORDER BY a.start_time
    `;
    
    console.log(`\n📅 Appuntamenti di oggi (${today}): ${todayAppointments.length}`);
    todayAppointments.forEach(apt => {
      console.log(`  ID:${apt.id} | ${apt.start_time} - ${apt.first_name} ${apt.last_name} - ${apt.service_name} - ${apt.stylist_name}`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

cleanDuplicatesDirectly(); 