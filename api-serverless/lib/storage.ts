import { 
  users, clients, services, stylists, appointments, messageTemplates, salonSettings, stylistWorkingHours,
  type User, type InsertUser, type Client, type InsertClient,
  type Service, type InsertService, type Stylist, type InsertStylist,
  type Appointment, type InsertAppointment, type AppointmentWithDetails,
  type MessageTemplate, type InsertMessageTemplate, type SalonSetting, type InsertSalonSetting,
  type StylistWorkingHours, type InsertStylistWorkingHours
} from "../../shared/schema";
import { db } from "./db";
import { eq, like, and, gte, lte, desc, sql } from "drizzle-orm";

export class ServerlessStorage {
  async getUser(id: number): Promise<User | undefined> {
    const [user] = await db().select().from(users).where(eq(users.id, id));
    return user || undefined;
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    const [user] = await db().select().from(users).where(eq(users.username, username));
    return user || undefined;
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const [user] = await db()
      .insert(users)
      .values(insertUser)
      .returning();
    return user;
  }

  async updateUser(id: number, userData: Partial<InsertUser>): Promise<User | undefined> {
    const [user] = await db()
      .update(users)
      .set(userData)
      .where(eq(users.id, id))
      .returning();
    return user || undefined;
  }

  async getAllUsers(): Promise<User[]> {
    return await db().select().from(users).orderBy(users.firstName);
  }

  async deleteUser(id: number): Promise<boolean> {
    const result = await db().delete(users).where(eq(users.id, id));
    return result.rowCount > 0;
  }

  // Client management
  async createClient(clientData: InsertClient): Promise<Client> {
    const [client] = await db()
      .insert(clients)
      .values(clientData)
      .returning();
    return client;
  }

  async getClient(id: number): Promise<Client | undefined> {
    const [client] = await db().select().from(clients).where(eq(clients.id, id));
    return client || undefined;
  }

  async getAllClients(): Promise<Client[]> {
    return await db().select().from(clients).orderBy(clients.firstName);
  }

  async searchClients(query: string): Promise<Client[]> {
    return await db()
      .select()
      .from(clients)
      .where(
        sql`LOWER(${clients.firstName}) LIKE LOWER(${`%${query}%`}) OR LOWER(${clients.lastName}) LIKE LOWER(${`%${query}%`})`
      )
      .orderBy(clients.firstName);
  }

  async updateClient(id: number, clientData: Partial<InsertClient>): Promise<Client | undefined> {
    const [client] = await db()
      .update(clients)
      .set(clientData)
      .where(eq(clients.id, id))
      .returning();
    return client || undefined;
  }

  async deleteClient(id: number): Promise<boolean> {
    const result = await db().delete(clients).where(eq(clients.id, id));
    return result.rowCount > 0;
  }

  // Service management
  async createService(serviceData: InsertService): Promise<Service> {
    const [service] = await db()
      .insert(services)
      .values(serviceData)
      .returning();
    return service;
  }

  async getService(id: number): Promise<Service | undefined> {
    const [service] = await db().select().from(services).where(eq(services.id, id));
    return service || undefined;
  }

  async getAllServices(): Promise<Service[]> {
    return await db().select().from(services).orderBy(services.name);
  }

  async updateService(id: number, serviceData: Partial<InsertService>): Promise<Service | undefined> {
    const [service] = await db()
      .update(services)
      .set(serviceData)
      .where(eq(services.id, id))
      .returning();
    return service || undefined;
  }

  async deleteService(id: number): Promise<boolean> {
    const result = await db().delete(services).where(eq(services.id, id));
    return result.rowCount > 0;
  }

  // Stylist management
  async createStylist(stylistData: InsertStylist): Promise<Stylist> {
    const [stylist] = await db()
      .insert(stylists)
      .values(stylistData)
      .returning();
    return stylist;
  }

  async getStylist(id: number): Promise<Stylist | undefined> {
    const [stylist] = await db().select().from(stylists).where(eq(stylists.id, id));
    return stylist || undefined;
  }

