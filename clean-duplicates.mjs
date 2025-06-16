import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { appointments } from './server/db/schema.js';
import { eq, and, sql } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const sqlClient = neon(process.env.DATABASE_URL);
const db = drizzle(sqlClient);

async function cleanDuplicates() {
  try {
    console.log('🧹 Pulizia appuntamenti duplicati...\n');
    
    // First, let's see what we have
    const allAppointments = await db.select().from(appointments);
    console.log(`📊 Totale appuntamenti prima della pulizia: ${allAppointments.length}`);
    
    // Find duplicates by grouping identical appointments
    const duplicateQuery = sql`
      SELECT 
        date, start_time, client_id, stylist_id, service_id,
        array_agg(id ORDER BY id) as ids,
        count(*) as count
      FROM appointments 
      GROUP BY date, start_time, client_id, stylist_id, service_id
      HAVING count(*) > 1
    `;
    
    const duplicateGroups = await db.execute(duplicateQuery);
    
    if (duplicateGroups.length === 0) {
      console.log('✅ Nessun duplicato trovato!');
      return;
    }
    
    console.log(`❌ Trovati ${duplicateGroups.length} gruppi di duplicati`);
    
    let totalDeleted = 0;
    
    // For each group of duplicates, keep the first one and delete the rest
    for (const group of duplicateGroups) {
      const ids = group.ids;
      const keepId = ids[0]; // Keep the first (oldest) appointment
      const deleteIds = ids.slice(1); // Delete the rest
      
      console.log(`🔄 Gruppo: ${group.date} ${group.start_time} - Mantengo ID ${keepId}, elimino ${deleteIds.join(', ')}`);
      
      // Delete the duplicate appointments
      for (const deleteId of deleteIds) {
        await db.delete(appointments).where(eq(appointments.id, deleteId));
        totalDeleted++;
      }
    }
    
    console.log(`\n✅ Pulizia completata!`);
    console.log(`🗑️ Eliminati ${totalDeleted} appuntamenti duplicati`);
    
    // Check final count
    const finalAppointments = await db.select().from(appointments);
    console.log(`📊 Totale appuntamenti dopo la pulizia: ${finalAppointments.length}`);
    
  } catch (error) {
    console.error('❌ Errore durante la pulizia:', error);
  }
}

cleanDuplicates(); 