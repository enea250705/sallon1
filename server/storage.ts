import {
  users,
  clients,
  services,
  stylists,
  appointments,
  messageTemplates,
  recurringReminders,
  type User,
  type InsertUser,
  type Client,
  type InsertClient,
  type Service,
  type InsertService,
  type Stylist,
  type InsertStylist,
  type Appointment,
  type InsertAppointment,
  type AppointmentWithDetails,
  type MessageTemplate,
  type InsertMessageTemplate,
  type RecurringReminder,
  type InsertRecurringReminder,
  type RecurringReminderWithDetails,
  type StylistSchedule,
  type InsertStylistSchedule,
  type StylistWeeklyTemplate,
  type InsertStylistWeeklyTemplate,
  stylistSchedules,
  stylistWeeklyTemplate,
  sessions,
} from "@shared/schema";
import { eq, and, gte, lte, desc, asc, like, or } from "drizzle-orm";
import { db } from "./db";
import session from "express-session";
import connectPg from "connect-pg-simple";
import { pool } from "./db";

// Interface for storage operations
export interface IStorage {
  // User management
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createUser(user: InsertUser): Promise<User>;
  updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined>;
  getAllUsers(): Promise<User[]>;
  deleteUser(id: number): Promise<boolean>;
  
  // Client management
  createClient(client: InsertClient): Promise<Client>;
  getClient(id: number): Promise<Client | undefined>;
  getAllClients(): Promise<Client[]>;
  searchClients(query: string): Promise<Client[]>;
  updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined>;
  deleteClient(id: number): Promise<boolean>;
  
  // Service management
  createService(service: InsertService): Promise<Service>;
  getService(id: number): Promise<Service | undefined>;
  getAllServices(): Promise<Service[]>;
  updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined>;
  deleteService(id: number): Promise<boolean>;
  
  // Stylist management
  createStylist(stylist: InsertStylist): Promise<Stylist>;
  getStylist(id: number): Promise<Stylist | undefined>;
  getAllStylists(): Promise<Stylist[]>;
  updateStylist(id: number, stylistData: Partial<InsertStylist>): Promise<Stylist | undefined>;
  deleteStylist(id: number): Promise<boolean>;
  
  // Stylist schedule management
  createStylistSchedule(schedule: InsertStylistSchedule): Promise<StylistSchedule>;
  getStylistSchedule(stylistId: number, date: string): Promise<StylistSchedule | undefined>;
  getStylistScheduleByDateRange(stylistId: number, startDate: string, endDate: string): Promise<StylistSchedule[]>;
  updateStylistSchedule(stylistId: number, date: string, scheduleData: Partial<InsertStylistSchedule>): Promise<StylistSchedule | undefined>;
  deleteStylistSchedule(stylistId: number, date: string): Promise<boolean>;
  
  // Stylist weekly template management
  createStylistWeeklyTemplate(template: InsertStylistWeeklyTemplate): Promise<StylistWeeklyTemplate>;
  getStylistWeeklyTemplate(stylistId: number): Promise<StylistWeeklyTemplate[]>;
  updateStylistWeeklyTemplate(stylistId: number, dayOfWeek: number, templateData: Partial<InsertStylistWeeklyTemplate>): Promise<StylistWeeklyTemplate | undefined>;
  deleteStylistWeeklyTemplate(stylistId: number, dayOfWeek: number): Promise<boolean>;
  
  // Check stylist availability
  isStylistAvailable(stylistId: number, date: string, startTime: string, endTime: string): Promise<boolean>;
  getStylistAvailableSlots(stylistId: number, date: string): Promise<string[]>;
  
  // Appointment management
  createAppointment(appointment: InsertAppointment): Promise<Appointment>;
  getAppointment(id: number): Promise<Appointment | undefined>;
  getAppointmentWithDetails(id: number): Promise<AppointmentWithDetails | undefined>;
  getAllAppointments(): Promise<AppointmentWithDetails[]>;
  getAppointmentsByDate(date: string): Promise<AppointmentWithDetails[]>;
  getAppointmentsByDateRange(startDate: string, endDate: string): Promise<AppointmentWithDetails[]>;
  getClientAppointments(clientId: number): Promise<AppointmentWithDetails[]>;
  getStylistAppointments(stylistId: number, date?: string): Promise<AppointmentWithDetails[]>;
  updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined>;
  deleteAppointment(id: number): Promise<boolean>;
  getUpcomingAppointments(): Promise<AppointmentWithDetails[]>;
  markReminderSent(id: number): Promise<boolean>;
  
  // Message templates
  createMessageTemplate(template: InsertMessageTemplate): Promise<MessageTemplate>;
  getMessageTemplate(id: number): Promise<MessageTemplate | undefined>;
  getAllMessageTemplates(): Promise<MessageTemplate[]>;
  updateMessageTemplate(id: number, templateData: Partial<InsertMessageTemplate>): Promise<MessageTemplate | undefined>;
  deleteMessageTemplate(id: number): Promise<boolean>;
  
  // Recurring reminders
  createRecurringReminder(reminder: InsertRecurringReminder): Promise<RecurringReminder>;
  createAppointmentFromReminder(reminderId: number, appointmentDate: string): Promise<void>;
  getRecurringReminder(id: number): Promise<RecurringReminderWithDetails | undefined>;
  getAllRecurringReminders(): Promise<RecurringReminderWithDetails[]>;
  getClientRecurringReminders(clientId: number): Promise<RecurringReminderWithDetails[]>;
  updateRecurringReminder(id: number, reminderData: Partial<InsertRecurringReminder>): Promise<RecurringReminder | undefined>;
  deleteRecurringReminder(id: number): Promise<boolean>;
  getActiveRecurringReminders(): Promise<RecurringReminderWithDetails[]>;
  updateNextReminderDate(id: number, nextDate: string): Promise<boolean>;
  