  async getAllStylists(): Promise<Stylist[]> {
    return await db().select().from(stylists).orderBy(stylists.name);
  }

  async updateStylist(id: number, stylistData: Partial<InsertStylist>): Promise<Stylist | undefined> {
    const [stylist] = await db()
      .update(stylists)
      .set(stylistData)
      .where(eq(stylists.id, id))
      .returning();
    return stylist || undefined;
  }

  async deleteStylist(id: number): Promise<boolean> {
    const result = await db().delete(stylists).where(eq(stylists.id, id));
    return result.rowCount > 0;
  }

  // Stylist working hours management
  async createStylistWorkingHours(workingHoursData: InsertStylistWorkingHours): Promise<StylistWorkingHours> {
    const [workingHours] = await db()
      .insert(stylistWorkingHours)
      .values(workingHoursData)
      .returning();
    return workingHours;
  }

  async getStylistWorkingHours(stylistId: number): Promise<StylistWorkingHours[]> {
    return await db()
      .select()
      .from(stylistWorkingHours)
      .where(eq(stylistWorkingHours.stylistId, stylistId))
      .orderBy(stylistWorkingHours.dayOfWeek);
  }

  async getStylistWorkingHoursByDay(stylistId: number, dayOfWeek: number): Promise<StylistWorkingHours | undefined> {
    const [workingHours] = await db()
      .select()
      .from(stylistWorkingHours)
      .where(and(
        eq(stylistWorkingHours.stylistId, stylistId),
        eq(stylistWorkingHours.dayOfWeek, dayOfWeek)
      ));
    return workingHours || undefined;
  }

  async updateStylistWorkingHours(id: number, workingHoursData: Partial<InsertStylistWorkingHours>): Promise<StylistWorkingHours | undefined> {
    const [workingHours] = await db()
      .update(stylistWorkingHours)
      .set({ ...workingHoursData, updatedAt: new Date() })
      .where(eq(stylistWorkingHours.id, id))
      .returning();
    return workingHours || undefined;
  }

  async deleteStylistWorkingHours(id: number): Promise<boolean> {
    const result = await db().delete(stylistWorkingHours).where(eq(stylistWorkingHours.id, id));
    return result.rowCount > 0;
  }

  async upsertStylistWorkingHours(stylistId: number, dayOfWeek: number, workingHoursData: Partial<InsertStylistWorkingHours>): Promise<StylistWorkingHours> {
    // Check if working hours already exist for this stylist and day
    const existing = await this.getStylistWorkingHoursByDay(stylistId, dayOfWeek);
    
    if (existing) {
      // Update existing record
      const updated = await this.updateStylistWorkingHours(existing.id, workingHoursData);
      return updated!;
    } else {
      // Create new record
      return await this.createStylistWorkingHours({
        stylistId,
        dayOfWeek,
        ...workingHoursData
      } as InsertStylistWorkingHours);
    }
  }

  // Check if stylist is working at a specific time
  async isStylistWorking(stylistId: number, dayOfWeek: number, time: string): Promise<boolean> {
    const workingHours = await this.getStylistWorkingHoursByDay(stylistId, dayOfWeek);
    
    if (!workingHours || !workingHours.isWorking) {
      return false;
    }

    // Convert time to minutes for comparison
    const [hour, minute] = time.split(':').map(Number);
    const timeMinutes = hour * 60 + minute;

    const [startHour, startMinute] = workingHours.startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = workingHours.endTime.split(':').map(Number);
    const endMinutes = endHour * 60 + endMinute;

    return timeMinutes >= startMinutes && timeMinutes < endMinutes;
  }

  // Appointment management
  async createAppointment(appointmentData: InsertAppointment): Promise<Appointment> {
    const [appointment] = await db()
      .insert(appointments)
      .values(appointmentData)
      .returning();
    return appointment;
  }

  async getAppointment(id: number): Promise<Appointment | undefined> {
    const [appointment] = await db().select().from(appointments).where(eq(appointments.id, id));
    return appointment || undefined;
  }

