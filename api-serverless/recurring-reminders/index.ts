import { requireAuth } from '../lib/auth';
import { storage } from '../lib/storage';
import { insertRecurringReminderSchema } from '../../shared/schema';

async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      const { clientId } = req.query;

      if (clientId) {
        // Get recurring reminders for specific client
        const reminders = await storage.getClientRecurringReminders(parseInt(clientId));
        return res.status(200).json(reminders);
      } else {
        // Get all active recurring reminders
        const reminders = await storage.getActiveRecurringReminders();
        return res.status(200).json(reminders);
      }
    }

    if (req.method === 'POST') {
      const validation = insertRecurringReminderSchema.safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid data', 
          errors: validation.error.issues 
        });
      }

      // Validate frequency-specific fields
      const { frequency, dayOfWeek, dayOfMonth } = validation.data;
      
      if ((frequency === 'weekly' || frequency === 'biweekly') && dayOfWeek === undefined) {
        return res.status(400).json({ 
          message: 'Day of week is required for weekly/biweekly reminders' 
        });
      }

      if (frequency === 'monthly' && dayOfMonth === undefined) {
        return res.status(400).json({ 
          message: 'Day of month is required for monthly reminders' 
        });
      }

      const reminder = await storage.createRecurringReminder(validation.data);
      return res.status(201).json(reminder);
    }

    if (req.method === 'PUT') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ message: 'Reminder ID is required' });
      }

      const validation = insertRecurringReminderSchema.partial().safeParse(req.body);
      if (!validation.success) {
        return res.status(400).json({ 
          message: 'Invalid data', 
          errors: validation.error.issues 
        });
      }

      const reminder = await storage.updateRecurringReminder(parseInt(id), validation.data);
      if (!reminder) {
        return res.status(404).json({ message: 'Recurring reminder not found' });
      }

      return res.status(200).json(reminder);
    }

    if (req.method === 'DELETE') {
      const { id } = req.query;
      if (!id) {
        return res.status(400).json({ message: 'Reminder ID is required' });
      }

      // Use the enhanced delete method that cleans up related appointments
      const success = await storage.deleteRecurringReminderCompletely(parseInt(id));
      if (!success) {
        return res.status(404).json({ message: 'Recurring reminder not found' });
      }

      return res.status(200).json({ 
        message: 'Promemoria ricorrente e relativi appuntamenti futuri eliminati con successo' 
      });
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Recurring reminders API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default requireAuth(handler); 