  // Suggested appointments from recurring reminders
  getSuggestedAppointmentsByDate(date: string): Promise<any[]>;
  getSuggestedAppointmentsByDateRange(startDate: string, endDate: string): Promise<any[]>;
  confirmSuggestedAppointment(suggestedId: number, appointmentData: any): Promise<any>;
  
  // Session store
  sessionStore: any;
  
  // Migration
  migrateRecurringReminders(): Promise<{message: string, created: boolean}>;
  
  // Opening hours management
  getOpeningHours(): Promise<any>;
  getOpeningHoursForDay(day: string): Promise<{ openTime: string; closeTime: string; isOpen: boolean }>;
  saveOpeningHours(hours: any): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  sessionStore: any;

  constructor() {
    const pgStore = connectPg(session);
    this.sessionStore = new pgStore({
      pool: pool,
      createTableIfMissing: true,
      tableName: 'sessions',
    });
    this.initializeDefaultData();
  }

  private async initializeDefaultData() {
    // Create default admin user
    try {
      const existingAdmin = await this.getUserByUsername("admin");
      if (!existingAdmin) {
        await this.createUser({
          username: "admin",
          password: "$2b$10$rIzZfYYm5rVXgSYm8zLN0.L5JJ3xBhNl9r.QWcqw8YZpL8MhUZkGy", // password: admin123
          firstName: "Amministratore",
          lastName: "Sistema",
          email: "admin@parrucchiera.it",
          role: "admin",
        });
      }

      // Create default stylists
      const existingStylists = await this.getAllStylists();
      if (existingStylists.length === 0) {
        await this.createStylist({
          name: "Marco",
          phone: "+39 123 456 7890",
          email: "marco@parrucchiera.it",
        });
        
        await this.createStylist({
          name: "Giulia",
          phone: "+39 123 456 7891",
          email: "giulia@parrucchiera.it",
        });
      }

      // Create default services
      const existingServices = await this.getAllServices();
      if (existingServices.length === 0) {
        await this.createService({
          name: "Taglio",
          duration: 30,
          price: 2500, // €25.00
          description: "Taglio di capelli classico",
        });
        
        await this.createService({
          name: "Piega",
          duration: 45,
          price: 2000, // €20.00
          description: "Piega e styling",
        });
        
        await this.createService({
          name: "Colore",
          duration: 90,
          price: 5000, // €50.00
          description: "Colorazione capelli",
        });
        
        await this.createService({
          name: "Taglio + Piega",
          duration: 60,
          price: 4000, // €40.00
          description: "Taglio e piega completa",
        });
      }

      // Create default message template
      const existingTemplates = await this.getAllMessageTemplates();
      if (existingTemplates.length === 0) {
        await this.createMessageTemplate({
          name: "Promemoria Appuntamento",
          template: "Ciao [NOME], ti ricordiamo il tuo appuntamento di domani alle [ORA] per [SERVIZIO]. A presto! 💇‍♀️",
        });
      }
    } catch (error) {
      console.error("Error initializing default data:", error);
    }
  }

