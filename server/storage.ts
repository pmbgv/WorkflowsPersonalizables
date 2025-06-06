import { requests, approvalSchemas, approvalSteps, type Request, type InsertRequest, type ApprovalSchema, type InsertApprovalSchema, type ApprovalStep, type InsertApprovalStep } from "@shared/schema";
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
  
  // Approval Schemas
  getApprovalSchemas(): Promise<ApprovalSchema[]>;
  getApprovalSchema(id: number): Promise<ApprovalSchema | undefined>;
  createApprovalSchema(schema: InsertApprovalSchema): Promise<ApprovalSchema>;
  updateApprovalSchema(id: number, updates: Partial<ApprovalSchema>): Promise<ApprovalSchema | undefined>;
  deleteApprovalSchema(id: number): Promise<boolean>;
  
  // Approval Steps
  getApprovalSteps(schemaId: number): Promise<ApprovalStep[]>;
  createApprovalStep(step: InsertApprovalStep): Promise<ApprovalStep>;
  updateApprovalStep(id: number, updates: Partial<ApprovalStep>): Promise<ApprovalStep | undefined>;
  deleteApprovalStep(id: number): Promise<boolean>;
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

  // Approval Schemas methods
  async getApprovalSchemas(): Promise<ApprovalSchema[]> {
    const result = await db.select().from(approvalSchemas).orderBy(approvalSchemas.fechaCreacion);
    return result.reverse(); // Newest first
  }

  async getApprovalSchema(id: number): Promise<ApprovalSchema | undefined> {
    const [schema] = await db.select().from(approvalSchemas).where(eq(approvalSchemas.id, id));
    return schema || undefined;
  }

  async createApprovalSchema(schema: InsertApprovalSchema): Promise<ApprovalSchema> {
    const [newSchema] = await db
      .insert(approvalSchemas)
      .values(schema)
      .returning();
    return newSchema;
  }

  async updateApprovalSchema(id: number, updates: Partial<ApprovalSchema>): Promise<ApprovalSchema | undefined> {
    const [updatedSchema] = await db
      .update(approvalSchemas)
      .set({ ...updates, fechaActualizacion: new Date() })
      .where(eq(approvalSchemas.id, id))
      .returning();
    return updatedSchema || undefined;
  }

  async deleteApprovalSchema(id: number): Promise<boolean> {
    // First delete all related steps
    await db.delete(approvalSteps).where(eq(approvalSteps.schemaId, id));
    // Then delete the schema
    const result = await db.delete(approvalSchemas).where(eq(approvalSchemas.id, id));
    return (result.rowCount || 0) > 0;
  }

  // Approval Steps methods
  async getApprovalSteps(schemaId: number): Promise<ApprovalStep[]> {
    const result = await db.select().from(approvalSteps).where(eq(approvalSteps.schemaId, schemaId)).orderBy(approvalSteps.orden);
    return result;
  }

  async createApprovalStep(step: InsertApprovalStep): Promise<ApprovalStep> {
    const [newStep] = await db
      .insert(approvalSteps)
      .values(step)
      .returning();
    return newStep;
  }

  async updateApprovalStep(id: number, updates: Partial<ApprovalStep>): Promise<ApprovalStep | undefined> {
    const [updatedStep] = await db
      .update(approvalSteps)
      .set(updates)
      .where(eq(approvalSteps.id, id))
      .returning();
    return updatedStep || undefined;
  }

  async deleteApprovalStep(id: number): Promise<boolean> {
    const result = await db.delete(approvalSteps).where(eq(approvalSteps.id, id));
    return (result.rowCount || 0) > 0;
  }
}

export const storage = new DatabaseStorage();
