import { requests, type Request, type InsertRequest } from "@shared/schema";
import { db } from "./db";
import { eq, and, like, gte, lte, or } from "drizzle-orm";

export interface IStorage {
  getRequests(filters?: {
    estado?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    busqueda?: string;
  }): Promise<Request[]>;
  getRequest(id: number): Promise<Request | undefined>;
  createRequest(request: InsertRequest): Promise<Request>;
  updateRequest(id: number, updates: Partial<Request>): Promise<Request | undefined>;
  deleteRequest(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getRequests(filters?: {
    estado?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    busqueda?: string;
  }): Promise<Request[]> {
    const conditions = [];
    
    if (filters) {
      if (filters.estado) {
        conditions.push(eq(requests.estado, filters.estado));
      }
      if (filters.tipo) {
        conditions.push(eq(requests.tipo, filters.tipo));
      }
      if (filters.busqueda) {
        conditions.push(
          or(
            like(requests.solicitadoPor, `%${filters.busqueda}%`),
            like(requests.tipo, `%${filters.busqueda}%`),
            like(requests.asunto, `%${filters.busqueda}%`)
          )
        );
      }
    }
    
    if (conditions.length > 0) {
      const result = await db.select().from(requests).where(and(...conditions)).orderBy(requests.fechaCreacion);
      return result.reverse(); // Newest first
    } else {
      const result = await db.select().from(requests).orderBy(requests.fechaCreacion);
      return result.reverse(); // Newest first
    }
  }

  async getRequest(id: number): Promise<Request | undefined> {
    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    return request || undefined;
  }

  async createRequest(request: InsertRequest): Promise<Request> {
    const [newRequest] = await db
      .insert(requests)
      .values(request)
      .returning();
    return newRequest;
  }

  async updateRequest(id: number, updates: Partial<Request>): Promise<Request | undefined> {
    const [updatedRequest] = await db
      .update(requests)
      .set({ ...updates, fechaActualizacion: new Date() })
      .where(eq(requests.id, id))
      .returning();
    return updatedRequest || undefined;
  }

  async deleteRequest(id: number): Promise<boolean> {
    const result = await db.delete(requests).where(eq(requests.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
