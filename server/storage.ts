import type { 
  InsertCostAnalysis, 
  CostAnalysis, 
  UpsertUser, 
  User,
  InsertCloudCredential,
  CloudCredential,
  InsertInventoryScan,
  InventoryScan
} from "@shared/schema";
import { 
  users, 
  costAnalyses, 
  cloudCredentials, 
  inventoryScans 
} from "@shared/schema";
import { db } from "./db.js";
import { eq, and } from "drizzle-orm";
import { encryptSync, decryptSync } from "./encryption.js";

export interface IStorage {
  // User operations
  getUser(id: string): Promise<User | undefined>;
  getUserByEmail(email: string): Promise<User | undefined>;
  createUser(user: UpsertUser): Promise<User>;
  upsertUser(user: UpsertUser): Promise<User>;
  
  // Cost analysis operations
  createCostAnalysis(analysis: InsertCostAnalysis, userId?: string): Promise<CostAnalysis>;
  getCostAnalysis(id: string): Promise<CostAnalysis | undefined>;
  getAllCostAnalyses(userId?: string): Promise<CostAnalysis[]>;
  
  // Cloud credentials operations
  createCloudCredential(credential: InsertCloudCredential, userId: string): Promise<CloudCredential>;
  getUserCloudCredentials(userId: string): Promise<CloudCredential[]>;
  updateCloudCredential(id: string, updates: Partial<InsertCloudCredential>): Promise<CloudCredential | undefined>;
  deleteCloudCredential(id: string): Promise<boolean>;
  
  // Inventory scan operations
  createInventoryScan(scan: InsertInventoryScan, userId: string): Promise<InventoryScan>;
  getUserInventoryScans(userId: string): Promise<InventoryScan[]>;
  getInventoryScan(id: string): Promise<InventoryScan | undefined>;
}

export class DatabaseStorage implements IStorage {
  // User operations
  async getUser(id: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.id, id));
    return user;
  }

  async getUserByEmail(email: string): Promise<User | undefined> {
    const [user] = await db.select().from(users).where(eq(users.email, email));
    return user;
  }

  async createUser(userData: UpsertUser): Promise<User> {
    const [user] = await db.insert(users).values(userData).returning();
    return user;
  }

  async upsertUser(userData: UpsertUser): Promise<User> {
    const [user] = await db
      .insert(users)
      .values(userData)
      .onConflictDoUpdate({
        target: users.id,
        set: {
          ...userData,
          updatedAt: new Date(),
        },
      })
      .returning();
    return user;
  }

  // Cost analysis operations
  async createCostAnalysis(analysis: InsertCostAnalysis, userId?: string): Promise<CostAnalysis> {
    const [newAnalysis] = await db
      .insert(costAnalyses)
      .values({ ...analysis, userId })
      .returning();
    return newAnalysis;
  }

  async getCostAnalysis(id: string): Promise<CostAnalysis | undefined> {
    const [analysis] = await db.select().from(costAnalyses).where(eq(costAnalyses.id, id));
    return analysis;
  }

  async getAllCostAnalyses(userId?: string): Promise<CostAnalysis[]> {
    if (userId) {
      return await db.select().from(costAnalyses).where(eq(costAnalyses.userId, userId));
    }
    return await db.select().from(costAnalyses);
  }

  // Cloud credentials operations (with encryption)
  async createCloudCredential(credential: InsertCloudCredential, userId: string): Promise<CloudCredential> {
    const encryptedCredentials = encryptSync(credential.encryptedCredentials);
    const [newCredential] = await db
      .insert(cloudCredentials)
      .values({ 
        ...credential, 
        userId, 
        encryptedCredentials 
      })
      .returning();
    
    // Return decrypted version for immediate use
    return {
      ...newCredential,
      encryptedCredentials: credential.encryptedCredentials
    };
  }

  async getUserCloudCredentials(userId: string): Promise<CloudCredential[]> {
    const credentials = await db
      .select()
      .from(cloudCredentials)
      .where(eq(cloudCredentials.userId, userId));
    
    // Decrypt credentials before returning
    return credentials.map(cred => ({
      ...cred,
      encryptedCredentials: decryptSync(cred.encryptedCredentials)
    }));
  }

  async getCloudCredential(id: string, userId: string): Promise<CloudCredential | undefined> {
    const [credential] = await db
      .select()
      .from(cloudCredentials)
      .where(and(eq(cloudCredentials.id, id), eq(cloudCredentials.userId, userId)));
    
    if (!credential) {
      return undefined;
    }
    
    // Decrypt credentials before returning
    return {
      ...credential,
      encryptedCredentials: decryptSync(credential.encryptedCredentials)
    };
  }

  async updateCredentialValidation(id: string, userId: string, isValidated: boolean): Promise<void> {
    await db
      .update(cloudCredentials)
      .set({ isValidated })
      .where(and(eq(cloudCredentials.id, id), eq(cloudCredentials.userId, userId)));
  }

  async updateCloudCredential(id: string, updates: Partial<InsertCloudCredential>): Promise<CloudCredential | undefined> {
    const updateData = { ...updates };
    if (updates.encryptedCredentials) {
      updateData.encryptedCredentials = encryptSync(updates.encryptedCredentials);
    }

    const [updatedCredential] = await db
      .update(cloudCredentials)
      .set({ ...updateData, updatedAt: new Date() })
      .where(eq(cloudCredentials.id, id))
      .returning();
    
    if (updatedCredential && updatedCredential.encryptedCredentials) {
      return {
        ...updatedCredential,
        encryptedCredentials: decryptSync(updatedCredential.encryptedCredentials)
      };
    }
    return updatedCredential;
  }

  async deleteCloudCredential(id: string): Promise<boolean> {
    const result = await db.delete(cloudCredentials).where(eq(cloudCredentials.id, id));
    return result.rowCount !== null && result.rowCount > 0;
  }

  // Inventory scan operations
  async createInventoryScan(scan: InsertInventoryScan, userId: string): Promise<InventoryScan> {
    const [newScan] = await db
      .insert(inventoryScans)
      .values({ ...scan, userId })
      .returning();
    return newScan;
  }

  async getUserInventoryScans(userId: string): Promise<InventoryScan[]> {
    return await db
      .select()
      .from(inventoryScans)
      .where(eq(inventoryScans.userId, userId))
      .orderBy(inventoryScans.createdAt);
  }

  async getInventoryScan(id: string): Promise<InventoryScan | undefined> {
    const [scan] = await db.select().from(inventoryScans).where(eq(inventoryScans.id, id));
    return scan;
  }
}

export const storage = new DatabaseStorage();