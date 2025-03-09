import type { Express } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertPropertySchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./websocket";
import { getAuth as getAdminAuth } from "firebase-admin/auth";

export async function registerRoutes(app: Express) {
  // Set up authentication routes
  setupAuth(app);

  // Admin endpoints
  app.post("/api/admin/delete-user", async (req, res) => {
    console.log("Received delete user request");

    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      console.log("Unauthorized delete attempt", {
        isAuthenticated: req.isAuthenticated(),
        user: req.user,
        isAdmin: req.user?.isAdmin
      });
      return res.status(403).json({ message: "Not authorized" });
    }

    try {
      const { userId } = req.body;
      if (!userId) {
        return res.status(400).json({ message: "User ID is required" });
      }

      console.log(`Attempting to delete user with ID: ${userId}`);

      // Delete user from Firebase Auth
      await getAdminAuth().deleteUser(userId);
      console.log(`Successfully deleted user ${userId} from Firebase Auth`);

      res.status(200).json({ message: "User deleted successfully" });
    } catch (error: any) {
      console.error("Error deleting user:", error);
      console.error("Error code:", error.code);
      console.error("Error message:", error.message);

      let errorMessage = "Failed to delete user";
      if (error.code === 'auth/invalid-credential') {
        errorMessage = "Invalid admin credentials. Please check Firebase Admin configuration.";
      } else if (error.code === 'auth/user-not-found') {
        errorMessage = "User not found in Firebase Authentication.";
      }

      res.status(500).json({ 
        message: errorMessage,
        error: error.message,
        code: error.code 
      });
    }
  });

  // Properties endpoints
  app.get("/api/properties", async (req, res) => {
    const properties = await storage.getAllProperties();
    res.json(properties);
  });

  app.get("/api/properties/featured", async (req, res) => {
    const properties = await storage.getFeaturedProperties();
    res.json(properties);
  });

  app.get("/api/properties/:id", async (req, res) => {
    const id = parseInt(req.params.id);
    const property = await storage.getProperty(id);
    if (!property) {
      res.status(404).json({ message: "Property not found" });
      return;
    }
    res.json(property);
  });

  app.post("/api/properties", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const property = insertPropertySchema.parse(req.body);
      const created = await storage.createProperty(property);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid property data" });
        return;
      }
      throw error;
    }
  });

  // Admin routes for property approval
  app.post("/api/properties/:id/approve", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    try {
      const id = parseInt(req.params.id);
      const property = await storage.approveProperty(id);
      res.json(property);
    } catch (error: any) {
      console.error("Error approving property:", error);
      res.status(400).json({ message: error.message });
    }
  });

  app.post("/api/properties/:id/reject", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    try {
      const id = parseInt(req.params.id);
      const { note } = req.body;
      if (!note) {
        return res.status(400).json({ message: "Rejection note is required" });
      }
      const property = await storage.rejectProperty(id, note);
      res.json(property);
    } catch (error: any) {
      console.error("Error rejecting property:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Route for property deletion
  app.delete("/api/properties/:id", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    try {
      const id = parseInt(req.params.id);
      await storage.deleteProperty(id, req.user.id);
      res.sendStatus(200);
    } catch (error: any) {
      console.error("Error deleting property:", error);
      res.status(400).json({ message: error.message });
    }
  });

  // Route to get pending properties for admin
  app.get("/api/properties/pending", async (req, res) => {
    if (!req.isAuthenticated() || !req.user?.isAdmin) {
      return res.status(403).json({ message: "Not authorized" });
    }

    try {
      const properties = await storage.getPendingProperties();
      res.json(properties);
    } catch (error: any) {
      console.error("Error fetching pending properties:", error);
      res.status(500).json({ message: error.message });
    }
  });

  // Chat endpoints
  app.get("/api/conversations", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const conversations = await storage.getConversations(req.user.id);
    res.json(conversations);
  });

  app.get("/api/messages/:conversationId", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const conversationId = parseInt(req.params.conversationId);
    const messages = await storage.getMessages(conversationId);
    res.json(messages);
  });

  app.post("/api/messages/read", async (req, res) => {
    if (!req.isAuthenticated()) {
      return res.status(401).json({ message: "Not authenticated" });
    }

    const { senderId } = req.body;
    await storage.markMessagesAsRead(senderId, req.user.id);
    res.sendStatus(200);
  });

  const httpServer = createServer(app);

  // Set up WebSocket server
  const wss = new WebSocketServer({ server: httpServer, path: '/ws' });
  setupWebSocket(wss);

  return httpServer;
}