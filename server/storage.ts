import {
  type User,
  type InsertUser,
  type UpdateUser,
  type Property,
  type InsertProperty,
  type Message,
  type InsertMessage,
  type Conversation,
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

  // Chat methods
  createMessage(message: InsertMessage): Promise<Message>;
  getMessages(conversationId: number): Promise<Message[]>;
  getConversations(userId: number): Promise<(Conversation & { otherUser: User })[]>;
  updateConversation(user1Id: number, user2Id: number): Promise<void>;
  markMessagesAsRead(senderId: number, receiverId: number): Promise<void>;

  sessionStore: session.Store;
}

export class MemStorage implements IStorage {
  private users: Map<number, User>;
  private properties: Map<number, Property>;
  private messages: Map<number, Message>;
  private conversations: Map<number, Conversation>;
  private currentUserId: number;
  private currentPropertyId: number;
  private currentMessageId: number;
  private currentConversationId: number;
  public sessionStore: session.Store;

  constructor() {
    this.users = new Map();
    this.properties = new Map();
    this.messages = new Map();
    this.conversations = new Map();
    this.currentUserId = 1;
    this.currentPropertyId = 1;
    this.currentMessageId = 1;
    this.currentConversationId = 1;
    this.sessionStore = new MemoryStore({
      checkPeriod: 86400000 // prune expired entries every 24h
    });

    // Add some sample properties
    this.seedProperties();
  }

  private seedProperties() {
    const sampleProperties: InsertProperty[] = [
      {
        title: "Modern Almalq Apartment",
        description: "Beautiful modern apartment in the prestigious Almalq district",
        price: 500000,
        location: "Almalq",
        bedrooms: 2,
        bathrooms: 2,
        area: 1200,
        type: "apartment",
        features: ["parking", "gym", "pool"],
        images: ["https://placehold.co/600x400"],
        userId: 1
      },
      {
        title: "Spacious Almoroj Villa",
        description: "Elegant family villa in the quiet Almoroj neighborhood",
        price: 750000,
        location: "Almoroj",
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

  async createMessage(insertMessage: InsertMessage): Promise<Message> {
    const id = this.currentMessageId++;
    const message: Message = {
      ...insertMessage,
      id,
      createdAt: new Date(),
    };
    this.messages.set(id, message);
    return message;
  }

  async getMessages(conversationId: number): Promise<Message[]> {
    const conversation = this.conversations.get(conversationId);
    if (!conversation) return [];

    return Array.from(this.messages.values()).filter(
      (message) =>
        (message.senderId === conversation.user1Id && message.receiverId === conversation.user2Id) ||
        (message.senderId === conversation.user2Id && message.receiverId === conversation.user1Id)
    ).sort((a, b) => a.createdAt.getTime() - b.createdAt.getTime());
  }

  async getConversations(userId: number): Promise<(Conversation & { otherUser: User })[]> {
    const conversations = Array.from(this.conversations.values())
      .filter((conv) => conv.user1Id === userId || conv.user2Id === userId)
      .map((conv) => {
        const otherUserId = conv.user1Id === userId ? conv.user2Id : conv.user1Id;
        const otherUser = this.users.get(otherUserId);
        return {
          ...conv,
          otherUser: otherUser!,
        };
      })
      .sort((a, b) => b.lastMessageAt.getTime() - a.lastMessageAt.getTime());

    return conversations;
  }

  async updateConversation(user1Id: number, user2Id: number): Promise<void> {
    const existingConversation = Array.from(this.conversations.values()).find(
      (conv) =>
        (conv.user1Id === user1Id && conv.user2Id === user2Id) ||
        (conv.user1Id === user2Id && conv.user2Id === user1Id)
    );

    if (existingConversation) {
      existingConversation.lastMessageAt = new Date();
      this.conversations.set(existingConversation.id, existingConversation);
    } else {
      const id = this.currentConversationId++;
      this.conversations.set(id, {
        id,
        user1Id,
        user2Id,
        lastMessageAt: new Date(),
      });
    }
  }

  async markMessagesAsRead(senderId: number, receiverId: number): Promise<void> {
    for (const [id, message] of this.messages) {
      if (message.senderId === senderId && message.receiverId === receiverId) {
        message.isRead = true;
        this.messages.set(id, message);
      }
    }
  }
}

export const storage = new MemStorage();