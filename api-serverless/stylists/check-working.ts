import { requireAuth } from '../lib/auth';
import { storage } from '../lib/storage';

async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { stylistId, dayOfWeek, time } = req.query;

    if (!stylistId || dayOfWeek === undefined || !time) {
      return res.status(400).json({ 
        message: 'stylistId, dayOfWeek, and time are required' 
      });
    }

    const isWorking = await storage.isStylistWorking(
      parseInt(stylistId), 
      parseInt(dayOfWeek), 
      time
    );

    return res.status(200).json({ isWorking });
  } catch (error) {
    console.error('Check stylist working API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default requireAuth(handler); 