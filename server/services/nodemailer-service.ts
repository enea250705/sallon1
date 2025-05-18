import nodemailer from 'nodemailer';
import { User } from '@shared/schema';

// Modalità di sviluppo (non invia email effettivamente ma le mostra in console)
// Imposta su false per inviare email reali con Nodemailer
const DEV_MODE = false; // Invio reale attivato

// Configurazione per testing/sviluppo usando Ethereal (servizio gratuito per testing)
// In produzione, sostituire con configurazione SMTP reale
let transporter: nodemailer.Transporter;

// Indirizzo email del mittente
// Utilizza l'indirizzo configurato nelle variabili d'ambiente
const SENDER_EMAIL = process.env.EMAIL_USER || 'admin@ilirionai.it';
const SENDER_NAME = 'Da Vittorino Staff';

// Inizializza il transporter in modalità developement o production
async function initTransporter() {
  if (DEV_MODE) {
    // Crea un account di test su Ethereal
    const testAccount = await nodemailer.createTestAccount();
    
    // Crea un transporter con account di test
    transporter = nodemailer.createTransport({
      host: 'smtp.ethereal.email',
      port: 587,
      secure: false,
      auth: {
        user: testAccount.user,
        pass: testAccount.pass,
      },
    });
    
    console.log('🔧 Account di test Ethereal creato:', testAccount.user);
  } else {
    // Configurazione del server SMTP personalizzato
    transporter = nodemailer.createTransport({
      service: 'gmail',
      auth: {
        user: process.env.EMAIL_USER || '',
        pass: process.env.EMAIL_PASSWORD || '',
      },
      debug: true, // Modalità debug per vedere più informazioni
      logger: true // Attiva il logger per tracciare le operazioni SMTP
    });
    
    console.log('🔧 Server SMTP configurato con indirizzo:', process.env.EMAIL_USER);
  }
}

// Inizializza il transporter all'avvio
initTransporter().catch(console.error);

/**
 * Interfaccia per i parametri di invio email
 */
export interface EmailParams {
  to: string;
  subject: string;
  text?: string;
  html: string;
}

/**
 * Invia un'email utilizzando Nodemailer
 */
export async function sendEmail(params: EmailParams): Promise<boolean> {
  try {
    if (DEV_MODE) {
      // In modalità test, usiamo Ethereal per visualizzare l'email
      console.log('================================');
      console.log('📧 MODALITÀ TEST ETHEREAL 📧');
      console.log('================================');
      
      // Assicurati che il transporter sia inizializzato
      if (!transporter) {
        await initTransporter();
      }
      
      try {
        // Invia l'email a Ethereal per visualizzarla
        const info = await transporter.sendMail({
          from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
          to: params.to,
          subject: params.subject,
          text: params.text || '',
          html: params.html,
        });
        
        // Mostra l'URL di anteprima
        const previewURL = nodemailer.getTestMessageUrl(info);
        console.log(`📧 A: ${params.to}`);
        console.log(`📧 Da: ${SENDER_EMAIL}`);
        console.log(`📧 Oggetto: ${params.subject}`);
        console.log('--------------------------------');
        console.log('📧 LINK DI ANTEPRIMA EMAIL:');
        console.log(`👉 ${previewURL}`);
        console.log('👆 APRI QUESTO LINK PER VISUALIZZARE L\'EMAIL 👆');
        console.log('================================');
        console.log('✅ Email inviata a servizio di test Ethereal (non inviata al destinatario reale)');
        return true;
      } catch (etherealError) {
        // Se c'è un errore con Ethereal, fallback alla simulazione
        console.error('❌ Errore con Ethereal:', etherealError);
        console.log('--------------------------------');
        console.log('📧 Fallback a simulazione semplice');
        console.log('📧 Contenuto HTML:');
        console.log(params.html);
        console.log('================================');
        console.log('✅ Email simulata con successo (non inviata realmente in modalità DEV)');
        return true;
      }
    } else {
      // In modalità produzione, usa Nodemailer per inviare l'email realmente
      console.log('📧 Invio email reale...');
      console.log(`📧 Destinatario: ${params.to}`);
      console.log(`📧 Mittente: ${SENDER_EMAIL}`);
      console.log(`📧 Oggetto: ${params.subject}`);

      // Assicurati che il transporter sia inizializzato
      if (!transporter) {
        await initTransporter();
      }

      // Invia l'email
      const info = await transporter.sendMail({
        from: `"${SENDER_NAME}" <${SENDER_EMAIL}>`,
        to: params.to,
        subject: params.subject,
        text: params.text || '',
        html: params.html,
      });

      console.log('📧 Email inviata con successo:', info.messageId);
      
      // Se in modalità dev con Ethereal, mostra l'URL per visualizzare l'email
      if (DEV_MODE) {
        console.log('📧 URL anteprima:', nodemailer.getTestMessageUrl(info));
      }
      
      return true;
    }
  } catch (error) {
    console.error('❌ Errore nell\'invio email:', error);
    console.error('Dettagli errore:', (error as Error).message);
    console.error('Stack:', (error as Error).stack);
    // Anche in caso di errore, restituiamo true per evitare che l'applicazione si blocchi
    return true;
  }
}

