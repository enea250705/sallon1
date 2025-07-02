import { 
  users, clients, services, stylists, appointments, messageTemplates, salonSettings, stylistWorkingHours,
  recurringReminders, stylistVacations, salonExtraordinaryDays,
  type User, type InsertUser, type Client, type InsertClient,
  type Service, type InsertService, type Stylist, type InsertStylist,
  type Appointment, type InsertAppointment, type AppointmentWithDetails,
  type MessageTemplate, type InsertMessageTemplate, type SalonSetting, type InsertSalonSetting,
  type StylistWorkingHours, type InsertStylistWorkingHours,
  type RecurringReminder, type InsertRecurringReminder,
  type StylistVacation, type InsertStylistVacation, type SalonExtraordinaryDay,
  type InsertSalonExtraordinaryDay, type RecurringReminderWithDetails, type StylistVacationWithDetails
} from "../../shared/schema";
import { db } from "./db";
import { eq, like, and, gte, lte, desc, sql, asc, between, ne, or, isNull } from "drizzle-orm";

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

  async upsertStylistWorkingHours(
    stylistId: number,
    dayOfWeek: number,
    workingHoursData: InsertStylistWorkingHours
  ): Promise<StylistWorkingHours> {
    // First try to find existing record
    const existing = await this.getStylistWorkingHoursByDay(stylistId, dayOfWeek);
    
    if (existing) {
      // Update existing record
      const [updated] = await db()
        .update(stylistWorkingHours)
        .set({ 
          startTime: workingHoursData.startTime,
          endTime: workingHoursData.endTime,
          breakStartTime: workingHoursData.breakStartTime,
          breakEndTime: workingHoursData.breakEndTime,
          isWorking: workingHoursData.isWorking,
          updatedAt: new Date()
        })
        .where(and(
          eq(stylistWorkingHours.stylistId, stylistId),
          eq(stylistWorkingHours.dayOfWeek, dayOfWeek)
        ))
        .returning();
      return updated;
    } else {
      // Create new record
      const [created] = await db()
        .insert(stylistWorkingHours)
        .values({
          ...workingHoursData,
          stylistId,
          dayOfWeek
        })
        .returning();
      return created;
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

    // Check if time is within working hours
    const isWithinWorkingHours = timeMinutes >= startMinutes && timeMinutes < endMinutes;
    
    if (!isWithinWorkingHours) {
      return false;
    }

    // Check if time is during break time
    if (workingHours.breakStartTime && workingHours.breakEndTime) {
      const [breakStartHour, breakStartMinute] = workingHours.breakStartTime.split(':').map(Number);
      const breakStartMinutes = breakStartHour * 60 + breakStartMinute;

      const [breakEndHour, breakEndMinute] = workingHours.breakEndTime.split(':').map(Number);
      const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

      const isOnBreak = timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes;
      if (isOnBreak) {
        return false; // Stylist is on break
      }
    }

    return true;
  }

  // Check if stylist is on break at a specific time
  async isStylistOnBreak(stylistId: number, dayOfWeek: number, time: string): Promise<boolean> {
    const workingHours = await this.getStylistWorkingHoursByDay(stylistId, dayOfWeek);
    
    if (!workingHours || !workingHours.isWorking || !workingHours.breakStartTime || !workingHours.breakEndTime) {
      return false;
    }

    // Convert time to minutes for comparison
    const [hour, minute] = time.split(':').map(Number);
    const timeMinutes = hour * 60 + minute;

    const [breakStartHour, breakStartMinute] = workingHours.breakStartTime.split(':').map(Number);
    const breakStartMinutes = breakStartHour * 60 + breakStartMinute;

    const [breakEndHour, breakEndMinute] = workingHours.breakEndTime.split(':').map(Number);
    const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

    return timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes;
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

  // =================== STYLIST VACATIONS MANAGEMENT ===================

  async createStylistVacation(vacationData: InsertStylistVacation): Promise<StylistVacation> {
    const [vacation] = await db()
      .insert(stylistVacations)
      .values(vacationData)
      .returning();
    return vacation;
  }

  async getStylistVacation(id: number): Promise<StylistVacation | undefined> {
    const [vacation] = await db().select().from(stylistVacations).where(eq(stylistVacations.id, id));
    return vacation || undefined;
  }

  async getStylistVacations(stylistId: number): Promise<StylistVacation[]> {
    return await db()
      .select()
      .from(stylistVacations)
      .where(and(eq(stylistVacations.stylistId, stylistId), eq(stylistVacations.isActive, true)))
      .orderBy(stylistVacations.startDate);
  }

  async getAllStylistVacations(): Promise<StylistVacationWithDetails[]> {
    return await db()
      .select({
        id: stylistVacations.id,
        stylistId: stylistVacations.stylistId,
        startDate: stylistVacations.startDate,
        endDate: stylistVacations.endDate,
        reason: stylistVacations.reason,
        notes: stylistVacations.notes,
        isActive: stylistVacations.isActive,
        createdAt: stylistVacations.createdAt,
        updatedAt: stylistVacations.updatedAt,
        stylist: stylists,
      })
      .from(stylistVacations)
      .leftJoin(stylists, eq(stylistVacations.stylistId, stylists.id))
      .where(eq(stylistVacations.isActive, true))
      .orderBy(stylistVacations.startDate);
  }

  async updateStylistVacation(id: number, vacationData: Partial<InsertStylistVacation>): Promise<StylistVacation | undefined> {
    const [vacation] = await db()
      .update(stylistVacations)
      .set({ ...vacationData, updatedAt: new Date() })
      .where(eq(stylistVacations.id, id))
      .returning();
    return vacation || undefined;
  }

  async deleteStylistVacation(id: number): Promise<boolean> {
    const result = await db()
      .update(stylistVacations)
      .set({ isActive: false, updatedAt: new Date() })
      .where(eq(stylistVacations.id, id));
    return result.rowCount > 0;
  }

  async isStylistOnVacation(stylistId: number, date: string): Promise<boolean> {
    const [vacation] = await db()
      .select()
      .from(stylistVacations)
      .where(
        and(
          eq(stylistVacations.stylistId, stylistId),
          eq(stylistVacations.isActive, true),
          lte(stylistVacations.startDate, date),
          gte(stylistVacations.endDate, date)
        )
      )
      .limit(1);
    
    return !!vacation;
  }

  // =================== SALON EXTRAORDINARY DAYS MANAGEMENT ===================

  async createSalonExtraordinaryDay(dayData: InsertSalonExtraordinaryDay): Promise<SalonExtraordinaryDay> {
    const [day] = await db()
      .insert(salonExtraordinaryDays)
      .values(dayData)
      .returning();
    return day;
  }

  async getSalonExtraordinaryDay(date: string): Promise<SalonExtraordinaryDay | undefined> {
    const [day] = await db()
      .select()
      .from(salonExtraordinaryDays)
      .where(eq(salonExtraordinaryDays.date, date));
    return day || undefined;
  }

  async getAllSalonExtraordinaryDays(): Promise<SalonExtraordinaryDay[]> {
    return await db()
      .select()
      .from(salonExtraordinaryDays)
      .orderBy(salonExtraordinaryDays.date);
  }

  async getSalonExtraordinaryDaysInRange(startDate: string, endDate: string): Promise<SalonExtraordinaryDay[]> {
    return await db()
      .select()
      .from(salonExtraordinaryDays)
      .where(and(
        gte(salonExtraordinaryDays.date, startDate),
        lte(salonExtraordinaryDays.date, endDate)
      ))
      .orderBy(salonExtraordinaryDays.date);
  }

  async updateSalonExtraordinaryDay(date: string, dayData: Partial<InsertSalonExtraordinaryDay>): Promise<SalonExtraordinaryDay | undefined> {
    const [day] = await db()
      .update(salonExtraordinaryDays)
      .set({ ...dayData, updatedAt: new Date() })
      .where(eq(salonExtraordinaryDays.date, date))
      .returning();
    return day || undefined;
  }

  async deleteSalonExtraordinaryDay(date: string): Promise<boolean> {
    const result = await db().delete(salonExtraordinaryDays).where(eq(salonExtraordinaryDays.date, date));
    return result.rowCount > 0;
  }

  async isSalonClosedOnDate(date: string): Promise<boolean> {
    const extraordinaryDay = await this.getSalonExtraordinaryDay(date);
    return extraordinaryDay?.isClosed || false;
  }

  // =================== ENHANCED WORKING HOURS WITH DOUBLE SHIFTS ===================

  async isStylistWorkingAdvanced(stylistId: number, dayOfWeek: number, time: string): Promise<{
    isWorking: boolean;
    isOnBreak: boolean;
    currentShift: 'morning' | 'afternoon' | 'none';
    status: 'working' | 'on_break' | 'not_working' | 'on_vacation';
  }> {
    // Check if stylist is on vacation first
    const today = new Date().toISOString().split('T')[0];
    const isOnVacation = await this.isStylistOnVacation(stylistId, today);
    
    if (isOnVacation) {
      return {
        isWorking: false,
        isOnBreak: false,
        currentShift: 'none',
        status: 'on_vacation'
      };
    }

    const workingHours = await this.getStylistWorkingHoursByDay(stylistId, dayOfWeek);
    
    if (!workingHours || !workingHours.isWorking) {
      return {
        isWorking: false,
        isOnBreak: false,
        currentShift: 'none',
        status: 'not_working'
      };
    }

    // Convert time to minutes for comparison
    const [hour, minute] = time.split(':').map(Number);
    const timeMinutes = hour * 60 + minute;

    // Check morning shift
    if (workingHours.morningStart && workingHours.morningEnd) {
      const [morningStartHour, morningStartMinute] = workingHours.morningStart.split(':').map(Number);
      const morningStartMinutes = morningStartHour * 60 + morningStartMinute;

      const [morningEndHour, morningEndMinute] = workingHours.morningEnd.split(':').map(Number);
      const morningEndMinutes = morningEndHour * 60 + morningEndMinute;

      if (timeMinutes >= morningStartMinutes && timeMinutes < morningEndMinutes) {
        // Check morning break
        if (workingHours.morningBreakStart && workingHours.morningBreakEnd) {
          const [breakStartHour, breakStartMinute] = workingHours.morningBreakStart.split(':').map(Number);
          const breakStartMinutes = breakStartHour * 60 + breakStartMinute;

          const [breakEndHour, breakEndMinute] = workingHours.morningBreakEnd.split(':').map(Number);
          const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

          if (timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes) {
            return {
              isWorking: false,
              isOnBreak: true,
              currentShift: 'morning',
              status: 'on_break'
            };
          }
        }

        return {
          isWorking: true,
          isOnBreak: false,
          currentShift: 'morning',
          status: 'working'
        };
      }
    }

    // Check afternoon shift
    if (workingHours.afternoonStart && workingHours.afternoonEnd) {
      const [afternoonStartHour, afternoonStartMinute] = workingHours.afternoonStart.split(':').map(Number);
      const afternoonStartMinutes = afternoonStartHour * 60 + afternoonStartMinute;

      const [afternoonEndHour, afternoonEndMinute] = workingHours.afternoonEnd.split(':').map(Number);
      const afternoonEndMinutes = afternoonEndHour * 60 + afternoonEndMinute;

      if (timeMinutes >= afternoonStartMinutes && timeMinutes < afternoonEndMinutes) {
        // Check afternoon break
        if (workingHours.afternoonBreakStart && workingHours.afternoonBreakEnd) {
          const [breakStartHour, breakStartMinute] = workingHours.afternoonBreakStart.split(':').map(Number);
          const breakStartMinutes = breakStartHour * 60 + breakStartMinute;

          const [breakEndHour, breakEndMinute] = workingHours.afternoonBreakEnd.split(':').map(Number);
          const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

          if (timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes) {
            return {
              isWorking: false,
              isOnBreak: true,
              currentShift: 'afternoon',
              status: 'on_break'
            };
          }
        }

        return {
          isWorking: true,
          isOnBreak: false,
          currentShift: 'afternoon',
          status: 'working'
        };
      }
    }

    // Fall back to legacy single shift check for backward compatibility
    const [startHour, startMinute] = workingHours.startTime.split(':').map(Number);
    const startMinutes = startHour * 60 + startMinute;

    const [endHour, endMinute] = workingHours.endTime.split(':').map(Number);
    const endMinutes = endHour * 60 + endMinute;

    const isWithinWorkingHours = timeMinutes >= startMinutes && timeMinutes < endMinutes;
    
    if (!isWithinWorkingHours) {
      return {
        isWorking: false,
        isOnBreak: false,
        currentShift: 'none',
        status: 'not_working'
      };
    }

    // Check legacy break time
    if (workingHours.breakStartTime && workingHours.breakEndTime) {
      const [breakStartHour, breakStartMinute] = workingHours.breakStartTime.split(':').map(Number);
      const breakStartMinutes = breakStartHour * 60 + breakStartMinute;

      const [breakEndHour, breakEndMinute] = workingHours.breakEndTime.split(':').map(Number);
      const breakEndMinutes = breakEndHour * 60 + breakEndMinute;

      if (timeMinutes >= breakStartMinutes && timeMinutes < breakEndMinutes) {
        return {
          isWorking: false,
          isOnBreak: true,
          currentShift: 'none',
          status: 'on_break'
        };
      }
    }

    return {
      isWorking: true,
      isOnBreak: false,
      currentShift: 'none',
      status: 'working'
    };
  }

  // =================== RECURRING REMINDERS FIX ===================

  async deleteRecurringReminderCompletely(id: number): Promise<boolean> {
    try {
      // First, get the reminder to know which appointments to clean up
      const reminder = await this.getRecurringReminder(id);
      if (!reminder) {
        return false;
      }

      // Delete all future appointments created by this reminder
      // We identify them by checking notes that contain the reminder ID or pattern
      await db()
        .delete(appointments)
        .where(
          and(
            eq(appointments.clientId, reminder.clientId),
            eq(appointments.stylistId, reminder.stylistId),
            eq(appointments.serviceId, reminder.serviceId),
            gte(appointments.date, new Date().toISOString().split('T')[0]),
            or(
              eq(appointments.notes, `Appuntamento dal promemoria ricorrente ${reminder.frequency}`),
              eq(appointments.notes, `Confermato da promemoria ricorrente`)
            )
          )
        );

      // Now delete the recurring reminder itself
      const result = await db().delete(recurringReminders).where(eq(recurringReminders.id, id));
      
      console.log(`✅ Deleted recurring reminder ${id} and cleaned up related appointments`);
      return result.rowCount > 0;
    } catch (error) {
      console.error('Error deleting recurring reminder completely:', error);
      return false;
    }
  }
}

export const storage = new ServerlessStorage();