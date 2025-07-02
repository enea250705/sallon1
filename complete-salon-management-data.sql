-- Complete Salon Management System - Sample Data
-- This file provides sample data for all the new features implemented

-- First run the migration:
-- Run migration 0004: WorkforceManager-4/migrations/0004_complete_salon_management.sql

-- =================================================================
-- DOUBLE SHIFTS SAMPLE DATA
-- =================================================================

-- Update existing stylist working hours to include double shifts
-- Example: Morning 8:00-12:00, Afternoon 14:00-18:00

-- Stylist 1 - Full time with double shifts (Monday to Friday)
UPDATE stylist_working_hours SET 
  morning_start = '08:00', 
  morning_end = '12:00',
  morning_break_start = '10:00',
  morning_break_end = '10:15',
  afternoon_start = '14:00',
  afternoon_end = '18:00',
  afternoon_break_start = '16:00',
  afternoon_break_end = '16:15'
WHERE stylist_id = 1 AND day_of_week IN (1, 2, 3, 4, 5);

-- Stylist 1 - Saturday: only morning shift
UPDATE stylist_working_hours SET 
  morning_start = '09:00', 
  morning_end = '13:00',
  morning_break_start = '11:00',
  morning_break_end = '11:15',
  afternoon_start = NULL,
  afternoon_end = NULL,
  afternoon_break_start = NULL,
  afternoon_break_end = NULL
WHERE stylist_id = 1 AND day_of_week = 6;

-- Stylist 2 - Part time with only afternoon shifts
UPDATE stylist_working_hours SET 
  morning_start = NULL, 
  morning_end = NULL,
  morning_break_start = NULL,
  morning_break_end = NULL,
  afternoon_start = '14:00',
  afternoon_end = '19:00',
  afternoon_break_start = '16:30',
  afternoon_break_end = '16:45'
WHERE stylist_id = 2 AND day_of_week IN (2, 3, 4, 5) AND is_working = true;

-- Stylist 3 - Mixed schedule
UPDATE stylist_working_hours SET 
  morning_start = '09:00', 
  morning_end = '13:00',
  morning_break_start = '11:00',
  morning_break_end = '11:30',
  afternoon_start = '15:00',
  afternoon_end = '19:00',
  afternoon_break_start = NULL,
  afternoon_break_end = NULL
WHERE stylist_id = 3 AND day_of_week IN (1, 3, 5) AND is_working = true;

-- =================================================================
-- STYLIST VACATIONS SAMPLE DATA
-- =================================================================

-- Current date vacation (adjust dates as needed)
INSERT INTO stylist_vacations (stylist_id, start_date, end_date, reason, notes, is_active) VALUES
(1, '2024-01-15', '2024-01-19', 'Ferie', 'Settimana bianca in montagna', true),
(2, '2024-02-05', '2024-02-09', 'Malattia', 'Influenza stagionale', true),
(1, '2024-03-01', '2024-03-01', 'Permesso', 'Visita medica', true),
(3, '2024-07-01', '2024-07-15', 'Ferie estive', 'Vacanze al mare con famiglia', true),
(2, '2024-08-10', '2024-08-24', 'Ferie', 'Viaggio in Europa', true),
(1, '2024-12-23', '2024-12-31', 'Ferie natalizie', 'Vacanze di Natale', true);

-- =================================================================
-- EXTRAORDINARY SALON DAYS SAMPLE DATA
-- =================================================================

-- Salon closures for holidays and special occasions
INSERT INTO salon_extraordinary_days (date, is_closed, reason, notes) VALUES
('2024-01-01', true, 'Capodanno', 'Salone chiuso per festività'),
('2024-01-06', true, 'Epifania', 'Salone chiuso per festività'),
('2024-04-25', true, 'Festa della Liberazione', 'Salone chiuso per festività nazionale'),
('2024-05-01', true, 'Festa del Lavoro', 'Salone chiuso per festività'),
('2024-06-02', true, 'Festa della Repubblica', 'Salone chiuso per festività nazionale'),
('2024-08-15', true, 'Ferragosto', 'Salone chiuso per ferie estive'),
('2024-11-01', true, 'Ognissanti', 'Salone chiuso per festività'),
('2024-12-25', true, 'Natale', 'Salone chiuso per Natale'),
('2024-12-26', true, 'Santo Stefano', 'Salone chiuso per festività');

-- Special opening hours (salon open with different hours)
INSERT INTO salon_extraordinary_days (date, is_closed, reason, special_open_time, special_close_time, notes) VALUES
('2024-12-24', false, 'Vigilia di Natale', '08:00', '14:00', 'Orario ridotto per Vigilia di Natale'),
('2024-12-31', false, 'San Silvestro', '09:00', '15:00', 'Orario ridotto per Capodanno'),
('2024-05-04', false, 'Evento speciale', '07:00', '21:00', 'Apertura straordinaria per evento di bellezza'),
('2024-03-08', false, 'Festa della Donna', '10:00', '20:00', 'Orario speciale per Festa della Donna');

