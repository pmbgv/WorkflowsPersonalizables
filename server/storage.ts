import { requests, approvalSchemas, approvalSteps, requestHistory, requestApprovalSteps, userVacationBalance, motivosPermisos, type Request, type InsertRequest, type ApprovalSchema, type InsertApprovalSchema, type ApprovalStep, type InsertApprovalStep, type RequestHistory, type InsertRequestHistory, type RequestApprovalStep, type InsertRequestApprovalStep, type UserVacationBalance, type InsertUserVacationBalance, type MotivoPermiso, type InsertMotivoPermiso } from "@shared/schema";
import { db } from "./db";
import { eq, and, like, gte, lte, or, isNull, asc } from "drizzle-orm";

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
  
  // Request Approval Steps
  getRequestApprovalSteps(requestId: number): Promise<RequestApprovalStep[]>;
  createRequestApprovalStep(step: InsertRequestApprovalStep): Promise<RequestApprovalStep>;
  updateRequestApprovalStep(id: number, updates: Partial<RequestApprovalStep>): Promise<RequestApprovalStep | undefined>;
  getNextPendingApprovalStep(requestId: number): Promise<RequestApprovalStep | undefined>;
  ensureRequestApprovalSteps(request: Request): Promise<void>;
  checkUserCanApprove(requestId: number, userProfile: string): Promise<boolean>;
  checkUserHasRoleInWorkflow(requestId: number, userProfile: string): Promise<boolean>;
  createApprovalStepsForRequest(request: Request): Promise<void>;
  
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
      // Handle both Identifier and Id fallback for comprehensive matching
      if (filters.userId) {
        conditions.push(
          or(
            eq(requests.identificadorUsuario, filters.userId),
            and(
              or(
                eq(requests.identificadorUsuario, ""),
                isNull(requests.identificadorUsuario)
              ),
              eq(requests.identificador, filters.userId)
            )
          )
        );
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
    userGroupDescription?: string;
  }): Promise<Request[]> {
    try {
      const conditions = [];
      
      if (filters) {
        // If called for "all-requests" view, don't filter by estado (show all)
        // If called for pending approval, filter by Pendiente
        if (filters.userProfile && !filters.userId) {
          // This is for "Todas las solicitudes" - show all requests the user can view
          console.log(`Getting all requests for profile view: ${filters.userProfile}`);
        } else {
          // This is for pending approval - only show pending requests
          conditions.push(eq(requests.estado, "Pendiente"));
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
      } else {
        conditions.push(eq(requests.estado, "Pendiente"));
      }
      
      // Get requests
      let result: Request[] = [];
      if (conditions.length > 0) {
        const queryResult = await db.select().from(requests).where(and(...conditions)).orderBy(requests.fechaCreacion);
        result = queryResult.reverse(); // Newest first
      } else {
        const queryResult = await db.select().from(requests).orderBy(requests.fechaCreacion);
        result = queryResult.reverse(); // Newest first
      }
      
      console.log(`Found ${result.length} requests before user filtering`);

      // Handle user filtering based on context
      if (filters?.userProfile && !filters?.userId) {
        // This is "Todas las solicitudes" - show requests user can view based on profile
        console.log(`Filtering for "Todas las solicitudes" with profile: ${filters.userProfile}`);
        
        // For "Todas las solicitudes", filter by requests where user has ANY role in approval workflow
        const filteredRequests: Request[] = [];
        
        for (const request of result) {
          // Ensure request has approval steps
          await this.ensureRequestApprovalSteps(request);
          
          // Check if user has ANY role in this request's approval workflow
          const hasRoleInWorkflow = await this.checkUserHasRoleInWorkflow(request.id, filters.userProfile);
          
          if (hasRoleInWorkflow) {
            console.log(`✅ Request ${request.id} has role for user ${filters.userProfile} in workflow`);
            filteredRequests.push(request);
          } else {
            console.log(`❌ Request ${request.id} has no role for user ${filters.userProfile} in workflow`);
          }
        }
        
        console.log(`"Todas las solicitudes" filtered requests for ${filters.userProfile}: ${filteredRequests.length}`);
        return filteredRequests;
      }

      // If userProfile is provided with userId, filter by approval schema steps
      if (filters?.userProfile && filters?.userId && result.length > 0) {
        console.log(`Filtering ${result.length} requests for user ${filters.userProfile} (userId: ${filters.userId})`);
        const filteredRequests: Request[] = [];
        
        for (const request of result) {
          // Ensure request has approval steps (migrate if needed)
          await this.ensureRequestApprovalSteps(request);
          
          // Check if user can approve this request based on next pending approval step
          const canApprove = await this.checkUserCanApprove(request.id, filters.userProfile);
          
          if (canApprove) {
            console.log(`✅ Request ${request.id} is pending for user ${filters.userProfile}`);
            filteredRequests.push(request);
          } else {
            console.log(`❌ Request ${request.id} is not pending for user ${filters.userProfile}`);
          }
        }
        
        console.log(`Final filtered requests for ${filters.userProfile}: ${filteredRequests.length}`);
        return filteredRequests;
      }
      
      return result;
    } catch (error) {
      console.error("Error getting pending approval requests:", error);
      // Return empty array instead of throwing to prevent crashes
      return [];
    }
  }

  async getRequest(id: number): Promise<Request | undefined> {
    const [request] = await db.select().from(requests).where(eq(requests.id, id));
    return request || undefined;
  }

  async createRequest(request: InsertRequest): Promise<Request> {
    try {
      const [newRequest] = await db.insert(requests).values(request).returning();
      
      // Add to history
      await this.addRequestHistory({
        requestId: newRequest.id,
        newState: "Pendiente",
        changedBy: request.solicitadoPor || "Sistema",
        changeReason: "Solicitud creada"
      });
      
      // Create approval steps based on the schema
      await this.createApprovalStepsForRequest(newRequest);
      
      return newRequest;
    } catch (error) {
      console.error("Error creating request:", error);
      throw error;
    }
  }

  // Helper method to create approval steps for a new request
  async createApprovalStepsForRequest(request: Request): Promise<void> {
    try {
      // Find the appropriate approval schema based on request type and motivo
      let schema;
      
      if (request.motivo) {
        // Find schema that matches both type and motivo
        const schemas = await db
          .select()
          .from(approvalSchemas)
          .where(eq(approvalSchemas.tipoSolicitud, request.tipo));
        
        // Filter by motivo in the array
        schema = schemas.find(s => s.motivos && s.motivos.includes(request.motivo!));
      }
      
      if (!schema) {
        // Fallback: find schema by type only
        const [defaultSchema] = await db
          .select()
          .from(approvalSchemas)
          .where(eq(approvalSchemas.tipoSolicitud, request.tipo))
          .limit(1);
        schema = defaultSchema;
      }
      
      if (!schema) return;
      
      // Get approval steps for this schema
      const steps = await db
        .select()
        .from(approvalSteps)
        .where(eq(approvalSteps.schemaId, schema.id))
        .orderBy(asc(approvalSteps.orden));
      
      // Create request approval steps
      for (const step of steps) {
        await this.createRequestApprovalStep({
          requestId: request.id,
          approvalStepId: step.id,
          estado: "Pendiente"
        });
      }
    } catch (error) {
      console.error("Error creating approval steps for request:", error);
    }
  }

  // Helper method to ensure request has approval steps (for migration)
  async ensureRequestApprovalSteps(request: Request): Promise<void> {
    try {
      // Check if request already has approval steps
      const existingSteps = await db
        .select()
        .from(requestApprovalSteps)
        .where(eq(requestApprovalSteps.requestId, request.id))
        .limit(1);
      
      if (existingSteps.length === 0) {
        // Create approval steps for this request
        await this.createApprovalStepsForRequest(request);
      }
    } catch (error) {
      console.error("Error ensuring request has approval steps:", error);
    }
  }

  // Helper method to check if user has ANY role in the approval workflow
  async checkUserHasRoleInWorkflow(requestId: number, userProfile: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking if user ${userProfile} has any role in request ${requestId} workflow`);
      
      // Get ALL approval steps for this request
      const allSteps = await db
        .select({
          requestApprovalStep: requestApprovalSteps,
          approvalStep: approvalSteps
        })
        .from(requestApprovalSteps)
        .innerJoin(approvalSteps, eq(requestApprovalSteps.approvalStepId, approvalSteps.id))
        .where(eq(requestApprovalSteps.requestId, requestId))
        .orderBy(asc(approvalSteps.orden));
      
      if (allSteps.length === 0) {
        console.log(`❌ No approval steps found for request ${requestId}`);
        return false;
      }
      
      // Check if user profile matches ANY step in the workflow
      const hasRole = allSteps.some(stepData => {
        const stepConfig = stepData.approvalStep;
        return stepConfig.perfil === userProfile || stepConfig.perfil === "Todos los perfiles";
      });
      
      console.log(`${hasRole ? '✅' : '❌'} User ${userProfile} ${hasRole ? 'HAS' : 'DOES NOT HAVE'} role in request ${requestId} workflow`);
      return hasRole;
      
    } catch (error) {
      console.error("Error checking if user has role in workflow:", error);
      return false;
    }
  }

  // Helper method to check if user can approve based on next sequential pending step
  async checkUserCanApprove(requestId: number, userProfile: string): Promise<boolean> {
    try {
      console.log(`🔍 Checking if user ${userProfile} can approve request ${requestId}`);
      
      // Get ALL approval steps for this request (ordered by step order)
      const allSteps = await db
        .select({
          requestApprovalStep: requestApprovalSteps,
          approvalStep: approvalSteps
        })
        .from(requestApprovalSteps)
        .innerJoin(approvalSteps, eq(requestApprovalSteps.approvalStepId, approvalSteps.id))
        .where(eq(requestApprovalSteps.requestId, requestId))
        .orderBy(asc(approvalSteps.orden));
      
      if (allSteps.length === 0) {
        console.log(`❌ No approval steps found for request ${requestId}`);
        return false;
      }
      
      console.log(`📋 Request ${requestId} has ${allSteps.length} approval steps`);
      
      // For sequential workflow: Find the NEXT step that should be processed
      for (const stepData of allSteps) {
        const step = stepData.requestApprovalStep;
        const stepConfig = stepData.approvalStep;
        
        console.log(`  Step ${stepConfig.orden}: ${step.estado} (${stepConfig.obligatorio}) - Profile: ${stepConfig.perfil}`);
        
        if (step.estado === "Pendiente") {
          // This is a pending step - check if it's ready for processing
          
          if (stepConfig.obligatorio === "Si") {
            // OBLIGATORY STEP: Check if all previous obligatory steps are completed
            const previousObligatorySteps = allSteps.filter(s => 
              s.approvalStep.obligatorio === "Si" && 
              s.approvalStep.orden < stepConfig.orden
            );
            
            const allPreviousObligatoryCompleted = previousObligatorySteps.every(s => 
              s.requestApprovalStep.estado === "Aprobado"
            );
            
            console.log(`    Previous obligatory steps completed: ${allPreviousObligatoryCompleted}`);
            
            if (!allPreviousObligatoryCompleted) {
              console.log(`    ⏸️ Step ${stepConfig.orden} not ready - previous obligatory steps pending`);
              continue; // This step is not ready yet
            }
          } else {
            // OPTIONAL STEP: More complex logic for optional steps
            // For now, let's handle optional steps after obligatory ones
            const remainingObligatorySteps = allSteps.filter(s => 
              s.approvalStep.obligatorio === "Si" && 
              s.requestApprovalStep.estado === "Pendiente"
            );
            
            if (remainingObligatorySteps.length > 0) {
              console.log(`    ⏸️ Optional step ${stepConfig.orden} waiting - obligatory steps still pending`);
              continue; // Optional steps wait for obligatory ones
            }
          }
          
          // This step is ready - check if user can approve it
          const canApproveThisStep = stepConfig.perfil === userProfile || 
                                   stepConfig.perfil === "Todos los perfiles";
          
          console.log(`    Profile match: ${canApproveThisStep} (step profile: ${stepConfig.perfil}, user: ${userProfile})`);
          
          if (canApproveThisStep) {
            console.log(`✅ User ${userProfile} CAN approve step ${stepConfig.orden} of request ${requestId}`);
            return true;
          } else {
            console.log(`❌ User ${userProfile} profile doesn't match step ${stepConfig.orden} requirements`);
            return false;
          }
        }
      }
      
      console.log(`❌ No pending steps available for user ${userProfile} on request ${requestId}`);
      return false;
      
    } catch (error) {
      console.error("Error checking if user can approve request:", error);
      return false;
    }
  }

  async processApprovalStep(requestId: number, stepId: number, action: "Aprobado" | "Rechazado", userProfile: string, comentario?: string): Promise<{ success: boolean; requestStatus: string; message: string }> {
    try {
      // 1. Verificar que el usuario puede aprobar este paso
      const canApprove = await this.checkUserCanApprove(requestId, userProfile);
      if (!canApprove) {
        return { success: false, requestStatus: "Pendiente", message: "Usuario no autorizado para aprobar este paso" };
      }

      // 2. Actualizar el paso actual
      console.log(`🔧 Updating approval step ${stepId} to ${action} for request ${requestId}`);
      const updatedStep = await this.updateRequestApprovalStep(stepId, { 
        estado: action, 
        fechaAprobacion: new Date(),
        comentario: comentario || null,
        aprobadoPor: userProfile
      });
      
      if (!updatedStep) {
        console.error(`❌ Failed to update approval step ${stepId}`);
        return { success: false, requestStatus: "Pendiente", message: "Error al actualizar paso de aprobación" };
      }
      
      console.log(`✅ Successfully updated step ${stepId} to ${action}`);

      // 3. Agregar al historial
      await this.addRequestHistory({
        requestId,
        newState: action,
        changedBy: userProfile,
        changeReason: comentario || `Paso ${action.toLowerCase()} por ${userProfile}`
      });

      // 4. Si es rechazo, terminar inmediatamente
      if (action === "Rechazado") {
        await this.updateRequest(requestId, { estado: "Rechazado" });
        return { success: true, requestStatus: "Rechazado", message: "Solicitud rechazada" };
      }

      // 5. Obtener todos los pasos de aprobación para esta solicitud
      const allSteps = await db
        .select({
          requestApprovalStep: requestApprovalSteps,
          approvalStep: approvalSteps
        })
        .from(requestApprovalSteps)
        .innerJoin(approvalSteps, eq(requestApprovalSteps.approvalStepId, approvalSteps.id))
        .where(eq(requestApprovalSteps.requestId, requestId))
        .orderBy(asc(approvalSteps.orden));

      const obligatorySteps = allSteps.filter(step => step.approvalStep.obligatorio === "Si");
      const optionalSteps = allSteps.filter(step => step.approvalStep.obligatorio === "No");

      console.log(`Processing approval for request ${requestId}:`);
      console.log(`Total steps: ${allSteps.length}, Obligatory: ${obligatorySteps.length}, Optional: ${optionalSteps.length}`);

      // 6. Determinar lógica de flujo según configuración de pasos
      if (obligatorySteps.length === 0) {
        // Caso: Múltiples pasos, todos opcionales - primera aprobación completa todo
        console.log("All steps are optional - completing request");
        await this.updateRequest(requestId, { estado: "Aprobado" });
        return { success: true, requestStatus: "Aprobado", message: "Solicitud aprobada (todos los pasos opcionales)" };
      } else {
        // Caso: Al menos un paso obligatorio - verificar si todos los obligatorios están aprobados
        const pendingObligatory = obligatorySteps.filter(step => step.requestApprovalStep.estado === "Pendiente");
        
        console.log(`Obligatory steps pending: ${pendingObligatory.length}`);
        
        if (pendingObligatory.length === 0) {
          // Todos los pasos obligatorios completados
          console.log("All obligatory steps completed - approving request");
          await this.updateRequest(requestId, { estado: "Aprobado" });
          return { success: true, requestStatus: "Aprobado", message: "Solicitud aprobada (todos los pasos obligatorios completados)" };
        } else {
          // Aún hay pasos obligatorios pendientes
          console.log("Request continues - obligatory steps still pending");
          return { success: true, requestStatus: "Pendiente", message: "Paso aprobado, solicitud continúa en proceso" };
        }
      }

    } catch (error) {
      console.error("Error processing approval step:", error);
      return { success: false, requestStatus: "Pendiente", message: "Error interno al procesar aprobación" };
    }
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

  // Request Approval Steps implementation
  async getRequestApprovalSteps(requestId: number): Promise<RequestApprovalStep[]> {
    try {
      const result = await db
        .select({
          id: requestApprovalSteps.id,
          requestId: requestApprovalSteps.requestId,
          approvalStepId: requestApprovalSteps.approvalStepId,
          estado: requestApprovalSteps.estado,
          fechaAprobacion: requestApprovalSteps.fechaAprobacion,
          comentario: requestApprovalSteps.comentario,
          aprobadoPor: requestApprovalSteps.aprobadoPor,
          fechaCreacion: requestApprovalSteps.fechaCreacion,
          // Add approval step details
          perfil: approvalSteps.perfil,
          orden: approvalSteps.orden,
          obligatorio: approvalSteps.obligatorio
        })
        .from(requestApprovalSteps)
        .innerJoin(approvalSteps, eq(requestApprovalSteps.approvalStepId, approvalSteps.id))
        .where(eq(requestApprovalSteps.requestId, requestId))
        .orderBy(asc(approvalSteps.orden));
      
      return result as RequestApprovalStep[];
    } catch (error) {
      console.error("Error fetching request approval steps:", error);
      return [];
    }
  }

  async createRequestApprovalStep(step: InsertRequestApprovalStep): Promise<RequestApprovalStep> {
    try {
      const [result] = await db.insert(requestApprovalSteps).values(step).returning();
      return result;
    } catch (error) {
      console.error("Error creating request approval step:", error);
      throw error;
    }
  }

  async updateRequestApprovalStep(id: number, updates: Partial<RequestApprovalStep>): Promise<RequestApprovalStep | undefined> {
    try {
      const [result] = await db
        .update(requestApprovalSteps)
        .set({
          ...updates,
          fechaAprobacion: updates.estado === "Aprobado" || updates.estado === "Rechazado" ? new Date() : undefined
        })
        .where(eq(requestApprovalSteps.id, id))
        .returning();
      return result;
    } catch (error) {
      console.error("Error updating request approval step:", error);
      return undefined;
    }
  }

  async getRequestApprovalStepsWithDetails(requestId: number): Promise<Array<{ requestApprovalStep: RequestApprovalStep; approvalStep: ApprovalStep }>> {
    try {
      const result = await db
        .select({
          requestApprovalStep: requestApprovalSteps,
          approvalStep: approvalSteps
        })
        .from(requestApprovalSteps)
        .innerJoin(approvalSteps, eq(requestApprovalSteps.approvalStepId, approvalSteps.id))
        .where(eq(requestApprovalSteps.requestId, requestId))
        .orderBy(asc(approvalSteps.orden));
      
      return result;
    } catch (error) {
      console.error("Error getting request approval steps with details:", error);
      return [];
    }
  }

  async getNextPendingApprovalStep(requestId: number): Promise<RequestApprovalStep | undefined> {
    try {
      const result = await db
        .select({
          requestApprovalStep: requestApprovalSteps,
          approvalStep: approvalSteps
        })
        .from(requestApprovalSteps)
        .innerJoin(approvalSteps, eq(requestApprovalSteps.approvalStepId, approvalSteps.id))
        .where(
          and(
            eq(requestApprovalSteps.requestId, requestId),
            eq(requestApprovalSteps.estado, "Pendiente")
          )
        )
        .orderBy(asc(approvalSteps.orden))
        .limit(1);
      
      return result[0]?.requestApprovalStep;
    } catch (error) {
      console.error("Error getting next pending approval step:", error);
      return undefined;
    }
  }
}

export const storage = new DatabaseStorage();
