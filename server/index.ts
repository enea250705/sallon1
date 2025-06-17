import "dotenv/config";
import express, { type Request, Response, NextFunction } from "express";
import { registerRoutes } from "./routes";
import { setupVite, serveStatic, log } from "./vite";
import { reminderScheduler } from "./services/reminderScheduler";
import { recurringReminderService } from "./services/recurring-reminder-service";
import session from "express-session";

// Extend session data type
declare module "express-session" {
  interface SessionData {
    user: {
      id: number;
      username: string;
      firstName: string;
      lastName: string;
      email: string | null;
      role: string;
    };
  }
}

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

app.use((req, res, next) => {
  const start = Date.now();
  const path = req.path;
  let capturedJsonResponse: Record<string, any> | undefined = undefined;

  const originalResJson = res.json;
  res.json = function (bodyJson, ...args) {
    capturedJsonResponse = bodyJson;
    return originalResJson.apply(res, [bodyJson, ...args]);
  };

  res.on("finish", () => {
    const duration = Date.now() - start;
    if (path.startsWith("/api")) {
      let logLine = `${req.method} ${path} ${res.statusCode} in ${duration}ms`;
      if (capturedJsonResponse) {
        logLine += ` :: ${JSON.stringify(capturedJsonResponse)}`;
      }

      if (logLine.length > 80) {
        logLine = logLine.slice(0, 79) + "…";
      }

      log(logLine);
    }
  });

  next();
});

(async () => {
  const server = await registerRoutes(app);

  app.use((err: any, _req: Request, res: Response, _next: NextFunction) => {
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";

    res.status(status).json({ message });
    throw err;
  });

  // importantly only setup vite in development and after
  // setting up all the other routes so the catch-all route
  // doesn't interfere with the other routes
  if (app.get("env") === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  // Use PORT environment variable or default to 5000
  const port = parseInt(process.env.PORT || "5000");
  
  // Start WhatsApp reminder scheduler
  reminderScheduler.startScheduler();
  
  // Start recurring reminder service
  console.log("🔔 Initializing recurring reminder service...");
  // The service starts automatically in its constructor

  // Bind to 0.0.0.0 for Render deployment
  const host = process.env.NODE_ENV === "production" ? "0.0.0.0" : "localhost";
  
  const serverInstance = server.listen(port, host, () => {
    log(`🚀 Server running on ${host}:${port}`);
    console.log(`🌐 Environment: ${process.env.NODE_ENV || "development"}`);
    console.log(`📡 Health check: http://${host}:${port}/api/health`);
  });

  // Configure server timeouts to prevent 502 Bad Gateway on Render
  if (process.env.NODE_ENV === "production") {
    // Set keepAliveTimeout to 120 seconds (120000ms)
    serverInstance.keepAliveTimeout = 120000;
    // Set headersTimeout to be higher than keepAliveTimeout
    serverInstance.headersTimeout = 120000 + 1000;
    
    console.log("⚙️ Production timeouts configured:");
    console.log(`   - keepAliveTimeout: ${serverInstance.keepAliveTimeout}ms`);
    console.log(`   - headersTimeout: ${serverInstance.headersTimeout}ms`);
  }

  // Graceful shutdown handling to prevent abrupt termination
  const gracefulShutdown = (signal: string) => {
    console.log(`\n🛑 Received ${signal}. Starting graceful shutdown...`);
    
    serverInstance.close((err) => {
      if (err) {
        console.error("❌ Error during server shutdown:", err);
        process.exit(1);
      }
      
      console.log("✅ Server closed gracefully");
      process.exit(0);
    });

    // Force close after 30 seconds
    setTimeout(() => {
      console.log("⚠️ Force closing server after timeout");
      process.exit(1);
    }, 30000);
  };

  // Handle process termination signals
  process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
  process.on('SIGINT', () => gracefulShutdown('SIGINT'));

  // Handle uncaught exceptions to prevent crashes
  process.on('uncaughtException', (error) => {
    console.error('❌ Uncaught Exception:', error);
    gracefulShutdown('uncaughtException');
  });

  process.on('unhandledRejection', (reason, promise) => {
    console.error('❌ Unhandled Promise Rejection:', reason);
    console.error('Promise:', promise);
    gracefulShutdown('unhandledRejection');
  });
})();
