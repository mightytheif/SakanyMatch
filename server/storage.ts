import {
  type User,
  type InsertUser,
  type Property,
  type InsertProperty,
} from "@shared/schema";

export interface IStorage {
  createUser(user: InsertUser): Promise<User>;
  getUser(id: number): Promise<User | undefined>;
  getUserByUsername(username: string): Promise<User | undefined>;
  createProperty(property: InsertProperty): Promise<Property>;
  getProperty(id: number): Promise<Property | undefined>;
  getAllProperties(): Promise<Property[]>;
  getFeaturedProperties(): Promise<Property[]>;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private currentUserId: number;
  private currentPropertyId: number;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.currentUserId = 1;
    this.currentPropertyId = 1;
    
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
    const user: User = { ...insertUser, id };
    this.users.set(id, user);
    return user;
  }

  async getUser(id: number): Promise<User | undefined> {
    return this.users.get(id);
  }

  async getUserByUsername(username: string): Promise<User | undefined> {
    return Array.from(this.users.values()).find(
      (user) => user.username === username
    );
  }

  async createProperty(insertProperty: InsertProperty): Promise<Property> {
    const id = this.currentPropertyId++;
    const property: Property = {
      ...insertProperty,
      id,
      createdAt: new Date()
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
