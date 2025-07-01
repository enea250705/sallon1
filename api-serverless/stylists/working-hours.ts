import { requireAuth } from '../lib/auth';
import { storage } from '../lib/storage';
import { insertStylistWorkingHoursSchema } from '../../shared/schema';

async function handler(req: any, res: any) {
  try {
    const { stylistId } = req.query;

    if (req.method === 'GET') {
      if (!stylistId) {
        return res.status(400).json({ message: 'Stylist ID is required' });
      }

      const workingHours = await storage.getStylistWorkingHours(parseInt(stylistId));
      return res.status(200).json(workingHours);
    }

    if (req.method === 'POST') {
      const validation = insertStylistWorkingHoursSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid data', 
          errors: validation.error.issues 
        });
      }

      const workingHours = await storage.createStylistWorkingHours(validation.data);
      return res.status(201).json(workingHours);
    }

    if (req.method === 'PUT') {
      const { id, ...updateData } = req.body;
      if (!id) {
        return res.status(400).json({ message: 'Working hours ID is required' });
      }

      const validation = insertStylistWorkingHoursSchema.partial().safeParse(updateData);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid data', 
          errors: validation.error.issues 
        });
      }

      const workingHours = await storage.updateStylistWorkingHours(id, validation.data);
      if (!workingHours) {
        return res.status(404).json({ message: 'Working hours not found' });
      }

      return res.status(200).json(workingHours);
    }

    if (req.method === 'DELETE') {
      const { id } = req.body;
      if (!id) {
        return res.status(400).json({ message: 'Working hours ID is required' });
      }

      const success = await storage.deleteStylistWorkingHours(id);
      if (!success) {
        return res.status(404).json({ message: 'Working hours not found' });
      }

      return res.status(200).json({ message: 'Working hours deleted successfully' });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Stylist working hours API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default requireAuth(handler); 