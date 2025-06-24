import { requireAuth } from '../lib/auth';
import { storage } from '../lib/storage';

interface OpeningHours {
  openTime: string;
  closeTime: string;
}

async function handler(req: any, res: any) {
  try {
    if (req.method === 'GET') {
      try {
        // Try to get opening hours from storage (file system)
        const openingHours = await storage.getOpeningHours();
        return res.status(200).json(openingHours);
      } catch (error) {
        console.error('Error fetching opening hours:', error);
        // Return default hours if error
        const defaultHours: OpeningHours = {
          openTime: "07:00",
          closeTime: "22:00"
        };
        return res.status(200).json(defaultHours);
      }
    }

    if (req.method === 'POST') {
      const { openTime, closeTime } = req.body;
      
      if (!openTime || !closeTime) {
        return res.status(400).json({ message: "Opening and closing times are required" });
      }
      
      // Validate time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(openTime) || !timeRegex.test(closeTime)) {
        return res.status(400).json({ message: "Invalid time format. Use HH:MM format" });
      }
      
      try {
        // Save to storage
        const success = await storage.saveOpeningHours({ openTime, closeTime });
        
        if (success) {
          return res.status(200).json({ 
            message: "Opening hours saved successfully",
            openTime,
            closeTime
          });
        } else {
          return res.status(500).json({ message: "Failed to save opening hours" });
        }
      } catch (error) {
        console.error('Error saving opening hours:', error);
        return res.status(500).json({ message: "Failed to save opening hours" });
      }
    }

    return res.status(405).json({ message: 'Method not allowed' });
  } catch (error) {
    console.error('Salon settings API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default handler; 