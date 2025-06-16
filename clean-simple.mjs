import { neon } from '@neondatabase/serverless';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);

async function cleanDuplicates() {
  try {
    console.log('🧹 Pulizia appuntamenti duplicati...\n');
    
    // Count total appointments before
    const countBefore = await sql`SELECT COUNT(*) as count FROM appointments`;
    console.log(`📊 Totale appuntamenti prima: ${countBefore[0].count}`);
    
    // Find and show duplicates
    const duplicates = await sql`
      SELECT 
        date, start_time, client_id, stylist_id, service_id,
        array_agg(id ORDER BY id) as ids,
        count(*) as count
      FROM appointments 
      GROUP BY date, start_time, client_id, stylist_id, service_id
      HAVING count(*) > 1
      ORDER BY date, start_time
    `;
    
    console.log(`❌ Trovati ${duplicates.length} gruppi di duplicati`);
    
    if (duplicates.length === 0) {
      console.log('✅ Nessun duplicato da rimuovere!');
      return;
    }
    
    // Show duplicates
    duplicates.forEach((dup, index) => {
      console.log(`${index + 1}. ${dup.date} ${dup.start_time} - IDs: ${dup.ids.join(', ')} (${dup.count} copie)`);
    });
    
    console.log('\n🗑️ Rimozione duplicati...');
    
    // Remove duplicates - keep only the first ID of each group
    let totalDeleted = 0;
    for (const dup of duplicates) {
      const idsToDelete = dup.ids.slice(1); // Remove all except the first
      
      for (const id of idsToDelete) {
        await sql`DELETE FROM appointments WHERE id = ${id}`;
        totalDeleted++;
      }
    }
    
    // Count after cleanup
    const countAfter = await sql`SELECT COUNT(*) as count FROM appointments`;
    console.log(`\n✅ Pulizia completata!`);
    console.log(`🗑️ Eliminati: ${totalDeleted} duplicati`);
    console.log(`📊 Totale appuntamenti dopo: ${countAfter[0].count}`);
    
    // Show today's appointments after cleanup
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = await sql`
      SELECT a.*, c.first_name, c.last_name, s.name as stylist_name, sv.name as service_name
      FROM appointments a
      LEFT JOIN clients c ON a.client_id = c.id
      LEFT JOIN stylists s ON a.stylist_id = s.id
      LEFT JOIN services sv ON a.service_id = sv.id
      WHERE a.date = ${today}
      ORDER BY a.start_time
    `;
    
    console.log(`\n📅 Appuntamenti di oggi (${today}): ${todayAppointments.length}`);
    todayAppointments.forEach(apt => {
      console.log(`  ${apt.start_time} - ${apt.first_name} ${apt.last_name} - ${apt.service_name} - ${apt.stylist_name}`);
    });
    
  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

cleanDuplicates(); 