  // User management
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.username, username));
    return user;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db.insert(users).values(insertUser).returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user;
  }

  async getAllUsers(): Promise<User[]> {
    return await db.select().from(users).orderBy(asc(users.firstName));
  }

  async deleteUser(id: number): Promise<boolean> {
    try {
      const result = await db.delete(users).where(eq(users.id, id));
      return result.rowCount ? result.rowCount > 0 : false;
    } catch (error) {
      console.error("Error deleting user:", error);
      return false;
    }
  }

  // Client management
  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db.insert(clients).values({
      ...clientData,
      updatedAt: new Date(),
    }).returning();
    return client;
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db.select().from(clients).where(eq(clients.id, id));
    return client;
  }

  async getAllClients(): Promise<Client[]> {
    return await db.select().from(clients)
      .where(eq(clients.isActive, true))
      .orderBy(asc(clients.lastName), asc(clients.firstName));
  }

  async searchClients(query: string): Promise<Client[]> {
    const searchTerm = `%${query}%`;
    return await db.select().from(clients)
      .where(
        and(
          eq(clients.isActive, true),
          or(
            like(clients.firstName, searchTerm),
            like(clients.lastName, searchTerm),
            like(clients.phone, searchTerm),
            like(clients.email, searchTerm)
          )
        )
      )
      .orderBy(asc(clients.lastName), asc(clients.firstName));
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db
      .update(clients)
      .set({
        ...clientData,
        updatedAt: new Date(),
      })
      .where(eq(clients.id, id))
      .returning();
    return client;
  }

  async deleteClient(id: number): Promise<boolean> {
    const [client] = await db
      .update(clients)
      .set({ isActive: false })
      .where(eq(clients.id, id))
      .returning();
    return !!client;
  }

  // Service management
  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db.insert(services).values(serviceData).returning();
    return service;
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db.select().from(services).where(eq(services.id, id));
    return service;
  }

  async getAllServices(): Promise<Service[]> {
    return await db.select().from(services)
      .where(eq(services.isActive, true))
      .orderBy(asc(services.name));
  }

  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db
      .update(services)
      .set(serviceData)
      .where(eq(services.id, id))
      .returning();
    return service;
  }

  async deleteService(id: number): Promise<boolean> {
    const [service] = await db
      .update(services)
      .set({ isActive: false })
      .where(eq(services.id, id))
      .returning();
    return !!service;
  }

  // Stylist management
  async createStylist(stylistData: InsertStylist): Promise<Stylist> {
    const [stylist] = await db.insert(stylists).values(stylistData).returning();
    return stylist;
  }

  async getStylist(id: number): Promise<Stylist | undefined> {
    const [stylist] = await db.select().from(stylists).where(eq(stylists.id, id));
    return stylist;
  }

  async getAllStylists(): Promise<Stylist[]> {
    return await db.select().from(stylists)
      .where(eq(stylists.isActive, true))
      .orderBy(asc(stylists.name));
  }

  async updateStylist(id: number, stylistData: Partial<InsertStylist>): Promise<Stylist | undefined> {
    const [stylist] = await db
      .update(stylists)
      .set(stylistData)
      .where(eq(stylists.id, id))
      .returning();
    return stylist;
  }

  async deleteStylist(id: number): Promise<boolean> {
    const [stylist] = await db
      .update(stylists)
      .set({ isActive: false })
      .where(eq(stylists.id, id))
      .returning();
    return !!stylist;
  }

  // Stylist schedule management
  async createStylistSchedule(scheduleData: InsertStylistSchedule): Promise<StylistSchedule> {
    const [schedule] = await db.insert(stylistSchedules).values({
      ...scheduleData,
      updatedAt: new Date(),
    }).returning();
    return schedule;
  }

  async getStylistSchedule(stylistId: number, date: string): Promise<StylistSchedule | undefined> {
    const [schedule] = await db.select().from(stylistSchedules)
      .where(and(eq(stylistSchedules.stylistId, stylistId), eq(stylistSchedules.date, date)));
    return schedule;
  }

  async getStylistScheduleByDateRange(stylistId: number, startDate: string, endDate: string): Promise<StylistSchedule[]> {
    return await db.select().from(stylistSchedules)
      .where(and(
        eq(stylistSchedules.stylistId, stylistId),
        gte(stylistSchedules.date, startDate),
        lte(stylistSchedules.date, endDate)
      ))
      .orderBy(stylistSchedules.date);
  }

  async updateStylistSchedule(stylistId: number, date: string, scheduleData: Partial<InsertStylistSchedule>): Promise<StylistSchedule | undefined> {
    const [schedule] = await db
      .update(stylistSchedules)
      .set({
        ...scheduleData,
        updatedAt: new Date(),
      })
      .where(and(eq(stylistSchedules.stylistId, stylistId), eq(stylistSchedules.date, date)))
      .returning();
    return schedule;
  }

  async deleteStylistSchedule(stylistId: number, date: string): Promise<boolean> {
    const result = await db.delete(stylistSchedules)
      .where(and(eq(stylistSchedules.stylistId, stylistId), eq(stylistSchedules.date, date)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Stylist weekly template management
  async createStylistWeeklyTemplate(templateData: InsertStylistWeeklyTemplate): Promise<StylistWeeklyTemplate> {
    const [template] = await db.insert(stylistWeeklyTemplate).values({
      ...templateData,
      updatedAt: new Date(),
    }).returning();
    return template;
  }

  async getStylistWeeklyTemplate(stylistId: number): Promise<StylistWeeklyTemplate[]> {
    return await db.select().from(stylistWeeklyTemplate)
      .where(eq(stylistWeeklyTemplate.stylistId, stylistId))
      .orderBy(stylistWeeklyTemplate.dayOfWeek);
  }

  async updateStylistWeeklyTemplate(stylistId: number, dayOfWeek: number, templateData: Partial<InsertStylistWeeklyTemplate>): Promise<StylistWeeklyTemplate | undefined> {
    const [template] = await db
      .update(stylistWeeklyTemplate)
      .set({
        ...templateData,
        updatedAt: new Date(),
      })
      .where(and(eq(stylistWeeklyTemplate.stylistId, stylistId), eq(stylistWeeklyTemplate.dayOfWeek, dayOfWeek)))
      .returning();
    return template;
  }

  async deleteStylistWeeklyTemplate(stylistId: number, dayOfWeek: number): Promise<boolean> {
    const result = await db.delete(stylistWeeklyTemplate)
      .where(and(eq(stylistWeeklyTemplate.stylistId, stylistId), eq(stylistWeeklyTemplate.dayOfWeek, dayOfWeek)));
    return result.rowCount ? result.rowCount > 0 : false;
  }

  // Check stylist availability and generate schedule
  async isStylistAvailable(stylistId: number, date: string, startTime: string, endTime: string): Promise<boolean> {
    // First check if there's a specific schedule for this date
    let schedule = await this.getStylistSchedule(stylistId, date);
    
    // If no specific schedule, check weekly template
    if (!schedule) {
      const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
      const template = await this.getStylistWeeklyTemplate(stylistId);
      const dayTemplate = template.find(t => t.dayOfWeek === dayOfWeek);
      
      if (!dayTemplate || !dayTemplate.isWorking) {
        return false;
      }
      
      // Create temporary schedule from template
      schedule = {
        id: 0,
        stylistId,
        date,
        startTime: dayTemplate.startTime,
        endTime: dayTemplate.endTime,
        isWorking: dayTemplate.isWorking,
        breaks: dayTemplate.breaks,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    if (!schedule.isWorking || !schedule.startTime || !schedule.endTime) {
      return false;
    }
    
    // Check if requested time is within working hours
    if (startTime < schedule.startTime || endTime > schedule.endTime) {
      return false;
    }
    
    // Check if time conflicts with breaks
    if (schedule.breaks) {
      const breaks = Array.isArray(schedule.breaks) ? schedule.breaks : JSON.parse(schedule.breaks as string);
      for (const breakPeriod of breaks) {
        if (this.timeRangesOverlap(startTime, endTime, breakPeriod.startTime, breakPeriod.endTime)) {
          return false;
        }
      }
    }
    
    return true;
  }

  async getStylistAvailableSlots(stylistId: number, date: string): Promise<string[]> {
    // First check if there's a specific schedule for this date
    let schedule = await this.getStylistSchedule(stylistId, date);
    
    // If no specific schedule, check weekly template
    if (!schedule) {
      const dayOfWeek = new Date(date).getDay(); // 0 = Sunday, 1 = Monday, etc.
      const template = await this.getStylistWeeklyTemplate(stylistId);
      const dayTemplate = template.find(t => t.dayOfWeek === dayOfWeek);
      
      if (!dayTemplate || !dayTemplate.isWorking) {
        return [];
      }
      
      // Create temporary schedule from template
      schedule = {
        id: 0,
        stylistId,
        date,
        startTime: dayTemplate.startTime,
        endTime: dayTemplate.endTime,
        isWorking: dayTemplate.isWorking,
        breaks: dayTemplate.breaks,
        notes: null,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
    }
    
    if (!schedule.isWorking || !schedule.startTime || !schedule.endTime) {
      return [];
    }
    
    // Generate all 15-minute slots between start and end time
    const slots: string[] = [];
    const [startHour, startMinute] = schedule.startTime.split(':').map(Number);
    const [endHour, endMinute] = schedule.endTime.split(':').map(Number);
    
    const startTimeMinutes = startHour * 60 + startMinute;
    const endTimeMinutes = endHour * 60 + endMinute;
    
    for (let minutes = startTimeMinutes; minutes < endTimeMinutes; minutes += 15) {
      const hour = Math.floor(minutes / 60);
      const minute = minutes % 60;
      const timeSlot = `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
      
      // Check if this slot conflicts with breaks
      let isBreakTime = false;
      if (schedule.breaks) {
        const breaks = Array.isArray(schedule.breaks) ? schedule.breaks : JSON.parse(schedule.breaks as string);
        for (const breakPeriod of breaks) {
          if (timeSlot >= breakPeriod.startTime && timeSlot < breakPeriod.endTime) {
            isBreakTime = true;
            break;
          }
        }
      }
      
      if (!isBreakTime) {
        slots.push(timeSlot);
      }
    }
    
    return slots;
  }

  // Helper method to check if two time ranges overlap
  private timeRangesOverlap(start1: string, end1: string, start2: string, end2: string): boolean {
    return start1 < end2 && end1 > start2;
  }

  // Appointment management
  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db.insert(appointments).values({
      ...appointmentData,
      updatedAt: new Date(),
    }).returning();
    return appointment;
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db.select().from(appointments).where(eq(appointments.id, id));
    return appointment;
  }

  async getAppointmentWithDetails(id: number): Promise<AppointmentWithDetails | undefined> {
    const [appointment] = await db
      .select({
        appointment: appointments,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(stylists, eq(appointments.stylistId, stylists.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.id, id));

    if (!appointment) return undefined;

    return {
      ...appointment.appointment,
      client: appointment.client!,
      stylist: appointment.stylist!,
      service: appointment.service!,
    };
  }

  async getAllAppointments(): Promise<AppointmentWithDetails[]> {
    const results = await db
      .select({
        appointment: appointments,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(stylists, eq(appointments.stylistId, stylists.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .orderBy(desc(appointments.date), asc(appointments.startTime));

    return results.map(result => ({
      ...result.appointment,
      client: result.client!,
      stylist: result.stylist!,
      service: result.service!,
    }));
  }

  async getAppointmentsByDate(date: string): Promise<AppointmentWithDetails[]> {
    const results = await db
      .select({
        appointment: appointments,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(stylists, eq(appointments.stylistId, stylists.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.date, date))
      .orderBy(asc(appointments.startTime));

    return results.map(result => ({
      ...result.appointment,
      client: result.client!,
      stylist: result.stylist!,
      service: result.service!,
    }));
  }

  async getAppointmentsByDateRange(startDate: string, endDate: string): Promise<AppointmentWithDetails[]> {
    const results = await db
      .select({
        appointment: appointments,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(stylists, eq(appointments.stylistId, stylists.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(
        and(
          gte(appointments.date, startDate),
          lte(appointments.date, endDate)
        )
      )
      .orderBy(asc(appointments.date), asc(appointments.startTime));

    return results.map(result => ({
      ...result.appointment,
      client: result.client!,
      stylist: result.stylist!,
      service: result.service!,
    }));
  }

  async getClientAppointments(clientId: number): Promise<AppointmentWithDetails[]> {
    const results = await db
      .select({
        appointment: appointments,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(stylists, eq(appointments.stylistId, stylists.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.clientId, clientId))
      .orderBy(desc(appointments.date), desc(appointments.startTime));

    return results.map(result => ({
      ...result.appointment,
      client: result.client!,
      stylist: result.stylist!,
      service: result.service!,
    }));
  }

  async getStylistAppointments(stylistId: number, date?: string): Promise<AppointmentWithDetails[]> {
    const whereConditions = [eq(appointments.stylistId, stylistId)];
    if (date) {
      whereConditions.push(eq(appointments.date, date));
    }

    const results = await db
      .select({
        appointment: appointments,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(stylists, eq(appointments.stylistId, stylists.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(and(...whereConditions))
      .orderBy(asc(appointments.date), asc(appointments.startTime));

    return results.map(result => ({
      ...result.appointment,
      client: result.client!,
      stylist: result.stylist!,
      service: result.service!,
    }));
  }

  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [appointment] = await db
      .update(appointments)
      .set({
        ...appointmentData,
        updatedAt: new Date(),
      })
      .where(eq(appointments.id, id))
      .returning();
    return appointment;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db.delete(appointments).where(eq(appointments.id, id));
    return result.rowCount! > 0;
  }

  async getUpcomingAppointments(): Promise<AppointmentWithDetails[]> {
    const tomorrow = new Date();
    tomorrow.setDate(tomorrow.getDate() + 1);
    const tomorrowStr = tomorrow.toISOString().split('T')[0];

    const results = await db
      .select({
        appointment: appointments,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(stylists, eq(appointments.stylistId, stylists.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(
        and(
          eq(appointments.date, tomorrowStr),
          eq(appointments.status, "scheduled"),
          eq(appointments.reminderSent, false)
        )
      )
      .orderBy(asc(appointments.startTime));

    return results.map(result => ({
      ...result.appointment,
      client: result.client!,
      stylist: result.stylist!,
      service: result.service!,
    }));
  }

  async markReminderSent(id: number): Promise<boolean> {
    const [appointment] = await db
      .update(appointments)
      .set({ reminderSent: true })
      .where(eq(appointments.id, id))
      .returning();
    return !!appointment;
  }

  // Message templates
  async createMessageTemplate(templateData: InsertMessageTemplate): Promise<MessageTemplate> {
    const [template] = await db.insert(messageTemplates).values(templateData).returning();
    return template;
  }

  async getMessageTemplate(id: number): Promise<MessageTemplate | undefined> {
    const [template] = await db.select().from(messageTemplates).where(eq(messageTemplates.id, id));
    return template;
  }

  async getAllMessageTemplates(): Promise<MessageTemplate[]> {
    return await db.select().from(messageTemplates)
      .where(eq(messageTemplates.isActive, true))
      .orderBy(asc(messageTemplates.name));
  }

  async updateMessageTemplate(id: number, templateData: Partial<InsertMessageTemplate>): Promise<MessageTemplate | undefined> {
    const [template] = await db
      .update(messageTemplates)
      .set(templateData)
      .where(eq(messageTemplates.id, id))
      .returning();
    return template;
  }

  async deleteMessageTemplate(id: number): Promise<boolean> {
    const [template] = await db
      .update(messageTemplates)
      .set({ isActive: false })
      .where(eq(messageTemplates.id, id))
      .returning();
    return !!template;
  }

  // Recurring reminders
  async createRecurringReminder(reminderData: InsertRecurringReminder): Promise<RecurringReminder> {
    // Calculate next reminder date based on frequency
    const nextReminderDate = this.calculateNextReminderDate(reminderData.frequency, reminderData.dayOfWeek, reminderData.dayOfMonth);
    
    const [reminder] = await db.insert(recurringReminders).values({
      ...reminderData,
      nextReminderDate,
    }).returning();

    // Automatically create the first real appointment for this reminder
    try {
      await this.createAppointmentFromReminder(reminder.id, nextReminderDate);
      console.log(`✅ First appointment created for reminder ${reminder.id} on ${nextReminderDate}`);
    } catch (error) {
      // Don't fail the reminder creation if appointment creation fails
      console.error('Error creating automatic appointment for recurring reminder:', error);
    }

    return reminder;
  }

  // Helper method to create appointment from reminder with proper validation
  async createAppointmentFromReminder(reminderId: number, appointmentDate: string): Promise<void> {
    const reminder = await this.getRecurringReminder(reminderId);
    if (!reminder) {
      throw new Error('Reminder not found');
    }

    const startTime = reminder.preferredTime || '09:00';
    const endTime = this.calculateEndTime(startTime, reminder.service.duration);

    // Create the appointment with the exact same structure as form-created appointments
    const appointmentData: InsertAppointment = {
      clientId: reminder.clientId,
      stylistId: reminder.stylistId,
      serviceId: reminder.serviceId,
      date: appointmentDate,
      startTime: startTime,
      endTime: endTime,
      status: 'scheduled',
      notes: `Appuntamento dal promemoria ricorrente ${reminder.frequency}`
    };

    await this.createAppointment(appointmentData);
    console.log(`📅 Appointment created from reminder: ${reminder.client.firstName} ${reminder.client.lastName} on ${appointmentDate} at ${startTime}`);
  }

  async getRecurringReminder(id: number): Promise<RecurringReminderWithDetails | undefined> {
    const results = await db
      .select({
        reminder: recurringReminders,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(recurringReminders)
      .leftJoin(clients, eq(recurringReminders.clientId, clients.id))
      .leftJoin(stylists, eq(recurringReminders.stylistId, stylists.id))
      .leftJoin(services, eq(recurringReminders.serviceId, services.id))
      .where(eq(recurringReminders.id, id));

    if (results.length === 0) return undefined;

    const result = results[0];
    return {
      ...result.reminder,
      client: result.client!,
      stylist: result.stylist!,
      service: result.service!,
    };
  }

  async getAllRecurringReminders(): Promise<RecurringReminderWithDetails[]> {
    const results = await db
      .select({
        reminder: recurringReminders,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(recurringReminders)
      .leftJoin(clients, eq(recurringReminders.clientId, clients.id))
      .leftJoin(stylists, eq(recurringReminders.stylistId, stylists.id))
      .leftJoin(services, eq(recurringReminders.serviceId, services.id))
      .where(eq(recurringReminders.isActive, true))
      .orderBy(asc(clients.firstName), asc(clients.lastName));

    return results.map(result => ({
      ...result.reminder,
      client: result.client!,
      stylist: result.stylist!,
      service: result.service!,
    }));
  }

  async getClientRecurringReminders(clientId: number): Promise<RecurringReminderWithDetails[]> {
    const results = await db
      .select({
        reminder: recurringReminders,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(recurringReminders)
      .leftJoin(clients, eq(recurringReminders.clientId, clients.id))
      .leftJoin(stylists, eq(recurringReminders.stylistId, stylists.id))
      .leftJoin(services, eq(recurringReminders.serviceId, services.id))
      .where(and(
        eq(recurringReminders.clientId, clientId),
        eq(recurringReminders.isActive, true)
      ));

    return results.map(result => ({
      ...result.reminder,
      client: result.client!,
      stylist: result.stylist!,
      service: result.service!,
    }));
  }

  async updateRecurringReminder(id: number, reminderData: Partial<InsertRecurringReminder>): Promise<RecurringReminder | undefined> {
    const [reminder] = await db
      .update(recurringReminders)
      .set({
        ...reminderData,
        updatedAt: new Date(),
      })
      .where(eq(recurringReminders.id, id))
      .returning();
    return reminder;
  }

  async deleteRecurringReminder(id: number): Promise<boolean> {
    const [reminder] = await db
      .update(recurringReminders)
      .set({ isActive: false })
      .where(eq(recurringReminders.id, id))
      .returning();
    return !!reminder;
  }

  async getActiveRecurringReminders(): Promise<RecurringReminderWithDetails[]> {
    const today = new Date().toISOString().split('T')[0];
    
    const results = await db
      .select({
        reminder: recurringReminders,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(recurringReminders)
      .leftJoin(clients, eq(recurringReminders.clientId, clients.id))
      .leftJoin(stylists, eq(recurringReminders.stylistId, stylists.id))
      .leftJoin(services, eq(recurringReminders.serviceId, services.id))
      .where(and(
        eq(recurringReminders.isActive, true),
        lte(recurringReminders.nextReminderDate, today)
      ));

    return results.map(result => ({
      ...result.reminder,
      client: result.client!,
      stylist: result.stylist!,
      service: result.service!,
    }));
  }

  async updateNextReminderDate(id: number, nextDate: string): Promise<boolean> {
    const [reminder] = await db
      .update(recurringReminders)
      .set({ 
        nextReminderDate: nextDate,
        lastReminderSent: new Date().toISOString().split('T')[0],
        updatedAt: new Date(),
      })
      .where(eq(recurringReminders.id, id))
      .returning();
    return !!reminder;
  }

  private calculateNextReminderDate(frequency: string, dayOfWeek?: number | null, dayOfMonth?: number | null): string {
    const today = new Date();
    let nextDate = new Date(today);

    switch (frequency) {
      case 'weekly':
        if (dayOfWeek !== undefined && dayOfWeek !== null) {
          const daysUntilTarget = (dayOfWeek - today.getDay() + 7) % 7;
          if (daysUntilTarget === 0) {
            nextDate.setDate(today.getDate() + 7); // Next week if today is the target day
          } else {
            nextDate.setDate(today.getDate() + daysUntilTarget);
          }
        }
        break;
      case 'biweekly':
        if (dayOfWeek !== undefined && dayOfWeek !== null) {
          const daysUntilTarget = (dayOfWeek - today.getDay() + 7) % 7;
          nextDate.setDate(today.getDate() + daysUntilTarget + 14);
        }
        break;
      case 'monthly':
        if (dayOfMonth !== undefined && dayOfMonth !== null) {
          nextDate.setMonth(today.getMonth() + 1);
          nextDate.setDate(dayOfMonth);
          // If the day doesn't exist in the next month, set to last day of month
          if (nextDate.getDate() !== dayOfMonth) {
            nextDate.setDate(0); // Last day of previous month
          }
        }
        break;
      default:
        nextDate.setDate(today.getDate() + 7); // Default to weekly
    }

    return nextDate.toISOString().split('T')[0];
  }

  async migrateRecurringReminders(): Promise<{message: string, created: boolean}> {
    try {
      // Try to query the table to see if it exists
      await db.select().from(recurringReminders).limit(1);
      return {
        message: "Database already migrated - recurring_reminders table exists",
        created: false
      };
    } catch (error) {
      // Table doesn't exist, but we can't create it here without raw SQL
      // This will be handled by the migration script
      return {
        message: "Migration needed - please run the migration script",
        created: false
      };
    }
  }

  // Create real appointments from recurring reminders for specific date
  async getSuggestedAppointmentsByDate(date: string): Promise<any[]> {
    try {
      const allReminders = await this.getAllRecurringReminders();
      const existingAppointments = await this.getAppointmentsByDate(date);

      for (const reminder of allReminders) {
        // Use the same logic as date range - calculate all possible dates and check if our date matches
        const possibleDates = this.calculateRecurringDatesInRange(reminder, date, date);
        
        if (possibleDates.includes(date)) {
          // Check if there's already an appointment for this client on this date
          const existingAppointment = existingAppointments.find(apt => 
            apt.clientId === reminder.clientId && 
            apt.date === date
          );
          
          // Create real appointment if it doesn't exist
          if (!existingAppointment) {
            await this.createAppointmentFromReminder(reminder.id, date);
          }
        }
      }

      // Return empty array since we're creating real appointments, not suggested ones
      return [];
    } catch (error) {
      console.error("Error creating appointments from reminders by date:", error);
      return [];
    }
  }

  async getSuggestedAppointmentsByDateRange(startDate: string, endDate: string): Promise<any[]> {
    try {
      const allReminders = await this.getAllRecurringReminders();
      const existingAppointments = await this.getAppointmentsByDateRange(startDate, endDate);
      const processedDates = new Set();

      for (const reminder of allReminders) {
        // Calculate ALL possible dates for this reminder in the range
        const possibleDates = this.calculateRecurringDatesInRange(reminder, startDate, endDate);
        
        for (const appointmentDate of possibleDates) {
          const uniqueKey = `${reminder.clientId}-${appointmentDate}`;
          
          // Skip if already processed
          if (processedDates.has(uniqueKey)) continue;
          
          const existingAppointment = existingAppointments.find(apt => 
            apt.clientId === reminder.clientId && 
            apt.date === appointmentDate
          );
          
          // Create real appointment if it doesn't exist
          if (!existingAppointment) {
            await this.createAppointmentFromReminder(reminder.id, appointmentDate);
            processedDates.add(uniqueKey);
          }
        }
      }

      // Return empty array since we're creating real appointments, not suggested ones
      return [];
    } catch (error) {
      console.error("Error creating appointments from reminders by date range:", error);
      return [];
    }
  }

  async confirmSuggestedAppointment(suggestedId: number, appointmentData: any): Promise<any> {
    try {
      // Extract reminder ID from the suggested ID
      const reminderId = suggestedId;
      const reminder = await this.getRecurringReminder(reminderId);
      
      if (!reminder) {
        return null;
      }

      // Create the actual appointment
      const appointment = await this.createAppointment({
        clientId: reminder.clientId,
        stylistId: reminder.stylistId,
        serviceId: reminder.serviceId,
        date: appointmentData.date,
        startTime: appointmentData.startTime,
        endTime: appointmentData.endTime,
        notes: appointmentData.notes || `Confermato da promemoria ricorrente`
      });

      // Update the reminder's next date
      const nextDate = this.calculateNextReminderDate(
        reminder.frequency,
        reminder.dayOfWeek,
        reminder.dayOfMonth
      );
      
      await this.updateNextReminderDate(reminderId, nextDate);

      return appointment;
    } catch (error) {
      console.error("Error confirming suggested appointment:", error);
      return null;
    }
  }

  private calculateNextSuggestedDate(reminder: any, referenceDate: string): string {
    const today = new Date(referenceDate);
    let nextDate = new Date(today);

    switch (reminder.frequency) {
      case 'weekly':
        if (reminder.dayOfWeek !== undefined && reminder.dayOfWeek !== null) {
          const daysUntilTarget = (reminder.dayOfWeek - today.getDay() + 7) % 7;
          if (daysUntilTarget === 0) {
            // If today is the target day, return today
            return referenceDate;
          } else {
            nextDate.setDate(today.getDate() + daysUntilTarget);
          }
        }
        break;
      case 'biweekly':
        if (reminder.dayOfWeek !== undefined && reminder.dayOfWeek !== null) {
          const daysUntilTarget = (reminder.dayOfWeek - today.getDay() + 7) % 7;
          nextDate.setDate(today.getDate() + daysUntilTarget);
          // Check if this falls within the biweekly pattern
          const weeksSinceStart = Math.floor((nextDate.getTime() - new Date(reminder.createdAt).getTime()) / (7 * 24 * 60 * 60 * 1000));
          if (weeksSinceStart % 2 !== 0) {
            nextDate.setDate(nextDate.getDate() + 7);
          }
        }
        break;
      case 'monthly':
        if (reminder.dayOfMonth !== undefined && reminder.dayOfMonth !== null) {
          if (today.getDate() === reminder.dayOfMonth) {
            return referenceDate;
          }
          nextDate.setDate(reminder.dayOfMonth);
          if (nextDate < today) {
            nextDate.setMonth(nextDate.getMonth() + 1);
            nextDate.setDate(reminder.dayOfMonth);
          }
        }
        break;
    }

    return nextDate.toISOString().split('T')[0];
  }

  private calculateEndTime(startTime: string, durationMinutes: number): string {
    const [hours, minutes] = startTime.split(':').map(Number);
    const startTimeMinutes = hours * 60 + minutes;
    const endTimeMinutes = startTimeMinutes + durationMinutes;
    const endHours = Math.floor(endTimeMinutes / 60);
    const endMins = endTimeMinutes % 60;
    return `${endHours.toString().padStart(2, '0')}:${endMins.toString().padStart(2, '0')}`;
  }

  private getDatesBetween(startDate: string, endDate: string): string[] {
    const dates = [];
    const currentDate = new Date(startDate);
    const endDateObj = new Date(endDate);

    while (currentDate <= endDateObj) {
      dates.push(currentDate.toISOString().split('T')[0]);
      currentDate.setDate(currentDate.getDate() + 1);
    }

    return dates;
  }

  private calculateRecurringDatesInRange(reminder: any, startDate: string, endDate: string): string[] {
    const dates = [];
    const start = new Date(startDate);
    const end = new Date(endDate);
    let currentDate = new Date(start);

    switch (reminder.frequency) {
      case 'weekly':
        if (reminder.dayOfWeek !== undefined && reminder.dayOfWeek !== null) {
          // Find first occurrence of the target day in the range
          while (currentDate.getDay() !== reminder.dayOfWeek && currentDate <= end) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          // Add all weekly occurrences
          while (currentDate <= end) {
            if (currentDate >= start) {
              dates.push(currentDate.toISOString().split('T')[0]);
            }
            currentDate.setDate(currentDate.getDate() + 7);
          }
        }
        break;

      case 'biweekly':
        if (reminder.dayOfWeek !== undefined && reminder.dayOfWeek !== null) {
          // Find first occurrence of the target day in the range
          while (currentDate.getDay() !== reminder.dayOfWeek && currentDate <= end) {
            currentDate.setDate(currentDate.getDate() + 1);
          }
          
          // Add all biweekly occurrences
          while (currentDate <= end) {
            if (currentDate >= start) {
              dates.push(currentDate.toISOString().split('T')[0]);
            }
            currentDate.setDate(currentDate.getDate() + 14);
          }
        }
        break;

      case 'monthly':
        if (reminder.dayOfMonth !== undefined && reminder.dayOfMonth !== null) {
          // Start from the first month that contains the start date
          currentDate = new Date(start.getFullYear(), start.getMonth(), reminder.dayOfMonth);
          
          // If the target day is before start date in this month, move to next month
          if (currentDate < start) {
            currentDate.setMonth(currentDate.getMonth() + 1);
            currentDate.setDate(reminder.dayOfMonth);
          }
          
          // Add all monthly occurrences
          while (currentDate <= end) {
            if (currentDate >= start) {
              dates.push(currentDate.toISOString().split('T')[0]);
            }
            
            // Move to next month
            const nextMonth = currentDate.getMonth() + 1;
            currentDate.setMonth(nextMonth);
            currentDate.setDate(reminder.dayOfMonth);
            
            // Handle case where day doesn't exist in next month
            if (currentDate.getDate() !== reminder.dayOfMonth) {
              currentDate.setDate(0); // Last day of previous month
            }
          }
        }
        break;
    }

    return dates;
  }

  // Opening hours management - supports per-day configuration
  async getOpeningHours(): Promise<any> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const filePath = path.join(process.cwd(), 'data', 'opening-hours.json');
      
      // Check if file exists
      if (!fs.existsSync(filePath)) {
        // Return default weekly hours if file doesn't exist
        return this.getDefaultWeeklyHours();
      }
      
      const data = fs.readFileSync(filePath, 'utf8');
      const hours = JSON.parse(data);
      
      // Check if it's old format (just openTime/closeTime)
      if (hours.openTime && hours.closeTime && !hours.monday) {
        // Convert old format to new format and save it
        const convertedHours = this.convertOldFormatToWeekly(hours);
        await this.saveOpeningHours(convertedHours);
        return convertedHours;
      }
      
      // Validate weekly format
      if (!this.isValidWeeklyFormat(hours)) {
        return this.getDefaultWeeklyHours();
      }
      
      return hours;
    } catch (error) {
      console.error('Error reading opening hours:', error);
      return this.getDefaultWeeklyHours();
    }
  }

  async getOpeningHoursForDay(day: string): Promise<{ openTime: string; closeTime: string; isOpen: boolean }> {
    try {
      const allHours = await this.getOpeningHours();
      const dayHours = allHours[day.toLowerCase()];
      
      if (dayHours && dayHours.openTime && dayHours.closeTime) {
        return dayHours;
      }
      
      // Fallback to default hours
      return { openTime: "08:00", closeTime: "20:00", isOpen: true };
    } catch (error) {
      console.error(`Error getting opening hours for ${day}:`, error);
      return { openTime: "08:00", closeTime: "20:00", isOpen: true };
    }
  }

  async saveOpeningHours(hours: any): Promise<boolean> {
    try {
      const fs = await import('fs');
      const path = await import('path');
      const dataDir = path.join(process.cwd(), 'data');
      const filePath = path.join(dataDir, 'opening-hours.json');
      
      // Create data directory if it doesn't exist
      if (!fs.existsSync(dataDir)) {
        fs.mkdirSync(dataDir, { recursive: true });
      }
      
      // Validate weekly format
      if (!this.isValidWeeklyFormat(hours)) {
        throw new Error('Invalid weekly hours format');
      }
      
      fs.writeFileSync(filePath, JSON.stringify(hours, null, 2));
      return true;
    } catch (error) {
      console.error('Error saving opening hours:', error);
      return false;
    }
  }

  private getDefaultWeeklyHours(): any {
    return {
      monday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
      tuesday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
      wednesday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
      thursday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
      friday: { openTime: "08:00", closeTime: "22:00", isOpen: true },
      saturday: { openTime: "09:00", closeTime: "20:00", isOpen: true },
      sunday: { openTime: "10:00", closeTime: "18:00", isOpen: false }
    };
  }

  private convertOldFormatToWeekly(oldHours: any): any {
    const defaultHours = {
      openTime: oldHours.openTime || "08:00",
      closeTime: oldHours.closeTime || "20:00",
      isOpen: true
    };
    
    return {
      monday: defaultHours,
      tuesday: defaultHours,
      wednesday: defaultHours,
      thursday: defaultHours,
      friday: defaultHours,
      saturday: { ...defaultHours, openTime: "09:00", closeTime: "18:00" },
      sunday: { ...defaultHours, openTime: "10:00", closeTime: "16:00", isOpen: false }
    };
  }

  private isValidWeeklyFormat(hours: any): boolean {
    const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
    const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
    
    for (const day of requiredDays) {
      if (!hours[day]) return false;
      
      const dayHours = hours[day];
      if (typeof dayHours.isOpen !== 'boolean') return false;
      
      if (dayHours.isOpen) {
        if (!dayHours.openTime || !dayHours.closeTime) return false;
        if (!timeRegex.test(dayHours.openTime) || !timeRegex.test(dayHours.closeTime)) return false;
      }
    }
    
    return true;
  }
}

export const storage = new DatabaseStorage();