  async getAppointmentWithDetails(id: number): Promise<AppointmentWithDetails | undefined> {
    const [appointment] = await db()
      .select({
        id: appointments.id,
        clientId: appointments.clientId,
        stylistId: appointments.stylistId,
        serviceId: appointments.serviceId,
        date: appointments.date,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        reminderSent: appointments.reminderSent,
        createdAt: appointments.createdAt,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(stylists, eq(appointments.stylistId, stylists.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.id, id));
    
    return appointment || undefined;
  }

  async getAllAppointments(): Promise<AppointmentWithDetails[]> {
    return await db()
      .select({
        id: appointments.id,
        clientId: appointments.clientId,
        stylistId: appointments.stylistId,
        serviceId: appointments.serviceId,
        date: appointments.date,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        reminderSent: appointments.reminderSent,
        createdAt: appointments.createdAt,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(stylists, eq(appointments.stylistId, stylists.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .orderBy(desc(appointments.date), appointments.startTime);
  }

  async getAppointmentsByDate(date: string): Promise<AppointmentWithDetails[]> {
    return await db()
      .select({
        id: appointments.id,
        clientId: appointments.clientId,
        stylistId: appointments.stylistId,
        serviceId: appointments.serviceId,
        date: appointments.date,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        reminderSent: appointments.reminderSent,
        createdAt: appointments.createdAt,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(stylists, eq(appointments.stylistId, stylists.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(eq(appointments.date, date))
      .orderBy(appointments.startTime);
  }

  async getAppointmentsByDateRange(startDate: string, endDate: string): Promise<AppointmentWithDetails[]> {
    return await db()
      .select({
        id: appointments.id,
        clientId: appointments.clientId,
        stylistId: appointments.stylistId,
        serviceId: appointments.serviceId,
        date: appointments.date,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        reminderSent: appointments.reminderSent,
        createdAt: appointments.createdAt,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(stylists, eq(appointments.stylistId, stylists.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(and(gte(appointments.date, startDate), lte(appointments.date, endDate)))
      .orderBy(appointments.date, appointments.startTime);
  }

  async updateAppointment(id: number, appointmentData: Partial<InsertAppointment>): Promise<Appointment | undefined> {
    const [appointment] = await db()
      .update(appointments)
      .set(appointmentData)
      .where(eq(appointments.id, id))
      .returning();
    return appointment || undefined;
  }

  async deleteAppointment(id: number): Promise<boolean> {
    const result = await db().delete(appointments).where(eq(appointments.id, id));
    return result.rowCount > 0;
  }

  async getUpcomingAppointments(): Promise<AppointmentWithDetails[]> {
    const today = new Date().toISOString().split('T')[0];
    return await db()
      .select({
        id: appointments.id,
        clientId: appointments.clientId,
        stylistId: appointments.stylistId,
        serviceId: appointments.serviceId,
        date: appointments.date,
        startTime: appointments.startTime,
        endTime: appointments.endTime,
        status: appointments.status,
        notes: appointments.notes,
        reminderSent: appointments.reminderSent,
        createdAt: appointments.createdAt,
        client: clients,
        stylist: stylists,
        service: services,
      })
      .from(appointments)
      .leftJoin(clients, eq(appointments.clientId, clients.id))
      .leftJoin(stylists, eq(appointments.stylistId, stylists.id))
      .leftJoin(services, eq(appointments.serviceId, services.id))
      .where(gte(appointments.date, today))
      .orderBy(appointments.date, appointments.startTime);
  }

  async markReminderSent(id: number): Promise<boolean> {
    const result = await db()
      .update(appointments)
      .set({ reminderSent: true })
      .where(eq(appointments.id, id));
    return result.rowCount > 0;
  }

  // Initialize default salon settings if they don't exist
  async initializeSalonSettings(): Promise<void> {
    try {
      console.log('🚀 Initializing salon settings...');
      
      // Check if openTime exists
      const [openTimeSetting] = await db()
        .select()
        .from(salonSettings)
        .where(eq(salonSettings.settingKey, 'openTime'))
        .limit(1);
      
      if (!openTimeSetting) {
        await db()
          .insert(salonSettings)
          .values({
            settingKey: 'openTime',
            settingValue: '07:00',
            description: 'Salon opening time'
          });
        console.log('✅ Initialized default opening time: 07:00');
      }
      
      // Check if closeTime exists
      const [closeTimeSetting] = await db()
        .select()
        .from(salonSettings)
        .where(eq(salonSettings.settingKey, 'closeTime'))
        .limit(1);
      
      if (!closeTimeSetting) {
        await db()
          .insert(salonSettings)
          .values({
            settingKey: 'closeTime',
            settingValue: '22:00',
            description: 'Salon closing time'
          });
        console.log('✅ Initialized default closing time: 22:00');
      }
      
      console.log('✅ Salon settings initialization complete');
    } catch (error) {
      console.error('❌ Error initializing salon settings:', error);
    }
  }

  // Opening hours management with database persistence
  async getOpeningHours(): Promise<{ openTime: string; closeTime: string }> {
    try {
      // Get opening and closing times from database
      const [openTimeSetting] = await db()
        .select()
        .from(salonSettings)
        .where(eq(salonSettings.settingKey, 'openTime'))
        .limit(1);
        
      const [closeTimeSetting] = await db()
        .select()
        .from(salonSettings)
        .where(eq(salonSettings.settingKey, 'closeTime'))
        .limit(1);
      
      // If settings don't exist, initialize them
      if (!openTimeSetting || !closeTimeSetting) {
        console.log('⚠️ Opening hours not found in database, initializing...');
        await this.initializeSalonSettings();
        
        // Try again after initialization
        const [newOpenTimeSetting] = await db()
          .select()
          .from(salonSettings)
          .where(eq(salonSettings.settingKey, 'openTime'))
          .limit(1);
          
        const [newCloseTimeSetting] = await db()
          .select()
          .from(salonSettings)
          .where(eq(salonSettings.settingKey, 'closeTime'))
          .limit(1);
        
        const openTime = newOpenTimeSetting?.settingValue || "07:00";
        const closeTime = newCloseTimeSetting?.settingValue || "22:00";
        
        console.log('📅 Returning initialized opening hours:', { openTime, closeTime });
        return { openTime, closeTime };
      }
      
      const openTime = openTimeSetting.settingValue;
      const closeTime = closeTimeSetting.settingValue;
      
      console.log('📅 Returning opening hours from database:', { openTime, closeTime });
      return { openTime, closeTime };
    } catch (error) {
      console.error('Error reading opening hours from database:', error);
      // Return default hours on error
      return { openTime: "07:00", closeTime: "22:00" };
    }
  }

  async saveOpeningHours(hours: { openTime: string; closeTime: string }): Promise<boolean> {
    try {
      // Validate time format
      const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
      if (!timeRegex.test(hours.openTime) || !timeRegex.test(hours.closeTime)) {
        throw new Error('Invalid time format');
      }
      
      // Save opening time to database (upsert)
      await db()
        .insert(salonSettings)
        .values({
          settingKey: 'openTime',
          settingValue: hours.openTime,
          description: 'Salon opening time'
        })
        .onConflictDoUpdate({
          target: salonSettings.settingKey,
          set: {
            settingValue: hours.openTime,
            updatedAt: new Date()
          }
        });

      // Save closing time to database (upsert)
      await db()
        .insert(salonSettings)
        .values({
          settingKey: 'closeTime',
          settingValue: hours.closeTime,
          description: 'Salon closing time'
        })
        .onConflictDoUpdate({
          target: salonSettings.settingKey,
          set: {
            settingValue: hours.closeTime,
            updatedAt: new Date()
          }
        });
      
      console.log('📅 Opening hours saved to database:', hours);
      return true;
    } catch (error) {
      console.error('Error saving opening hours to database:', error);
      return false;
    }
  }
}

export const storage = new ServerlessStorage();