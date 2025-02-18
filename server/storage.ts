import {
  type User,
  type InsertUser,
  type UpdateUser,
  type Property,
  type InsertProperty,
} from "@shared/schema";
import session from "express-session";
import createMemoryStore from "memorystore";

const MemoryStore = createMemoryStore(session);

export interface IStorage {
  // User management
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  updateUser(id: number, data: UpdateUser): Promise<User>;
  deleteUser(id: number): Promise<void>;
  setPasswordResetToken(email: string, token: string, expires: Date): Promise<void>;
  getUserByPasswordResetToken(token: string): Promise<User | undefined>;
  updateTwoFactorSecret(userId: number, secret: string): Promise<void>;

  // Property management
  createProperty(property: InsertProperty): Promise<Property>;
  getProperty(id: number): Promise<Property | undefined>;
  getAllProperties(): Promise<Property[]>;
  getFeaturedProperties(): Promise<Property[]>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private currentUserId: number;
  private currentPropertyId: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Add some sample properties
    this.seedProperties();
  }

  private seedProperties() {
    const sampleProperties: InsertProperty[] = [
      {
        title: "Modern Downtown Apartment",
        description: "Beautiful modern apartment in the heart of downtown",
        price: 500000,
        location: "Downtown",
        bedrooms: 2,
        bathrooms: 2,
        area: 1200,
        type: "apartment",
        features: ["parking", "gym", "pool"],
        images: ["https://placehold.co/600x400"],
        userId: 1
      },
      {
        title: "Suburban Family Home",
        description: "Spacious family home in a quiet neighborhood",
        price: 750000,
        location: "Suburbs",
        bedrooms: 4,
        bathrooms: 3,
        area: 2500,
        type: "house",
        features: ["garage", "garden", "fireplace"],
        images: ["https://placehold.co/600x400"],
        userId: 1
      }
    ];

    sampleProperties.forEach(prop => this.createProperty(prop));
  }

  async createUser(insertUser: InsertUser): Promise<User> {
    const id = this.currentUserId++;
    const user: User = { 
      ...insertUser, 
      id,
      isAdmin: false,
      twoFactorEnabled: false,
      twoFactorSecret: null,
      passwordResetToken: null,
      passwordResetExpires: null,
      lastLoginAt: new Date(),
      createdAt: new Date(),
      updatedAt: new Date(),
      preferences: null 
    };
    this.users.set(id, user);
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.email === email
    );
  }

  async updateUser(id: number, data: UpdateUser): Promise<User> {
    const user = await this.getUser(id);
    if (!user) throw new Error("User not found");

    const updatedUser = {
      ...user,
      ...data,
      updatedAt: new Date(),
    };
    this.users.set(id, updatedUser);
    return updatedUser;
  }

  async deleteUser(id: number): Promise<void> {
    this.users.delete(id);
  }

  async setPasswordResetToken(email: string, token: string, expires: Date): Promise<void> {
    const user = await this.getUserByEmail(email);
    if (!user) throw new Error("User not found");

    const updatedUser = {
      ...user,
      passwordResetToken: token,
      passwordResetExpires: expires,
      updatedAt: new Date(),
    };
    this.users.set(user.id, updatedUser);
  }

  async getUserByPasswordResetToken(token: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.passwordResetToken === token && 
                user.passwordResetExpires && 
                user.passwordResetExpires > new Date()
    );
  }

  async updateTwoFactorSecret(userId: number, secret: string): Promise<void> {
    const user = await this.getUser(userId);
    if (!user) throw new Error("User not found");

    const updatedUser = {
      ...user,
      twoFactorSecret: secret,
      updatedAt: new Date(),
    };
    this.users.set(userId, updatedUser);
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.currentPropertyId++;
    const property: Property = {
      ...insertProperty,
      id,
      createdAt: new Date(),
      features: insertProperty.features ?? [],
      images: insertProperty.images ?? [],
    };
    this.properties.set(id, property);
    return property;
  }

  async getProperty(id: number): Promise<Property | undefined> {
    return this.properties.get(id);
  }

  async getAllProperties(): Promise<Property[]> {
    return Array.from(this.properties.values());
  }

  async getFeaturedProperties(): Promise<Property[]> {
    return Array.from(this.properties.values()).slice(0, 3);
  }
}

export const storage = new MemStorage();