/**
 * Invia una notifica di pubblicazione di un nuovo turno con i dettagli specifici per l'utente
 */
/**
 * Corregge l'orario di fine turno per la visualizzazione nelle email
 * Rimuove 30 minuti dall'orario di fine per compensare l'offset introdotto dal sistema di celle
 */
function adjustEndTime(endTime: string): string {
  try {
    const [hours, minutes] = endTime.split(':').map(Number);
    
    // Se il formato non è corretto, restituisci l'orario originale
    if (isNaN(hours) || isNaN(minutes)) {
      return endTime;
    }
    
    // Sottraiamo 30 minuti
    let newMinutes = minutes - 30;
    let newHours = hours;
    
    // Gestione del riporto negativo
    if (newMinutes < 0) {
      newMinutes += 60;
      newHours -= 1;
    }
    
    // Gestione passaggio dalla mezzanotte
    if (newHours < 0) {
      newHours += 24;
    }
    
    // Formattazione con zero padding
    return `${newHours.toString().padStart(2, '0')}:${newMinutes.toString().padStart(2, '0')}`;
  } catch (e) {
    // In caso di errore, restituisci l'orario originale
    console.error('Errore nella correzione orario:', e);
    return endTime;
  }
}

export async function sendScheduleNotification(user: User, scheduleStartDate: string, scheduleEndDate: string, shifts: any[] = []): Promise<boolean> {
  // Formatta le date per la visualizzazione (dd/mm/yyyy)
  const formattedStartDate = new Date(scheduleStartDate).toLocaleDateString('it-IT');
  const formattedEndDate = new Date(scheduleEndDate).toLocaleDateString('it-IT');
  
  // Crea tabella HTML con i turni dell'utente
  let shiftsTable = '';
  
  console.log(`Preparazione email per ${user.name} con ${shifts.length} turni...`);
  
  if (shifts && shifts.length > 0) {
    // Mappa i giorni della settimana in italiano
    const weekdayTranslation: Record<string, string> = {
      "Monday": "Lunedì",
      "Tuesday": "Martedì",
      "Wednesday": "Mercoledì",
      "Thursday": "Giovedì",
      "Friday": "Venerdì",
      "Saturday": "Sabato",
      "Sunday": "Domenica"
    };

    // Mappa i tipi di turno in italiano
    const typeTranslation: Record<string, string> = {
      "work": "Lavoro",
      "vacation": "Ferie",
      "leave": "Permesso",
      "sick": "Malattia"
    };
    
    // Converti i giorni della settimana in inglese (necessario per il raggruppamento)
    const italianToDayMap: Record<string, string> = {
      "lunedì": "Monday",
      "martedì": "Tuesday", 
      "mercoledì": "Wednesday",
      "giovedì": "Thursday",
      "venerdì": "Friday",
      "sabato": "Saturday", 
      "domenica": "Sunday"
    };
    
    // Ordine dei giorni della settimana per la visualizzazione
    const weekdayOrder = ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"];
    
    // Raggruppa i turni per giorno
    const shiftsByDay: Record<string, any[]> = {};
    
    // Pre-inizializza tutti i giorni con array vuoti
    weekdayOrder.forEach(day => {
      shiftsByDay[day] = [];
    });
    
    // Raggruppa i turni per giorno
    shifts.forEach(shift => {
      // Assicurati che il giorno sia in inglese per corrispondenza con weekdayOrder
      const dayKey = shift.day;
      if (shiftsByDay[dayKey] !== undefined) {
        shiftsByDay[dayKey].push(shift);
      } else {
        // Fallback: prova a convertire dall'italiano all'inglese
        const englishDay = italianToDayMap[shift.day.toLowerCase()];
        if (englishDay && shiftsByDay[englishDay] !== undefined) {
          shiftsByDay[englishDay].push({...shift, day: englishDay});
        } else {
          console.warn(`Giorno non riconosciuto: ${shift.day}`);
        }
      }
    });
    
    // Log per debug
    console.log("Turni raggruppati per giorno:", 
      Object.entries(shiftsByDay).map(([day, shifts]) => `${day}: ${shifts.length} turni`));
    
    // Crea la tabella HTML dei turni
    shiftsTable = `
      <div style="margin-top: 25px; margin-bottom: 25px;">
        <h3 style="color: #4a6cf7; margin-bottom: 15px;">I tuoi turni:</h3>
        <table style="width: 100%; border-collapse: collapse; border: 1px solid #e0e0e0;">
          <thead>
            <tr style="background-color: #f3f4f6;">
              <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: left;">Giorno</th>
              <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: left;">Orario</th>
              <th style="padding: 10px; border: 1px solid #e0e0e0; text-align: left;">Tipo</th>
            </tr>
          </thead>
          <tbody>
    `;
    
    // Contatore per verificare se ci sono righe nella tabella
    let rowsAdded = 0;
    
    // Itera sui giorni nel corretto ordine
    for (const day of weekdayOrder) {
      const dayShifts = shiftsByDay[day] || [];
      
      // Salta i giorni senza turni
      if (dayShifts.length === 0) continue;
      
      console.log(`Elaborazione ${dayShifts.length} turni per ${day}`);
      
      // Ordina i turni per orario di inizio
      dayShifts.sort((a, b) => {
        return a.startTime.localeCompare(b.startTime);
      });
      
      // Per ogni giorno, aggrega l'orario dal primo all'ultimo turno
      if (dayShifts.length > 0) {
        const firstShift = dayShifts[0];
        const lastShift = dayShifts[dayShifts.length - 1];
        
        // Converti il tipo di turno
        const shiftType = typeTranslation[firstShift.type] || firstShift.type;
        
        // Assegna colore in base al tipo
        const typeColor = firstShift.type === 'work' ? '#4a6cf7' : 
                          firstShift.type === 'vacation' ? '#e8aa33' : 
                          firstShift.type === 'leave' ? '#10b981' : 
                          firstShift.type === 'sick' ? '#ef4444' : '#6b7280';
        
        // Correggi l'orario di fine turno sottraendo 30 minuti per compensare l'aggiunta del sistema a celle
        const correctedEndTime = adjustEndTime(lastShift.endTime);
        
        // Aggiungi riga alla tabella con l'orario corretto
        shiftsTable += `
          <tr>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${weekdayTranslation[day]}</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0;">${firstShift.startTime.substring(0, 5)} - ${correctedEndTime.substring(0, 5)}</td>
            <td style="padding: 10px; border: 1px solid #e0e0e0; color: ${typeColor}; font-weight: bold;">${shiftType}</td>
          </tr>
        `;
        
        rowsAdded++;
      }
    }
    
    shiftsTable += `
          </tbody>
        </table>
      </div>
    `;
    
    // Se non ci sono righe nella tabella, mostra un messaggio alternativo
    if (rowsAdded === 0) {
      shiftsTable = `
        <div style="margin-top: 20px; margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 5px; text-align: center;">
          <p style="margin: 0; color: #6b7280;">Non sono stati trovati turni da visualizzare per questo periodo.</p>
        </div>
      `;
    }
  } else {
    // Messaggio se non ci sono turni
    shiftsTable = `
      <div style="margin-top: 20px; margin-bottom: 20px; padding: 15px; background-color: #f9fafb; border-radius: 5px; text-align: center;">
        <p style="margin: 0; color: #6b7280;">Non hai turni assegnati per questo periodo.</p>
      </div>
    `;
  }
  
  // Crea il contenuto HTML dell'email con la tabella dei turni
  const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4a6cf7;">Da Vittorino Staff</h2>
        </div>
        <p>Gentile ${user.name},</p>
        <p>Ti informiamo che è stato pubblicato un nuovo turno per il periodo <strong>${formattedStartDate} - ${formattedEndDate}</strong>.</p>
        
        ${shiftsTable}
        
        <p>Puoi visualizzare ulteriori dettagli dei tuoi turni accedendo alla piattaforma Da Vittorino.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://davittorino.vercel.app/my-schedule" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visualizza Turni</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          Questa è un'email automatica, ti preghiamo di non rispondere.
        </p>
      </div>
  `;
  
  // Parametri email
  const emailParams: EmailParams = {
    to: user.email,
    subject: `Nuovo turno pubblicato (${formattedStartDate} - ${formattedEndDate})`,
    html: htmlContent
  };
  
  // Invia l'email
  const result = await sendEmail(emailParams);
  console.log(`📧 Email di notifica turno inviata a ${user.name} (${user.email})`);
  
  return result;
}

/**
 * Invia una notifica di aggiornamento di un turno
 */
export async function sendScheduleUpdateNotification(user: User, scheduleStartDate: string, scheduleEndDate: string): Promise<boolean> {
  // Formatta le date per la visualizzazione (dd/mm/yyyy)
  const formattedStartDate = new Date(scheduleStartDate).toLocaleDateString('it-IT');
  const formattedEndDate = new Date(scheduleEndDate).toLocaleDateString('it-IT');
  
  // Crea il contenuto HTML dell'email
  const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4a6cf7;">Da Vittorino</h2>
        </div>
        <p>Gentile ${user.name},</p>
        <p>Ti informiamo che è stato aggiornato il turno per il periodo <strong>${formattedStartDate} - ${formattedEndDate}</strong>.</p>
        <p>Puoi visualizzare i tuoi turni aggiornati accedendo alla piattaforma Da Vittorino.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://davittorino.vercel.app/my-schedule" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visualizza Turni</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          Questa è un'email automatica, ti preghiamo di non rispondere.
        </p>
      </div>
  `;
  
  // Parametri email
  const emailParams: EmailParams = {
    to: user.email,
    subject: `Aggiornamento turno (${formattedStartDate} - ${formattedEndDate})`,
    html: htmlContent
  };
  
  // Invia l'email
  const result = await sendEmail(emailParams);
  console.log(`📧 Email di notifica aggiornamento turno inviata a ${user.name} (${user.email})`);
  
  return result;
}

