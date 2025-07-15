import { storage } from '../../server/storage';
import { format } from 'date-fns';

async function handler(req: any, res: any) {
  try {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = format(tomorrow, 'yyyy-MM-dd');
    
    const appointments = await storage.getAppointmentsByDate(tomorrowStr);
    
    const results = appointments.map(apt => ({
      id: apt.id,
      clientName: `${apt.client?.firstName} ${apt.client?.lastName}`,
      phone: apt.client?.phone,
      time: apt.startTime,
      service: apt.service?.name,
      reminderSent: apt.reminderSent,
      status: apt.status
    }));
    
    return res.status(200).json({ 
      date: tomorrowStr,
      appointments: results,
      totalAppointments: results.length,
      remindersSent: results.filter(a => a.reminderSent).length,
      remindersNeeded: results.filter(a => !a.reminderSent).length
    });
    
  } catch (error) {
    console.error('Error in debug reminder:', error);
    return res.status(500).json({ error: error.message });
  }
}

export default handler;