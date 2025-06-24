import type { Express } from "express";
import { createServer, type Server } from "http";
import path from "path";
import { storage } from "./storage";
import bcrypt from "bcrypt";
import session from "express-session";
import { insertClientSchema, insertAppointmentSchema, insertServiceSchema, insertStylistSchema, insertMessageTemplateSchema, insertUserSchema, insertRecurringReminderSchema } from "@shared/schema";
import { z } from "zod";


// Authentication middleware
const isAuthenticated = (req: any, res: any, next: any) => {
  if (req.session && req.session.user) {
    return next();
  }
  return res.status(401).json({ message: "Unauthorized" });
};

const isAdmin = (req: any, res: any, next: any) => {
  if (req.session && req.session.user && req.session.user.role === "admin") {
    return next();
  }
  return res.status(403).json({ message: "Forbidden" });
};

export async function registerRoutes(app: Express): Promise<Server> {
  // Setup session middleware
  app.use(session({
    secret: process.env.SESSION_SECRET || 'hairdresser-secret-key-2024',
    store: storage.sessionStore,
    resave: false,
    saveUninitialized: false,
    cookie: {
      secure: false, // Set to true in production with HTTPS
      httpOnly: true,
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  }));

  // Authentication routes
  app.post("/api/auth/login", async (req, res) => {
    try {
      const { username, password } = req.body;
      
      if (!username || !password) {
        return res.status(400).json({ message: "Username and password are required" });
      }

      const user = await storage.getUserByUsername(username);
      if (!user) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      const isValidPassword = await bcrypt.compare(password, user.password);
      if (!isValidPassword) {
        return res.status(401).json({ message: "Invalid credentials" });
      }

      // Update last login - handled separately since it's not in the insert schema

      // Store user in session
      req.session.user = {
        id: user.id,
        username: user.username,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        role: user.role,
      };

      res.json({
        user: req.session.user,
        message: "Login successful",
      });
    } catch (error) {
      console.error("Login error:", error);
      res.status(500).json({ message: "Internal server error" });
    }
  });

  app.post("/api/auth/logout", (req, res) => {
    req.session.destroy((err: any) => {
      if (err) {
        return res.status(500).json({ message: "Could not log out" });
      }
      res.json({ message: "Logged out successfully" });
    });
  });

  app.get("/api/auth/user", isAuthenticated, (req: any, res) => {
    res.json(req.session.user);
  });

  // User management routes (staff management)
  app.get("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const users = await storage.getAllUsers();
      // Don't send passwords in the response
      const usersWithoutPasswords = users.map(user => {
        const { password, ...userWithoutPassword } = user;
        return userWithoutPassword;
      });
      res.json(usersWithoutPasswords);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ message: "Failed to fetch users" });
    }
  });

  app.post("/api/users", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const userData = insertUserSchema.parse(req.body);
      
      // Hash the password
      const hashedPassword = await bcrypt.hash(userData.password, 10);
      
      const user = await storage.createUser({
        ...userData,
        password: hashedPassword,
      });
      
      // Don't send password in the response
      const { password, ...userWithoutPassword } = user;
      res.status(201).json(userWithoutPassword);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Validation error", errors: error.errors });
      }
      console.error("Error creating user:", error);
      res.status(500).json({ message: "Failed to create user" });
    }
  });

  app.put("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      const userData = req.body;
      
      // If password is provided, hash it
      if (userData.password) {
        userData.password = await bcrypt.hash(userData.password, 10);
      } else {
        // Remove password field if empty (don't update it)
        delete userData.password;
      }
      
      const user = await storage.updateUser(id, userData);
      if (!user) {
        return res.status(404).json({ message: "User not found" });
      }
      
      // Don't send password in the response
      const { password, ...userWithoutPassword } = user;
      res.json(userWithoutPassword);
    } catch (error) {
      console.error("Error updating user:", error);
      res.status(500).json({ message: "Failed to update user" });
    }
  });

  app.delete("/api/users/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      if (isNaN(id)) {
        return res.status(400).json({ message: "Invalid user ID" });
      }

      // Prevent deleting your own account
      if (req.session.user && req.session.user.id === id) {
        return res.status(400).json({ message: "Cannot delete your own account" });
      }

      const success = await storage.deleteUser(id);
      if (!success) {
        return res.status(404).json({ message: "User not found" });
      }
      
      res.json({ message: "User deleted successfully" });
    } catch (error) {
      console.error("Error deleting user:", error);
      res.status(500).json({ message: "Failed to delete user" });
    }
  });

  // Client management routes
  app.get("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const clients = await storage.getAllClients();
      res.json(clients);
    } catch (error) {
      console.error("Error fetching clients:", error);
      res.status(500).json({ message: "Failed to fetch clients" });
    }
  });

  app.get("/api/clients/search", isAuthenticated, async (req, res) => {
    try {
      const { q } = req.query;
      if (!q || typeof q !== "string") {
        return res.status(400).json({ message: "Search query is required" });
      }
      
      const clients = await storage.searchClients(q);
      res.json(clients);
    } catch (error) {
      console.error("Error searching clients:", error);
      res.status(500).json({ message: "Failed to search clients" });
    }
  });

  app.get("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const client = await storage.getClient(id);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      console.error("Error fetching client:", error);
      res.status(500).json({ message: "Failed to fetch client" });
    }
  });

  app.post("/api/clients", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertClientSchema.parse(req.body);
      const client = await storage.createClient(validatedData);
      res.status(201).json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating client:", error);
      res.status(500).json({ message: "Failed to create client" });
    }
  });

  app.put("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertClientSchema.partial().parse(req.body);
      const client = await storage.updateClient(id, validatedData);
      if (!client) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json(client);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating client:", error);
      res.status(500).json({ message: "Failed to update client" });
    }
  });

  app.delete("/api/clients/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteClient(id);
      if (!success) {
        return res.status(404).json({ message: "Client not found" });
      }
      res.json({ message: "Client deleted successfully" });
    } catch (error) {
      console.error("Error deleting client:", error);
      res.status(500).json({ message: "Failed to delete client" });
    }
  });

  // Service management routes
  app.get("/api/services", isAuthenticated, async (req, res) => {
    try {
      const services = await storage.getAllServices();
      res.json(services);
    } catch (error) {
      console.error("Error fetching services:", error);
      res.status(500).json({ message: "Failed to fetch services" });
    }
  });

  app.post("/api/services", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertServiceSchema.parse(req.body);
      const service = await storage.createService(validatedData);
      res.status(201).json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating service:", error);
      res.status(500).json({ message: "Failed to create service" });
    }
  });

  app.put("/api/services/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertServiceSchema.partial().parse(req.body);
      const service = await storage.updateService(id, validatedData);
      if (!service) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json(service);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating service:", error);
      res.status(500).json({ message: "Failed to update service" });
    }
  });

  app.delete("/api/services/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteService(id);
      if (!success) {
        return res.status(404).json({ message: "Service not found" });
      }
      res.json({ message: "Service deleted successfully" });
    } catch (error) {
      console.error("Error deleting service:", error);
      res.status(500).json({ message: "Failed to delete service" });
    }
  });

  // Stylist management routes
  app.get("/api/stylists", isAuthenticated, async (req, res) => {
    try {
      const stylists = await storage.getAllStylists();
      res.json(stylists);
    } catch (error) {
      console.error("Error fetching stylists:", error);
      res.status(500).json({ message: "Failed to fetch stylists" });
    }
  });

  app.post("/api/stylists", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertStylistSchema.parse(req.body);
      const stylist = await storage.createStylist(validatedData);
      res.status(201).json(stylist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating stylist:", error);
      res.status(500).json({ message: "Failed to create stylist" });
    }
  });

  app.put("/api/stylists/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertStylistSchema.partial().parse(req.body);
      const stylist = await storage.updateStylist(id, validatedData);
      if (!stylist) {
        return res.status(404).json({ message: "Stylist not found" });
      }
      res.json(stylist);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating stylist:", error);
      res.status(500).json({ message: "Failed to update stylist" });
    }
  });

  app.delete("/api/stylists/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteStylist(id);
      if (!success) {
        return res.status(404).json({ message: "Stylist not found" });
      }
      res.json({ message: "Stylist deleted successfully" });
    } catch (error) {
      console.error("Error deleting stylist:", error);
      res.status(500).json({ message: "Failed to delete stylist" });
    }
  });

  // Appointment management routes
  app.get("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const { date, startDate, endDate, clientId, stylistId } = req.query;
      
      let appointments;
      
      if (date && typeof date === "string") {
        appointments = await storage.getAppointmentsByDate(date);
      } else if (startDate && endDate && typeof startDate === "string" && typeof endDate === "string") {
        appointments = await storage.getAppointmentsByDateRange(startDate, endDate);
      } else if (clientId && typeof clientId === "string") {
        appointments = await storage.getClientAppointments(parseInt(clientId));
      } else if (stylistId && typeof stylistId === "string") {
        const dateFilter = typeof date === "string" ? date : undefined;
        appointments = await storage.getStylistAppointments(parseInt(stylistId), dateFilter);
      } else {
        appointments = await storage.getAllAppointments();
      }
      
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching appointments:", error);
      res.status(500).json({ message: "Failed to fetch appointments" });
    }
  });

  // New route for suggested appointments from recurring reminders
  app.get("/api/appointments/suggested", isAuthenticated, async (req, res) => {
    try {
      const { date, startDate, endDate } = req.query;
      
      let suggestedAppointments = [];
      
      if (date && typeof date === "string") {
        suggestedAppointments = await storage.getSuggestedAppointmentsByDate(date);
      } else if (startDate && endDate && typeof startDate === "string" && typeof endDate === "string") {
        suggestedAppointments = await storage.getSuggestedAppointmentsByDateRange(startDate, endDate);
      }
      
      res.json(suggestedAppointments);
    } catch (error) {
      console.error("Error fetching suggested appointments:", error);
      res.status(500).json({ message: "Failed to fetch suggested appointments" });
    }
  });

  // Convert suggested appointment to real appointment
  app.post("/api/appointments/suggested/:id/confirm", isAuthenticated, async (req, res) => {
    try {
      const suggestedId = parseInt(req.params.id);
      const { date, startTime, endTime, notes } = req.body;
      
      const result = await storage.confirmSuggestedAppointment(suggestedId, { 
        date, 
        startTime, 
        endTime, 
        notes: notes || "" 
      });
      
      if (!result) {
        return res.status(404).json({ message: "Suggested appointment not found" });
      }
      
      res.status(201).json(result);
    } catch (error) {
      console.error("Error confirming suggested appointment:", error);
      res.status(500).json({ message: "Failed to confirm suggested appointment" });
    }
  });

  app.get("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const appointment = await storage.getAppointmentWithDetails(id);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      console.error("Error fetching appointment:", error);
      res.status(500).json({ message: "Failed to fetch appointment" });
    }
  });

  app.post("/api/appointments", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertAppointmentSchema.parse(req.body);
      const appointment = await storage.createAppointment(validatedData);
      res.status(201).json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating appointment:", error);
      res.status(500).json({ message: "Failed to create appointment" });
    }
  });

  app.put("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertAppointmentSchema.partial().parse(req.body);
      const appointment = await storage.updateAppointment(id, validatedData);
      if (!appointment) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json(appointment);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating appointment:", error);
      res.status(500).json({ message: "Failed to update appointment" });
    }
  });

  app.delete("/api/appointments/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteAppointment(id);
      if (!success) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json({ message: "Appointment deleted successfully" });
    } catch (error) {
      console.error("Error deleting appointment:", error);
      res.status(500).json({ message: "Failed to delete appointment" });
    }
  });

  // WhatsApp reminder routes
  app.get("/api/reminders/upcoming", isAuthenticated, async (req, res) => {
    try {
      const appointments = await storage.getUpcomingAppointments();
      res.json(appointments);
    } catch (error) {
      console.error("Error fetching upcoming appointments:", error);
      res.status(500).json({ message: "Failed to fetch upcoming appointments" });
    }
  });

  app.post("/api/reminders/:id/mark-sent", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.markReminderSent(id);
      if (!success) {
        return res.status(404).json({ message: "Appointment not found" });
      }
      res.json({ message: "Reminder marked as sent" });
    } catch (error) {
      console.error("Error marking reminder as sent:", error);
      res.status(500).json({ message: "Failed to mark reminder as sent" });
    }
  });

  // Message template routes
  app.get("/api/message-templates", isAuthenticated, async (req, res) => {
    try {
      const templates = await storage.getAllMessageTemplates();
      res.json(templates);
    } catch (error) {
      console.error("Error fetching message templates:", error);
      res.status(500).json({ message: "Failed to fetch message templates" });
    }
  });

  app.post("/api/message-templates", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const validatedData = insertMessageTemplateSchema.parse(req.body);
      const template = await storage.createMessageTemplate(validatedData);
      res.status(201).json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating message template:", error);
      res.status(500).json({ message: "Failed to create message template" });
    }
  });

  app.put("/api/message-templates/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertMessageTemplateSchema.partial().parse(req.body);
      const template = await storage.updateMessageTemplate(id, validatedData);
      if (!template) {
        return res.status(404).json({ message: "Message template not found" });
      }
      res.json(template);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating message template:", error);
      res.status(500).json({ message: "Failed to update message template" });
    }
  });

  app.delete("/api/message-templates/:id", isAuthenticated, isAdmin, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteMessageTemplate(id);
      if (!success) {
        return res.status(404).json({ message: "Message template not found" });
      }
      res.json({ message: "Message template deleted successfully" });
    } catch (error) {
      console.error("Error deleting message template:", error);
      res.status(500).json({ message: "Failed to delete message template" });
    }
  });

  // Dashboard statistics route
  app.get("/api/dashboard/stats", isAuthenticated, async (req, res) => {
    try {
      const today = new Date().toISOString().split('T')[0];
      const tomorrow = new Date();
      tomorrow.setDate(tomorrow.getDate() + 1);
      const tomorrowStr = tomorrow.toISOString().split('T')[0];

      const [
        totalClients,
        todayAppointments,
        tomorrowAppointments,
        totalServices,
        totalStylists
      ] = await Promise.all([
        storage.getAllClients().then(clients => clients.length),
        storage.getAppointmentsByDate(today).then(appointments => appointments.length),
        storage.getAppointmentsByDate(tomorrowStr).then(appointments => appointments.length),
        storage.getAllServices().then(services => services.length),
        storage.getAllStylists().then(stylists => stylists.length)
      ]);

      res.json({
        totalClients,
        todayAppointments,
        tomorrowAppointments,
        totalServices,
        totalStylists
      });
    } catch (error) {
      console.error("Error fetching dashboard stats:", error);
      res.status(500).json({ message: "Failed to fetch dashboard stats" });
    }
  });

  // TEMPORARY: Clean duplicate appointments
  app.post("/api/admin/clean-duplicates", isAuthenticated, async (req, res) => {
    try {
      console.log('🧹 Cleaning duplicate appointments...');
      
      // Get all appointments
      const allAppointments = await storage.getAllAppointments();
      console.log(`📊 Total appointments before cleanup: ${allAppointments.length}`);
      
      // Group by key fields to find duplicates
      const appointmentMap = new Map();
      const duplicates: Array<{key: string, appointments: any[]}> = [];
      
      allAppointments.forEach(appointment => {
        const key = `${appointment.date}-${appointment.startTime}-${appointment.clientId}-${appointment.stylistId}-${appointment.serviceId}`;
        
        if (appointmentMap.has(key)) {
          const existing = appointmentMap.get(key);
          if (!duplicates.find(d => d.key === key)) {
            duplicates.push({
              key,
              appointments: [existing, appointment]
            });
          } else {
            duplicates.find(d => d.key === key)?.appointments.push(appointment);
          }
        } else {
          appointmentMap.set(key, appointment);
        }
      });
      
      if (duplicates.length === 0) {
        return res.json({ message: "No duplicates found", deleted: 0 });
      }
      
      console.log(`❌ Found ${duplicates.length} groups of duplicates`);
      
      let totalDeleted = 0;
      
      // For each group of duplicates, keep the first one and delete the rest
      for (const group of duplicates) {
        const appointments = group.appointments;
        const keepAppointment = appointments[0]; // Keep the first (oldest) appointment
        const deleteAppointments = appointments.slice(1); // Delete the rest
        
        console.log(`🔄 Group: ${group.key} - Keep ID ${keepAppointment.id}, delete ${deleteAppointments.map(a => a.id).join(', ')}`);
        
        // Delete the duplicate appointments
        for (const deleteAppointment of deleteAppointments) {
          await storage.deleteAppointment(deleteAppointment.id);
          totalDeleted++;
        }
      }
      
      console.log(`✅ Cleanup completed! Deleted ${totalDeleted} duplicate appointments`);
      
      res.json({ 
        message: "Duplicates cleaned successfully", 
        deleted: totalDeleted,
        duplicateGroups: duplicates.length
      });
      
    } catch (error) {
      console.error("Error cleaning duplicates:", error);
      res.status(500).json({ message: "Failed to clean duplicates" });
    }
  });

  // Serve the cleanup page
  app.get("/admin/clean", (req, res) => {
    res.sendFile(path.join(process.cwd(), "clean-duplicates.html"));
  });

  // Simple GET endpoint to clean duplicates (for testing)
  app.get("/api/admin/clean-duplicates-simple", isAuthenticated, async (req, res) => {
    try {
      console.log('🧹 Simple cleanup starting...');
      
      const allAppointments = await storage.getAllAppointments();
      console.log(`📊 Total appointments: ${allAppointments.length}`);
      
      // Find duplicates
      const seen = new Set();
      const toDelete = [];
      
      for (const appointment of allAppointments) {
        const key = `${appointment.date}-${appointment.startTime}-${appointment.clientId}-${appointment.stylistId}-${appointment.serviceId}`;
        
        if (seen.has(key)) {
          toDelete.push(appointment.id);
          console.log(`❌ Duplicate found: ID ${appointment.id}`);
        } else {
          seen.add(key);
        }
      }
      
      console.log(`🗑️ Deleting ${toDelete.length} duplicates...`);
      
      // Delete duplicates
      for (const id of toDelete) {
        await storage.deleteAppointment(id);
        console.log(`🗑️ Deleted ID: ${id}`);
      }
      
      res.json({ 
        success: true,
        message: `Deleted ${toDelete.length} duplicates`,
        deleted: toDelete.length,
        total: allAppointments.length
      });
      
    } catch (error) {
      console.error("Error in simple cleanup:", error);
      res.status(500).json({ success: false, message: error instanceof Error ? error.message : "Unknown error" });
    }
  });

  // Recurring reminders routes
  app.get("/api/recurring-reminders", isAuthenticated, async (req, res) => {
    try {
      const reminders = await storage.getAllRecurringReminders();
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching recurring reminders:", error);
      res.status(500).json({ message: "Failed to fetch recurring reminders" });
    }
  });

  app.get("/api/recurring-reminders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const reminder = await storage.getRecurringReminder(id);
      if (!reminder) {
        return res.status(404).json({ message: "Recurring reminder not found" });
      }
      res.json(reminder);
    } catch (error) {
      console.error("Error fetching recurring reminder:", error);
      res.status(500).json({ message: "Failed to fetch recurring reminder" });
    }
  });

  app.get("/api/clients/:clientId/recurring-reminders", isAuthenticated, async (req, res) => {
    try {
      const clientId = parseInt(req.params.clientId);
      const reminders = await storage.getClientRecurringReminders(clientId);
      res.json(reminders);
    } catch (error) {
      console.error("Error fetching client recurring reminders:", error);
      res.status(500).json({ message: "Failed to fetch client recurring reminders" });
    }
  });

  app.post("/api/recurring-reminders", isAuthenticated, async (req, res) => {
    try {
      const validatedData = insertRecurringReminderSchema.parse(req.body);
      const reminder = await storage.createRecurringReminder(validatedData);
      res.status(201).json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error creating recurring reminder:", error);
      res.status(500).json({ message: "Failed to create recurring reminder" });
    }
  });

  app.put("/api/recurring-reminders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const validatedData = insertRecurringReminderSchema.partial().parse(req.body);
      const reminder = await storage.updateRecurringReminder(id, validatedData);
      if (!reminder) {
        return res.status(404).json({ message: "Recurring reminder not found" });
      }
      res.json(reminder);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ message: "Invalid data", errors: error.errors });
      }
      console.error("Error updating recurring reminder:", error);
      res.status(500).json({ message: "Failed to update recurring reminder" });
    }
  });

  app.delete("/api/recurring-reminders/:id", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const success = await storage.deleteRecurringReminder(id);
      if (!success) {
        return res.status(404).json({ message: "Recurring reminder not found" });
      }
      res.json({ message: "Recurring reminder deleted successfully" });
    } catch (error) {
      console.error("Error deleting recurring reminder:", error);
      res.status(500).json({ message: "Failed to delete recurring reminder" });
    }
  });

  // Get active reminders that need to be sent
  app.get("/api/recurring-reminders/active", isAuthenticated, async (req, res) => {
    try {
      const activeReminders = await storage.getActiveRecurringReminders();
      res.json(activeReminders);
    } catch (error) {
      console.error("Error fetching active recurring reminders:", error);
      res.status(500).json({ message: "Failed to fetch active recurring reminders" });
    }
  });

  // Update next reminder date after sending
  app.post("/api/recurring-reminders/:id/update-next-date", isAuthenticated, async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { nextDate } = req.body;
      const success = await storage.updateNextReminderDate(id, nextDate);
      if (!success) {
        return res.status(404).json({ message: "Recurring reminder not found" });
      }
      res.json({ message: "Next reminder date updated successfully" });
    } catch (error) {
      console.error("Error updating next reminder date:", error);
      res.status(500).json({ message: "Failed to update next reminder date" });
    }
  });

  // Recurring reminder service management routes
  app.get("/api/recurring-reminders/service/status", isAuthenticated, async (req, res) => {
    try {
      const { recurringReminderService } = await import("./services/recurring-reminder-service");
      const status = recurringReminderService.getStatus();
      res.json(status);
    } catch (error) {
      console.error("Error getting service status:", error);
      res.status(500).json({ message: "Failed to get service status" });
    }
  });

  app.post("/api/recurring-reminders/service/trigger", isAuthenticated, async (req, res) => {
    try {
      const { recurringReminderService } = await import("./services/recurring-reminder-service");
      await recurringReminderService.triggerCheck();
      res.json({ message: "Reminder check triggered successfully" });
    } catch (error) {
      console.error("Error triggering reminder check:", error);
      res.status(500).json({ message: "Failed to trigger reminder check" });
    }
  });

  // Opening hours settings - now supports per-day configuration
  app.get("/api/settings/hours", isAuthenticated, async (req, res) => {
    try {
      const hours = await storage.getOpeningHours();
      res.json(hours);
    } catch (error) {
      console.error("Error fetching opening hours:", error);
      res.status(500).json({ message: "Failed to fetch opening hours" });
    }
  });

  // Get hours for specific day
  app.get("/api/settings/hours/:day", isAuthenticated, async (req, res) => {
    try {
      const day = req.params.day.toLowerCase();
      const validDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      
      if (!validDays.includes(day)) {
        return res.status(400).json({ message: "Invalid day. Use: monday, tuesday, etc." });
      }
      
      const hours = await storage.getOpeningHoursForDay(day);
      res.json(hours);
    } catch (error) {
      console.error(`Error fetching opening hours for ${req.params.day}:`, error);
      res.status(500).json({ message: "Failed to fetch opening hours" });
    }
  });

  app.post("/api/settings/hours", isAuthenticated, async (req, res) => {
    try {
      const hours = req.body;
      
      // Validate that all days are provided
      const requiredDays = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
      for (const day of requiredDays) {
        if (!hours[day]) {
          return res.status(400).json({ message: `Missing hours for ${day}` });
        }
        
        const { openTime, closeTime, isOpen } = hours[day];
        
        if (isOpen && (!openTime || !closeTime)) {
          return res.status(400).json({ message: `Opening and closing times are required for ${day}` });
        }
        
        // Validate time format
        const timeRegex = /^([01]?[0-9]|2[0-3]):[0-5][0-9]$/;
        if (isOpen && (!timeRegex.test(openTime) || !timeRegex.test(closeTime))) {
          return res.status(400).json({ message: `Invalid time format for ${day}. Use HH:MM format` });
        }
      }
      
      const success = await storage.saveOpeningHours(hours);
      
      if (success) {
        res.json({ 
          message: "Opening hours saved successfully",
          hours
        });
      } else {
        res.status(500).json({ message: "Failed to save opening hours" });
      }
    } catch (error) {
      console.error("Error saving opening hours:", error);
      res.status(500).json({ message: "Failed to save opening hours" });
    }
  });

  // Health check endpoint for Docker
  app.get("/api/health", (req, res) => {
    res.status(200).json({ 
      status: "healthy", 
      timestamp: new Date().toISOString(),
      uptime: process.uptime(),
      environment: process.env.NODE_ENV || "development"
    });
  });

  // Database migration endpoint for Render
  app.post("/api/migrate", async (req, res) => {
    try {
      // Use the storage migration function
      const result = await storage.migrateRecurringReminders();
      res.json({ 
        success: true, 
        message: result.message,
        created: result.created
      });
    } catch (error) {
      console.error("Migration error:", error);
      res.status(500).json({ 
        success: false, 
        error: "Migration failed", 
        details: error instanceof Error ? error.message : "Unknown error" 
      });
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}