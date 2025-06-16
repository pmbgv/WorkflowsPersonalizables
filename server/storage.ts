import { requests, approvalSchemas, approvalSteps, requestHistory, userVacationBalance, motivosPermisos, type Request, type InsertRequest, type ApprovalSchema, type InsertApprovalSchema, type ApprovalStep, type InsertApprovalStep, type RequestHistory, type InsertRequestHistory, type UserVacationBalance, type InsertUserVacationBalance, type MotivoPermiso, type InsertMotivoPermiso } from "@shared/schema";
import { db } from "./db";
import { eq, and, like, gte, lte, or, isNull } from "drizzle-orm";

export interface IStorage {
  getRequests(filters?: {
    estado?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    tipoFecha?: string;
    busqueda?: string;
  }): Promise<Request[]>;
  getUserRequests(filters?: {
    estado?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    tipoFecha?: string;
    busqueda?: string;
    userId?: string;
  }): Promise<Request[]>;
  getPendingApprovalRequests(filters?: {
    estado?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    tipoFecha?: string;
    busqueda?: string;
    userId?: string;
    userProfile?: string;
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
  
  // Request History
  getRequestHistory(requestId: number): Promise<RequestHistory[]>;
  addRequestHistory(history: InsertRequestHistory): Promise<RequestHistory>;
  
  // User Vacation Balance
  getUserVacationBalance(identificador: string): Promise<UserVacationBalance | undefined>;
  createUserVacationBalance(balance: InsertUserVacationBalance): Promise<UserVacationBalance>;
  updateUserVacationBalance(identificador: string, diasDisponibles: number): Promise<UserVacationBalance | undefined>;
  
  // Motivos de Permisos
  getMotivosPermisos(): Promise<MotivoPermiso[]>;
  getMotivosPorCategoria(categoria: string): Promise<MotivoPermiso[]>;
  createMotivoPermiso(motivo: InsertMotivoPermiso): Promise<MotivoPermiso>;
  updateMotivoPermiso(id: number, updates: Partial<MotivoPermiso>): Promise<MotivoPermiso | undefined>;
  deleteMotivoPermiso(id: number): Promise<boolean>;
}

export class DatabaseStorage implements IStorage {
  async getRequests(filters?: {
    estado?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    tipoFecha?: string;
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
      
      // Handle date filtering based on tipoFecha
      if (filters.fechaInicio || filters.fechaFin) {
        if (filters.tipoFecha === "fechaSolicitada") {
          // Filter by requested date (stored as varchar)
          if (filters.fechaInicio) {
            conditions.push(gte(requests.fechaSolicitada, filters.fechaInicio));
          }
          if (filters.fechaFin) {
            conditions.push(lte(requests.fechaSolicitada, filters.fechaFin));
          }
        } else {
          // Filter by creation date (stored as timestamp)
          if (filters.fechaInicio) {
            conditions.push(gte(requests.fechaCreacion, new Date(filters.fechaInicio)));
          }
          if (filters.fechaFin) {
            // Add one day to include the entire end date
            const endDate = new Date(filters.fechaFin);
            endDate.setDate(endDate.getDate() + 1);
            conditions.push(lte(requests.fechaCreacion, endDate));
          }
        }
      }
      
      if (filters.busqueda) {
        conditions.push(
          or(
            like(requests.usuarioSolicitado, `%${filters.busqueda}%`),
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

  async getUserRequests(filters?: {
    estado?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    tipoFecha?: string;
    busqueda?: string;
    userId?: string;
  }): Promise<Request[]> {
    const conditions = [];
    
    if (filters) {
      // Filter by identificadorUsuario (the person the request is FOR) for "Mis solicitudes"
      if (filters.userId) {
        conditions.push(eq(requests.identificadorUsuario, filters.userId));
      }
      
      if (filters.estado) {
        conditions.push(eq(requests.estado, filters.estado));
      }
      if (filters.tipo) {
        conditions.push(eq(requests.tipo, filters.tipo));
      }
      
      // Handle date filtering based on tipoFecha
      if (filters.fechaInicio || filters.fechaFin) {
        if (filters.tipoFecha === "fechaSolicitada") {
          if (filters.fechaInicio) {
            conditions.push(gte(requests.fechaSolicitada, filters.fechaInicio));
          }
          if (filters.fechaFin) {
            conditions.push(lte(requests.fechaSolicitada, filters.fechaFin));
          }
        } else {
          if (filters.fechaInicio) {
            conditions.push(gte(requests.fechaCreacion, new Date(filters.fechaInicio)));
          }
          if (filters.fechaFin) {
            const endDate = new Date(filters.fechaFin);
            endDate.setDate(endDate.getDate() + 1);
            conditions.push(lte(requests.fechaCreacion, endDate));
          }
        }
      }
      
      if (filters.busqueda) {
        conditions.push(
          or(
            like(requests.usuarioSolicitado, `%${filters.busqueda}%`),
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
      return []; // Return empty if no userId provided
    }
  }

  async getPendingApprovalRequests(filters?: {
    estado?: string;
    tipo?: string;
    fechaInicio?: string;
    fechaFin?: string;
    tipoFecha?: string;
    busqueda?: string;
    userId?: string;
    userProfile?: string;
  }): Promise<Request[]> {
    const conditions = [];
    
    if (filters) {
      // Only show pending requests
      conditions.push(eq(requests.estado, "Pendiente"));
      
      if (filters.tipo) {
        conditions.push(eq(requests.tipo, filters.tipo));
      }
      
      // Handle date filtering based on tipoFecha
      if (filters.fechaInicio || filters.fechaFin) {
        if (filters.tipoFecha === "fechaSolicitada") {
          if (filters.fechaInicio) {
            conditions.push(gte(requests.fechaSolicitada, filters.fechaInicio));
          }
          if (filters.fechaFin) {
            conditions.push(lte(requests.fechaSolicitada, filters.fechaFin));
          }
        } else {
          if (filters.fechaInicio) {
            conditions.push(gte(requests.fechaCreacion, new Date(filters.fechaInicio)));
          }
          if (filters.fechaFin) {
            const endDate = new Date(filters.fechaFin);
            endDate.setDate(endDate.getDate() + 1);
            conditions.push(lte(requests.fechaCreacion, endDate));
          }
        }
      }
      
      if (filters.busqueda) {
        conditions.push(
          or(
            like(requests.usuarioSolicitado, `%${filters.busqueda}%`),
            like(requests.solicitadoPor, `%${filters.busqueda}%`),
            like(requests.tipo, `%${filters.busqueda}%`),
            like(requests.asunto, `%${filters.busqueda}%`)
          )
        );
      }
    } else {
      conditions.push(eq(requests.estado, "Pendiente"));
    }
    
    // Get all pending requests first
    let pendingRequests: Request[] = [];
    if (conditions.length > 0) {
      const result = await db.select().from(requests).where(and(...conditions)).orderBy(requests.fechaCreacion);
      pendingRequests = result.reverse(); // Newest first
    }

    // If userProfile is provided, filter by approval permissions in schemas
    if (filters?.userProfile && pendingRequests.length > 0) {
      const filteredRequests: Request[] = [];
      
      for (const request of pendingRequests) {
        // Get the approval schema for this request
        let schema;
        if (request.tipo === "Vacaciones") {
          // Find vacation schema
          const schemas = await db.select().from(approvalSchemas).where(eq(approvalSchemas.tipoSolicitud, "Vacaciones"));
          schema = schemas[0];
        } else if (request.tipo === "Permiso") {
          // Find schema that matches the motivo
          const schemas = await db.select().from(approvalSchemas).where(eq(approvalSchemas.tipoSolicitud, "Permiso"));
          schema = schemas.find(s => s.motivos && s.motivos.includes(request.motivo || ""));
        }
        
        if (schema) {
          // Get approval steps for this schema
          const steps = await db.select().from(approvalSteps).where(eq(approvalSteps.schemaId, schema.id)).orderBy(approvalSteps.orden);
          
          // Check if userProfile matches any step perfil
          const hasApprovalPermission = steps.some(step => {
            return step.perfil === filters.userProfile;
          });
          
          if (hasApprovalPermission) {
            filteredRequests.push(request);
          }
        }
      }
      
      return filteredRequests;
    }
    
    return pendingRequests;
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

  async getRequestHistory(requestId: number): Promise<RequestHistory[]> {
    try {
      const history = await db
        .select()
        .from(requestHistory)
        .where(eq(requestHistory.requestId, requestId))
        .orderBy(requestHistory.fechaCreacion);
      return history;
    } catch (error) {
      console.error("Error fetching request history:", error);
      return [];
    }
  }

  async addRequestHistory(history: InsertRequestHistory): Promise<RequestHistory> {
    try {
      const [newHistory] = await db.insert(requestHistory).values(history).returning();
      return newHistory;
    } catch (error) {
      console.error("Error adding request history:", error);
      throw error;
    }
  }

  async getUserVacationBalance(identificador: string): Promise<UserVacationBalance | undefined> {
    try {
      const [balance] = await db
        .select()
        .from(userVacationBalance)
        .where(eq(userVacationBalance.identificador, identificador))
        .limit(1);
      return balance;
    } catch (error) {
      console.error("Error fetching user vacation balance:", error);
      return undefined;
    }
  }

  async createUserVacationBalance(balance: InsertUserVacationBalance): Promise<UserVacationBalance> {
    try {
      const [newBalance] = await db.insert(userVacationBalance).values(balance).returning();
      return newBalance;
    } catch (error) {
      console.error("Error creating user vacation balance:", error);
      throw error;
    }
  }

  async updateUserVacationBalance(identificador: string, diasDisponibles: number): Promise<UserVacationBalance | undefined> {
    try {
      const [updatedBalance] = await db
        .update(userVacationBalance)
        .set({ diasDisponibles, fechaActualizacion: new Date() })
        .where(eq(userVacationBalance.identificador, identificador))
        .returning();
      return updatedBalance;
    } catch (error) {
      console.error("Error updating user vacation balance:", error);
      return undefined;
    }
  }

  // Implementación de funciones para motivos de permisos
  async getMotivosPermisos(): Promise<MotivoPermiso[]> {
    return await db
      .select()
      .from(motivosPermisos)
      .where(eq(motivosPermisos.activo, "true"))
      .orderBy(motivosPermisos.categoria, motivosPermisos.orden);
  }

  async getMotivosPorCategoria(categoria: string): Promise<MotivoPermiso[]> {
    return await db
      .select()
      .from(motivosPermisos)
      .where(and(
        eq(motivosPermisos.categoria, categoria),
        eq(motivosPermisos.activo, "true")
      ))
      .orderBy(motivosPermisos.orden);
  }

  async createMotivoPermiso(motivo: InsertMotivoPermiso): Promise<MotivoPermiso> {
    const [created] = await db
      .insert(motivosPermisos)
      .values(motivo)
      .returning();
    return created;
  }

  async updateMotivoPermiso(id: number, updates: Partial<MotivoPermiso>): Promise<MotivoPermiso | undefined> {
    const [updated] = await db
      .update(motivosPermisos)
      .set({ ...updates, fechaActualizacion: new Date() })
      .where(eq(motivosPermisos.id, id))
      .returning();
    return updated || undefined;
  }

  async deleteMotivoPermiso(id: number): Promise<boolean> {
    // Soft delete - solo marcar como inactivo
    const [updated] = await db
      .update(motivosPermisos)
      .set({ activo: "false", fechaActualizacion: new Date() })
      .where(eq(motivosPermisos.id, id))
      .returning();
    return !!updated;
  }
}

export const storage = new DatabaseStorage();
