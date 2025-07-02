import { requireAuth } from '../lib/auth';
import { storage } from '../lib/storage';

async function handler(req: any, res: any) {
  try {
    if (req.method !== 'GET') {
      return res.status(405).json({ message: 'Method not allowed' });
    }

    const { stylistId, dayOfWeek, time, date } = req.query;

    if (!stylistId || dayOfWeek === undefined || !time) {
      return res.status(400).json({ 
        message: 'stylistId, dayOfWeek, and time are required' 
      });
    }

    // Check if salon is closed on this date (extraordinary closure)
    if (date) {
      const isSalonClosed = await storage.isSalonClosedOnDate(date);
      if (isSalonClosed) {
        return res.status(200).json({
          isWorking: false,
          isOnBreak: false,
          isOnVacation: false,
          currentShift: 'none',
          status: 'salon_closed',
          message: 'Il salone è chiuso per giornata straordinaria'
        });
      }

      // Check if stylist is on vacation
      const isOnVacation = await storage.isStylistOnVacation(parseInt(stylistId), date);
      if (isOnVacation) {
        return res.status(200).json({
          isWorking: false,
          isOnBreak: false,
          isOnVacation: true,
          currentShift: 'none',
          status: 'on_vacation',
          message: 'Il dipendente è in ferie'
        });
      }
    }

    // Get advanced working status
    const workingStatus = await storage.isStylistWorkingAdvanced(
      parseInt(stylistId), 
      parseInt(dayOfWeek), 
      time
    );

    // Add user-friendly messages
    let message = '';
    switch (workingStatus.status) {
      case 'working':
        message = workingStatus.currentShift === 'morning' 
          ? 'Dipendente disponibile (turno mattina)'
          : workingStatus.currentShift === 'afternoon'
            ? 'Dipendente disponibile (turno pomeriggio)'
            : 'Dipendente disponibile';
        break;
      case 'on_break':
        message = workingStatus.currentShift === 'morning'
          ? 'Dipendente in pausa (turno mattina)'
          : workingStatus.currentShift === 'afternoon'
            ? 'Dipendente in pausa (turno pomeriggio)'
            : 'Dipendente in pausa';
        break;
      case 'not_working':
        message = 'Dipendente non lavora in questo orario';
        break;
      case 'on_vacation':
        message = 'Dipendente in ferie';
        break;
    }

    return res.status(200).json({
      ...workingStatus,
      isOnVacation: workingStatus.status === 'on_vacation',
      message
    });
  } catch (error) {
    console.error('Check stylist working advanced API error:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
}

export default requireAuth(handler); 