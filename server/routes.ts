import type { Express } from "express";
import { createServer } from "http";
import { WebSocketServer } from "ws";
import { storage } from "./storage";
import { insertPropertySchema } from "@shared/schema";
import { z } from "zod";
import { setupAuth } from "./auth";
import { setupWebSocket } from "./websocket";

export async function registerRoutes(app: Express) {
  // Set up authentication routes
  setupAuth(app);

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

  // Protected route example
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