-- =================================================================
-- SAMPLE APPOINTMENTS WITH NOTES
-- =================================================================

-- Update existing appointments with sample notes (adjust IDs as needed)
UPDATE appointments SET notes = 'Cliente con allergia ai prodotti chimici. Usare solo prodotti naturali.' WHERE id = 1;
UPDATE appointments SET notes = 'Primo appuntamento. Spiegare bene i trattamenti disponibili.' WHERE id = 2;
UPDATE appointments SET notes = 'Cliente VIP. Offrire caffè e riviste di lusso.' WHERE id = 3;
UPDATE appointments SET notes = 'Taglio corto richiesto. Cliente indecisa sul colore.' WHERE id = 4;
UPDATE appointments SET notes = 'Appuntamento di gruppo per matrimonio. Preparare 3 postazioni.' WHERE id = 5;

-- Insert new appointments with notes for testing
INSERT INTO appointments (client_id, stylist_id, service_id, date, start_time, end_time, status, notes) VALUES
(1, 1, 1, '2024-01-20', '09:00', '10:30', 'scheduled', 'Cliente fedele. Preferisce sempre lo stesso stilista.'),
(2, 2, 2, '2024-01-20', '14:30', '15:30', 'scheduled', 'Taglio per evento speciale. Mantenere lunghezza.'),
(3, 1, 3, '2024-01-21', '10:00', '12:00', 'scheduled', 'Colore di ritocco. Utilizzare tinta 7.3 biondo dorato.'),
(1, 3, 1, '2024-01-21', '15:00', '16:00', 'scheduled', 'Solo shampoo e piega. Cliente di fretta.'),
(2, 2, 4, '2024-01-22', '16:00', '18:00', 'scheduled', 'Trattamento completo spa. Preparare maschere nutrienti.');

-- =================================================================
-- RECURRING REMINDERS SAMPLE DATA
-- =================================================================

-- Weekly recurring reminders
INSERT INTO recurring_reminders (client_id, service_id, stylist_id, frequency, day_of_week, preferred_time, is_active, next_reminder_date) VALUES
(1, 1, 1, 'weekly', 1, '09:00', true, '2024-01-22'), -- Every Monday at 9:00
(2, 2, 2, 'weekly', 5, '14:00', true, '2024-01-19'), -- Every Friday at 14:00
(3, 3, 1, 'biweekly', 3, '10:30', true, '2024-01-24'); -- Every two weeks on Wednesday at 10:30

-- Monthly recurring reminders  
INSERT INTO recurring_reminders (client_id, service_id, stylist_id, frequency, day_of_month, preferred_time, is_active, next_reminder_date) VALUES
(1, 4, 3, 'monthly', 15, '16:00', true, '2024-02-15'), -- 15th of every month at 16:00
(2, 1, 1, 'monthly', 5, '11:00', true, '2024-02-05');   -- 5th of every month at 11:00

-- =================================================================
-- COMMENTS AND USAGE INSTRUCTIONS
-- =================================================================

/*
🎉 SISTEMA COMPLETO SALONE - DATI DI ESEMPIO

Dopo aver eseguito questo script avrai:

📅 DOPPI TURNI:
- Stilista 1: Mattina 8-12, Pomeriggio 14-18 (Lun-Ven) + Solo mattina Sabato
- Stilista 2: Solo pomeriggio 14-19 (Mar-Ven)  
- Stilista 3: Schedule misto con pause diverse

🏖️ FERIE STILISTI:
- Varie ferie programmate durante l'anno
- Malattie e permessi
- Date di esempio da gennaio a dicembre 2024

🏢 GIORNI STRAORDINARI SALONE:
- Chiusure per festività nazionali
- Orari ridotti per vigilie
- Aperture speciali per eventi

📝 NOTE APPUNTAMENTI:
- Esempi di note utili per stilisti
- Allergie, preferenze, istruzioni speciali
- Note per eventi e clienti VIP

🔄 PROMEMORIA RICORRENTI:
- Esempi settimanali, bisettimanali e mensili
- Diversi stilisti e servizi
- Sistema automatico di creazione appuntamenti

UTILIZZO:
1. Esegui prima la migration 0004
2. Esegui questo script SQL
3. Testa tutte le funzionalità nel frontend
4. Modifica le date e i dati secondo le tue esigenze

🚀 Il sistema è ora completamente funzionale!
*/ 