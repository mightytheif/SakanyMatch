import type { Express } from "express";
import { createServer } from "http";
import { storage } from "./storage";
import { insertPropertySchema, insertUserSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express) {
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

  // Users endpoints
  app.post("/api/users", async (req, res) => {
    try {
      const user = insertUserSchema.parse(req.body);
      const created = await storage.createUser(user);
      res.status(201).json(created);
    } catch (error) {
      if (error instanceof z.ZodError) {
        res.status(400).json({ message: "Invalid user data" });
        return;
      }
      throw error;
    }
  });

  const httpServer = createServer(app);
  return httpServer;
}
