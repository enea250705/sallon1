import { drizzle } from 'drizzle-orm/neon-http';
import { neon } from '@neondatabase/serverless';
import { appointments, clients, stylists, services } from './server/db/schema.js';
import { eq } from 'drizzle-orm';
import dotenv from 'dotenv';

dotenv.config();

const sql = neon(process.env.DATABASE_URL);
const db = drizzle(sql);

async function checkDuplicates() {
  try {
    console.log('🔍 Controllo appuntamenti duplicati...\n');
    
    // Get all appointments with details
    const results = await db
      .select({
        appointment: appointments,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(stylists, eq(appointments.stylistId, stylists.id))
      .leftJoin(services, eq(appointments.serviceId, services.id));

    console.log(`📊 Totale appuntamenti trovati: ${results.length}\n`);

    // Group by key fields to find duplicates
    const appointmentMap = new Map();
    const duplicates = [];

    results.forEach(result => {
      const key = `${result.appointment.date}-${result.appointment.startTime}-${result.appointment.clientId}-${result.appointment.stylistId}-${result.appointment.serviceId}`;
      
      if (appointmentMap.has(key)) {
        const existing = appointmentMap.get(key);
        if (!duplicates.find(d => d.key === key)) {
          duplicates.push({
            key,
            appointments: [existing, result]
          });
        } else {
          duplicates.find(d => d.key === key).appointments.push(result);
        }
      } else {
        appointmentMap.set(key, result);
      }
    });

    if (duplicates.length > 0) {
      console.log(`❌ Trovati ${duplicates.length} gruppi di appuntamenti duplicati:\n`);
      
      duplicates.forEach((dup, index) => {
        console.log(`Duplicato ${index + 1}:`);
        dup.appointments.forEach(apt => {
          console.log(`  ID: ${apt.appointment.id} | ${apt.appointment.date} ${apt.appointment.startTime} | ${apt.client?.firstName} ${apt.client?.lastName} | ${apt.service?.name} | ${apt.stylist?.name}`);
        });
        console.log('');
      });
    } else {
      console.log('✅ Nessun duplicato trovato!');
    }

    // Show today's appointments
    const today = new Date().toISOString().split('T')[0];
    const todayAppointments = results.filter(r => r.appointment.date === today);
    
    console.log(`\n📅 Appuntamenti di oggi (${today}): ${todayAppointments.length}`);
    todayAppointments.forEach(apt => {
      console.log(`  ID: ${apt.appointment.id} | ${apt.appointment.startTime} | ${apt.client?.firstName} ${apt.client?.lastName} | ${apt.service?.name} | ${apt.stylist?.name}`);
    });

    // Show unique IDs
    const uniqueIds = new Set(results.map(r => r.appointment.id));
    console.log(`\n🔢 ID unici: ${uniqueIds.size}`);
    console.log(`🔢 Totale record: ${results.length}`);
    
    if (uniqueIds.size !== results.length) {
      console.log(`❌ Differenza: ${results.length - uniqueIds.size} duplicati per ID!`);
    }

  } catch (error) {
    console.error('❌ Errore:', error);
  }
}

checkDuplicates(); 