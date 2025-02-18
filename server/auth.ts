import passport from "passport";
import { Strategy as LocalStrategy } from "passport-local";
import { Express, Request, Response, NextFunction } from "express";
import session from "express-session";
import { scrypt, randomBytes, timingSafeEqual } from "crypto";
import { promisify } from "util";
import { storage } from "./storage";
import { User as SelectUser, updateUserSchema } from "@shared/schema";
import { z } from "zod";

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

function generateResetToken() {
  return randomBytes(32).toString("hex");
}

function isAdmin(req: Request, res: Response, next: NextFunction) {
  if (!req.isAuthenticated() || !req.user.isAdmin) {
    res.status(403).json({ message: "Unauthorized" });
    return;
  }
  next();
}

export function setupAuth(app: Express) {
  const sessionSettings: session.SessionOptions = {
    secret: "sakany-secret-key",
    resave: false,
    saveUninitialized: false,
    store: storage.sessionStore,
    cookie: {
      maxAge: 24 * 60 * 60 * 1000 // 24 hours
    }
  };

  app.use(session(sessionSettings));
  app.use(passport.initialize());
  app.use(passport.session());

  passport.use(
    new LocalStrategy({ usernameField: 'email' }, async (email, password, done) => {
      try {
        const user = await storage.getUserByEmail(email);
        if (!user || !(await comparePasswords(password, user.password))) {
          return done(null, false, { message: "Invalid email or password" });
        }

        // Update last login time
        await storage.updateUser(user.id, { lastLoginAt: new Date() } as any);

        return done(null, user);
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

  // Register new user
  app.post("/api/register", async (req, res, next) => {
    try {
      const existingUser = await storage.getUserByEmail(req.body.email);
      if (existingUser) {
        return res.status(400).json({ message: "Email already registered" });
      }

      const hashedPassword = await hashPassword(req.body.password);
      const user = await storage.createUser({
        ...req.body,
        password: hashedPassword,
      });

      req.login(user, (err) => {
        if (err) return next(err);
        res.status(201).json(user);
      });
    } catch (error) {
      next(error);
    }
  });

  // Login
  app.post("/api/login", (req, res, next) => {
    passport.authenticate("local", (err: Error | null, user: Express.User | false, info: { message: string } | undefined) => {
      if (err) return next(err);
      if (!user) {
        return res.status(401).json({ message: info?.message || "Authentication failed" });
      }
      req.login(user, (err) => {
        if (err) return next(err);
        res.json(user);
      });
    })(req, res, next);
  });

  // Logout
  app.post("/api/logout", (req, res, next) => {
    req.logout((err) => {
      if (err) return next(err);
      res.sendStatus(200);
    });
  });

  // Get current user
  app.get("/api/user", (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);
    res.json(req.user);
  });

  // Delete user profile
  app.delete("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      await storage.deleteUser(req.user.id);
      req.logout((err) => {
        if (err) throw err;
        res.sendStatus(200);
      });
    } catch (error) {
      res.status(500).json({ message: "Error deleting profile" });
    }
  });

  // Update user profile
  app.patch("/api/user/profile", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const data = updateUserSchema.parse(req.body);

      // If changing password, verify current password first
      if (data.password) {
        const user = await storage.getUser(req.user.id);
        if (!user || !(await comparePasswords(req.body.currentPassword, user.password))) {
          return res.status(400).json({ message: "Current password is incorrect" });
        }
        data.password = await hashPassword(data.password);
      }

      const updatedUser = await storage.updateUser(req.user.id, data);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data" });
        return;
      }
      res.status(500).json({ message: "Error updating profile" });
    }
  });


  // Request password reset
  app.post("/api/forgot-password", async (req, res) => {
    try {
      const email = req.body.email;
      const user = await storage.getUserByEmail(email);

      if (user) {
        const resetToken = generateResetToken();
        const expires = new Date(Date.now() + 3600000); // 1 hour
        await storage.setPasswordResetToken(email, resetToken, expires);

        // In a real application, send this token via email
        res.json({ message: "Password reset instructions sent to your email" });
      } else {
        // Don't reveal user existence
        res.json({ message: "If an account exists, password reset instructions will be sent" });
      }
    } catch (error) {
      res.status(500).json({ message: "Error processing request" });
    }
  });

  // Reset password
  app.post("/api/reset-password", async (req, res) => {
    try {
      const { token, password } = req.body;
      const user = await storage.getUserByPasswordResetToken(token);

      if (!user) {
        return res.status(400).json({ message: "Invalid or expired reset token" });
      }

      const hashedPassword = await hashPassword(password);
      await storage.updateUser(user.id, {
        password: hashedPassword,
      });

      await storage.setPasswordResetToken(user.email, "", new Date(0));
      res.json({ message: "Password updated successfully" });
    } catch (error) {
      res.status(500).json({ message: "Error resetting password" });
    }
  });

  // Enable/disable 2FA
  app.post("/api/user/2fa", async (req, res) => {
    if (!req.isAuthenticated()) return res.sendStatus(401);

    try {
      const { enabled } = req.body;
      let secret = null;

      if (enabled) {
        secret = randomBytes(20).toString("hex");
        await storage.updateTwoFactorSecret(req.user.id, secret);
      }

      await storage.updateUser(req.user.id, { 
        twoFactorEnabled: enabled,
      });

      res.json({ message: "2FA settings updated" });
    } catch (error) {
      res.status(500).json({ message: "Error updating 2FA settings" });
    }
  });

  // Admin routes
  app.get("/api/admin/users", isAdmin, async (_req, res) => {
    const users = Array.from(storage.users.values());
    res.json(users);
  });

  app.patch("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      const data = updateUserSchema.parse(req.body);

      if (data.password) {
        data.password = await hashPassword(data.password);
      }

      const updatedUser = await storage.updateUser(userId, data);
      res.json(updatedUser);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid data" });
        return;
      }
      throw error;
    }
  });

  app.delete("/api/admin/users/:id", isAdmin, async (req, res) => {
    try {
      const userId = parseInt(req.params.id);
      await storage.deleteUser(userId);
      res.sendStatus(204);
    } catch (error) {
      res.status(500).json({ message: "Error deleting user" });
    }
  });
}