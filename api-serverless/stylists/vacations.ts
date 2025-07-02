import { requireAuth } from '../lib/auth';
import { storage } from '../lib/storage';
import { insertStylistVacationSchema } from '../../shared/schema';

async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { stylistId } = req.query;

      if (stylistId) {
        // Get vacations for specific stylist
        const vacations = await storage.getStylistVacations(parseInt(stylistId));
        return res.status(200).json(vacations);
      } else {
        // Get all vacations with stylist details
        const vacations = await storage.getAllStylistVacations();
        return res.status(200).json(vacations);
      }
    }

    if (req.method === 'POST') {
      const validation = insertStylistVacationSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid data', 
          errors: validation.error.issues 
        });
      }

      // Validate date range
      const { startDate, endDate } = validation.data;
      if (new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ 
          message: 'Data di inizio non può essere successiva alla data di fine' 
        });
      }

      const vacation = await storage.createStylistVacation(validation.data);
      return res.status(201).json(vacation);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ message: 'Vacation ID is required' });
      }

      const validation = insertStylistVacationSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid data', 
          errors: validation.error.issues 
        });
      }

      // Validate date range if both dates are provided
      const { startDate, endDate } = validation.data;
      if (startDate && endDate && new Date(startDate) > new Date(endDate)) {
        return res.status(400).json({ 
          message: 'Data di inizio non può essere successiva alla data di fine' 
        });
      }

      const vacation = await storage.updateStylistVacation(parseInt(id), validation.data);
      if (!vacation) {
        return res.status(404).json({ message: 'Vacation not found' });
      }

      return res.status(200).json(vacation);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ message: 'Vacation ID is required' });
      }

      const success = await storage.deleteStylistVacation(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: 'Vacation not found' });
      }

      return res.status(200).json({ message: 'Vacation deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Stylist vacations API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default requireAuth(handler); 