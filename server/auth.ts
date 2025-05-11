import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser } from "@shared/schema";
import crypto from "crypto";

declare global {
  namespace Express {
    interface User extends SelectUser {}
  }
}

const scryptAsync = promisify(scrypt);

async function hashPassword(password: string) {
  const salt = randomBytes(16).toString("hex");
  const buf = (await scryptAsync(password, salt, 64)) as Buffer;
  return `${buf.toString("hex")}.${salt}`;
}

async function comparePasswords(supplied: string, stored: string) {
  const [hashed, salt] = stored.split(".");
  const hashedBuf = Buffer.from(hashed, "hex");
  const suppliedBuf = (await scryptAsync(supplied, salt, 64)) as Buffer;
  return timingSafeEqual(hashedBuf, suppliedBuf);
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: process.env.SESSION_SECRET || crypto.randomBytes(32).toString('hex'),
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 1000 * 60 * 60 * 24 * 7, // 7 days
      httpOnly: true,
      sameSite: 'lax',
    }
  };

  app.set("trust proxy", 1);
  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy(async (username, password, done) => {
      try {
        const user = await storage.getUserByUsername(username);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false);
        } else {
          // Update last login time
          if (user.id) {
            await storage.updateUser(user.id, { lastLogin: new Date() });
          }
          return done(null, user);
        }
      } catch (error) {
        return done(error);
      }
    }),
  );

  passport.serializeUser((user, done) => done(null, user.id));
  passport.deserializeUser(async (id: number, done) => {
    try {
      const user = await storage.getUser(id);
      done(null, user);
    } catch (error) {
      done(error);
    }
  });

  // Authentication routes
  app.post("/api/auth/login", passport.authenticate("local"), (req, res) => {
    res.status(200).json(req.user);
  });

  app.post("/api/auth/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      req.session.destroy((err) => {
        if (err) return next(err);
        res.clearCookie('connect.sid');
        res.sendStatus(200);
      });
    });
  });

  app.get("/api/auth/me", (req, res) => {
    if (req.isAuthenticated()) {
      res.json(req.user);
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  // Middleware per proteggere le route
  app.use("/api/schedules", (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  app.use("/api/shifts", (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  app.use("/api/time-off-requests", (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  app.use("/api/documents", (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  app.use("/api/notifications", (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  app.use("/api/messages", (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });

  app.use("/api/users", (req, res, next) => {
    if (req.isAuthenticated()) {
      next();
    } else {
      res.status(401).json({ message: "Unauthorized" });
    }
  });
}