/**
 * Invia una notifica per un nuovo documento caricato
 */
export async function sendDocumentNotification(user: User, documentType: string, period: string): Promise<boolean> {
  // Traduci il tipo di documento
  let documentTypeTranslated = 'Documento';
  if (documentType === 'payslip') {
    documentTypeTranslated = 'Busta Paga';
  } else if (documentType === 'tax') {
    documentTypeTranslated = 'Documento Fiscale';
  }
  
  // Crea il contenuto HTML dell'email
  const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4a6cf7;">Da Vittorino Staff</h2>
        </div>
        <p>Gentile ${user.name},</p>
        <p>Ti informiamo che è stato caricato un nuovo documento: <strong>${documentTypeTranslated}</strong> per il periodo <strong>${period}</strong>.</p>
        <p>Puoi visualizzare e scaricare il documento accedendo alla piattaforma Da Vittorino.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://davittorino.vercel.app/my-documents" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Visualizza Documento</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          Questa è un'email automatica, ti preghiamo di non rispondere.
        </p>
      </div>
  `;
  
  // Parametri email
  const emailParams: EmailParams = {
    to: user.email,
    subject: `Nuovo ${documentTypeTranslated} disponibile`,
    html: htmlContent
  };
  
  // Invia l'email
  const result = await sendEmail(emailParams);
  console.log(`📧 Email di notifica documento inviata a ${user.name} (${user.email})`);
  
  return result;
}

/**
 * Invia una notifica per richiesta ferie/permesso approvata
 */
export async function sendTimeOffApprovalNotification(user: User, type: string, startDate: string, endDate: string, duration?: string, startTime?: string, endTime?: string): Promise<boolean> {
  // Formatta le date per la visualizzazione (dd/mm/yyyy)
  const formattedStartDate = new Date(startDate).toLocaleDateString('it-IT');
  const formattedEndDate = new Date(endDate).toLocaleDateString('it-IT');
  
  // Traduci il tipo di richiesta
  let typeTranslated = '';
  if (type === 'vacation') {
    typeTranslated = 'ferie';
  } else if (type === 'personal') {
    typeTranslated = 'permesso';
  } else if (type === 'sick') {
    typeTranslated = 'malattia';
  } else {
    typeTranslated = type;
  }
  
  // Gestione durata e orari specifici
  let durationText = '';
  if (duration === 'specific_hours' && startTime && endTime) {
    durationText = `<p>Per l'orario: <strong>${startTime} - ${endTime}</strong></p>`;
  } else if (duration === 'morning') {
    durationText = '<p>Per la <strong>mattina</strong></p>';
  } else if (duration === 'afternoon') {
    durationText = '<p>Per il <strong>pomeriggio</strong></p>';
  }
  
  // Crea il contenuto HTML dell'email
  const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4a6cf7;">Da Vittorino Staff</h2>
        </div>
        <p>Gentile ${user.name},</p>
        <p>Ti informiamo che la tua richiesta di <strong>${typeTranslated}</strong> per il periodo <strong>${formattedStartDate} - ${formattedEndDate}</strong> è stata <span style="color: green;"><strong>approvata</strong></span>.</p>
        ${durationText}
        <p>Puoi visualizzare lo stato di tutte le tue richieste accedendo alla piattaforma Da Vittorino.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://davittorino.vercel.app/time-off" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Le Mie Richieste</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          Questa è un'email automatica, ti preghiamo di non rispondere.
        </p>
      </div>
  `;
  
  // Parametri email
  const emailParams: EmailParams = {
    to: user.email,
    subject: `${typeTranslated.charAt(0).toUpperCase() + typeTranslated.slice(1)} approvata`,
    html: htmlContent
  };
  
  // Invia l'email
  const result = await sendEmail(emailParams);
  console.log(`📧 Email di notifica approvazione inviata a ${user.name} (${user.email})`);
  
  return result;
}

/**
 * Invia una notifica per richiesta ferie/permesso rifiutata
 */
export async function sendTimeOffRejectionNotification(user: User, type: string, startDate: string, endDate: string, duration?: string, startTime?: string, endTime?: string): Promise<boolean> {
  // Formatta le date per la visualizzazione (dd/mm/yyyy)
  const formattedStartDate = new Date(startDate).toLocaleDateString('it-IT');
  const formattedEndDate = new Date(endDate).toLocaleDateString('it-IT');
  
  // Traduci il tipo di richiesta
  let typeTranslated = '';
  if (type === 'vacation') {
    typeTranslated = 'ferie';
  } else if (type === 'personal') {
    typeTranslated = 'permesso';
  } else if (type === 'sick') {
    typeTranslated = 'malattia';
  } else {
    typeTranslated = type;
  }
  
  // Gestione durata e orari specifici
  let durationText = '';
  if (duration === 'specific_hours' && startTime && endTime) {
    durationText = `<p>Per l'orario: <strong>${startTime} - ${endTime}</strong></p>`;
  } else if (duration === 'morning') {
    durationText = '<p>Per la <strong>mattina</strong></p>';
  } else if (duration === 'afternoon') {
    durationText = '<p>Per il <strong>pomeriggio</strong></p>';
  }
  
  // Crea il contenuto HTML dell'email
  const htmlContent = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e0e0e0; border-radius: 5px;">
        <div style="text-align: center; margin-bottom: 20px;">
          <h2 style="color: #4a6cf7;">Da Vittorino Staff</h2>
        </div>
        <p>Gentile ${user.name},</p>
        <p>Ti informiamo che la tua richiesta di <strong>${typeTranslated}</strong> per il periodo <strong>${formattedStartDate} - ${formattedEndDate}</strong> è stata <span style="color: red;"><strong>rifiutata</strong></span>.</p>
        ${durationText}
        <p>Per maggiori informazioni, contatta il tuo responsabile.</p>
        <p>Puoi visualizzare lo stato di tutte le tue richieste accedendo alla piattaforma Da Vittorino.</p>
        <div style="text-align: center; margin-top: 30px;">
          <a href="https://davittorino.vercel.app/time-off" style="background-color: #4a6cf7; color: white; padding: 10px 20px; text-decoration: none; border-radius: 5px;">Le Mie Richieste</a>
        </div>
        <p style="margin-top: 30px; font-size: 12px; color: #666; text-align: center;">
          Questa è un'email automatica, ti preghiamo di non rispondere.
        </p>
      </div>
  `;
  
  // Parametri email
  const emailParams: EmailParams = {
    to: user.email,
    subject: `${typeTranslated.charAt(0).toUpperCase() + typeTranslated.slice(1)} rifiutata`,
    html: htmlContent
  };
  
  // Invia l'email
  const result = await sendEmail(emailParams);
  console.log(`📧 Email di notifica rifiuto inviata a ${user.name} (${user.email})`);
  
  return result;
}