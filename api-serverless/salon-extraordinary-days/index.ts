import { requireAuth } from '../lib/auth';
import { storage } from '../lib/storage';
import { salonExtraordinaryDaySchema } from '../lib/schemas';

async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { startDate, endDate } = req.query;

      if (startDate && endDate) {
        // Get extraordinary days in date range
        const extraordinaryDays = await storage.getSalonExtraordinaryDaysInRange(startDate, endDate);
        return res.status(200).json(extraordinaryDays);
      } else {
        // Get all extraordinary days
        const extraordinaryDays = await storage.getAllSalonExtraordinaryDays();
        return res.status(200).json(extraordinaryDays);
      }
    }

    if (req.method === 'POST') {
      const validation = salonExtraordinaryDaySchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Dati non validi', 
          errors: validation.error.issues 
        });
      }

      // Validate special opening hours if it's a special opening day
      const { isClosed, specialOpenTime, specialCloseTime } = validation.data;
      if (!isClosed && (!specialOpenTime || !specialCloseTime)) {
        return res.status(400).json({ 
          message: 'Orari di apertura speciali sono richiesti per i giorni di apertura straordinaria' 
        });
      }

      try {
        const extraordinaryDay = await storage.createSalonExtraordinaryDay(validation.data);
        return res.status(201).json(extraordinaryDay);
      } catch (error: any) {
        if (error.code === '23505') { // Unique constraint violation
          return res.status(409).json({ 
            message: 'Esiste già una configurazione straordinaria per questa data' 
          });
        }
        throw error;
      }
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ message: 'ID richiesto' });
      }

      const validation = salonExtraordinaryDaySchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Dati non validi', 
          errors: validation.error.issues 
        });
      }

      // Validate special opening hours if it's a special opening day
      const { isClosed, specialOpenTime, specialCloseTime } = validation.data;
      if (isClosed === false && (!specialOpenTime || !specialCloseTime)) {
        return res.status(400).json({ 
          message: 'Orari di apertura speciali sono richiesti per i giorni di apertura straordinaria' 
        });
      }

      const extraordinaryDay = await storage.updateSalonExtraordinaryDay(parseInt(id), validation.data);
      if (!extraordinaryDay) {
        return res.status(404).json({ message: 'Giorno straordinario non trovato' });
      }

      return res.status(200).json(extraordinaryDay);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ message: 'ID richiesto' });
      }

      const success = await storage.deleteSalonExtraordinaryDay(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: 'Giorno straordinario non trovato' });
      }

      return res.status(200).json({ message: 'Giorno straordinario eliminato con successo' });
    }

    return res.status(405).json({ message: 'Metodo non consentito' });
  } catch (error) {
    console.error('Errore API giorni straordinari:', error);
    return res.status(500).json({ message: 'Errore interno del server' });
  }
}

export default requireAuth(handler); 