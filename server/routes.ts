import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRequestSchema, insertApprovalSchemaSchema, insertApprovalStepSchema, insertMotivoPermisoSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all requests with optional filters
  app.get("/api/requests", async (req, res) => {
    try {
      const { estado, tipo, fechaInicio, fechaFin, tipoFecha, busqueda } = req.query;
      
      const filters = {
        estado: estado as string,
        tipo: tipo as string,
        fechaInicio: fechaInicio as string,
        fechaFin: fechaFin as string,
        tipoFecha: tipoFecha as string,
        busqueda: busqueda as string,
      };

      const requests = await storage.getRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching requests:", error);
      res.status(500).json({ message: "Error fetching requests" });
    }
  });

  // Get user's own requests (Mis solicitudes)
  app.get("/api/requests/my-requests/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { estado, tipo, fechaInicio, fechaFin, tipoFecha, busqueda } = req.query;
      
      const filters = {
        estado: estado as string,
        tipo: tipo as string,
        fechaInicio: fechaInicio as string,
        fechaFin: fechaFin as string,
        tipoFecha: tipoFecha as string,
        busqueda: busqueda as string,
        userId: userId,
      };

      const requests = await storage.getUserRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching user requests:", error);
      res.status(500).json({ message: "Error fetching user requests" });
    }
  });

  // Get requests pending approval by user (Solicitudes pendientes)
  app.get("/api/requests/pending-approval/:userId", async (req, res) => {
    try {
      const userId = req.params.userId;
      const { estado, tipo, fechaInicio, fechaFin, tipoFecha, busqueda, userProfile, userGroupDescription } = req.query;
      
      const filters = {
        estado: estado as string,
        tipo: tipo as string,
        fechaInicio: fechaInicio as string,
        fechaFin: fechaFin as string,
        tipoFecha: tipoFecha as string,
        busqueda: busqueda as string,
        userId: userId,
        userProfile: userProfile as string,
        userGroupDescription: userGroupDescription as string,
      };

      const requests = await storage.getPendingApprovalRequests(filters);
      res.json(requests);
    } catch (error) {
      console.error("Error fetching pending approval requests:", error);
      res.status(500).json({ message: "Error fetching pending approval requests" });
    }
  });

  // Get a specific request
  app.get("/api/requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const request = await storage.getRequest(id);
      
      if (!request) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      res.json(request);
    } catch (error) {
      res.status(500).json({ message: "Error fetching request" });
    }
  });

  // Create a new request
  app.post("/api/requests", async (req, res) => {
    try {
      console.log("Request body:", req.body);
      const validatedData = insertRequestSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      const newRequest = await storage.createRequest(validatedData);
      
      // Add initial history entry
      await storage.addRequestHistory({
        requestId: newRequest.id,
        previousState: null,
        newState: "Pendiente",
        changedBy: validatedData.solicitadoPor,
        changeReason: "Solicitud creada"
      });
      
      res.status(201).json(newRequest);
    } catch (error) {
      console.error("Error creating request:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating request", error: error instanceof Error ? error.message : String(error) });
    }
  });

  // Update a request
  app.patch("/api/requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedRequest = await storage.updateRequest(id, updates);
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      res.json(updatedRequest);
    } catch (error) {
      res.status(500).json({ message: "Error updating request" });
    }
  });

  // Update request status
  app.patch("/api/requests/:id/status", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const { estado } = req.body;
      
      if (!estado || !["Pendiente", "Aprobado", "Rechazado", "Cancelada", "Anulada"].includes(estado)) {
        return res.status(400).json({ message: "Invalid status" });
      }
      
      // Get current request to track previous state
      const currentRequest = await storage.getRequest(id);
      if (!currentRequest) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      const updatedRequest = await storage.updateRequest(id, { estado });
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }

      // Add to history if state changed
      if (currentRequest.estado !== estado) {
        await storage.addRequestHistory({
          requestId: id,
          previousState: currentRequest.estado,
          newState: estado,
          changedBy: "Sistema", // You could get this from authentication
          changeReason: "Cambio de estado manual"
        });
      }

      // If status changed to "Aprobado", send notification to external system
      if (estado === "Aprobado") {
        try {
          const authHeader = process.env.AUTHORIZATION_HEADER;
          
          if (!authHeader) {
            console.error("AUTHORIZATION_HEADER not configured");
          } else {
            // Obtener tipos de timeoff para mapear el motivo al ID
            const typesUrl = "https://customerapi.geovictoria.com/api/v1/TimeOff/GetTypes";
            const typesResponse = await fetch(typesUrl, {
              method: 'POST',
              headers: {
                "Authorization": authHeader,
                "Content-Type": "application/json"
              }
            });

            if (typesResponse.ok) {
              const timeOffTypes = await typesResponse.json();
              
              // Buscar el ID del tipo basado en el motivo
              const timeOffType = timeOffTypes.find((type: any) => 
                type.TranslatedDescription === updatedRequest.motivo && type.Status === "enabled"
              );

              if (timeOffType) {
                // Obtener información completa del usuario
                const usersUrl = "https://customerapi.geovictoria.com/api/v1/User/ListComplete";
                const usersResponse = await fetch(usersUrl, {
                  method: 'POST',
                  headers: {
                    "Authorization": authHeader,
                    "Content-Type": "application/json"
                  }
                });

                let userName = "Usuario";
                if (usersResponse.ok) {
                  const users = await usersResponse.json();
                  const user = users.find((u: any) => u.Identifier === updatedRequest.identificador);
                  if (user) {
                    userName = `${user.Name} ${user.LastName}`.trim();
                  }
                }

                // Formatear fechas para GeoVictoria (YYYYMMDDHHMMSS)
                const formatDateForGeoVictoria = (dateStr: string) => {
                  const date = new Date(dateStr);
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  return `${year}${month}${day}000000`;
                };

                const formatEndDateForGeoVictoria = (dateStr: string) => {
                  const date = new Date(dateStr);
                  const year = date.getFullYear();
                  const month = String(date.getMonth() + 1).padStart(2, '0');
                  const day = String(date.getDate()).padStart(2, '0');
                  return `${year}${month}${day}235959`;
                };

                // Preparar datos según el formato requerido
                const geoVictoriaData = {
                  TimeOffTypeId: timeOffType.Id,
                  Starts: formatDateForGeoVictoria(updatedRequest.fechaSolicitada),
                  Ends: updatedRequest.fechaFin ? formatEndDateForGeoVictoria(updatedRequest.fechaFin) : formatEndDateForGeoVictoria(updatedRequest.fechaSolicitada),
                  TimeOffTypeDescription: timeOffType.TranslatedDescription,
                  Description: updatedRequest.descripcion || `Solicitud #${updatedRequest.id} aceptada`,
                  Identifier: "103285551",
                  Name: userName,
                  isParcial: timeOffType.IsParcial || false
                };

                console.log("ENVIANDO A GEOVICTORIA:", geoVictoriaData);

                // Enviar a GeoVictoria
                const upsertUrl = "https://customerapi.geovictoria.com/api/v1/TimeOff/Upsert";
                const upsertResponse = await fetch(upsertUrl, {
                  method: 'POST',
                  headers: {
                    "Authorization": authHeader,
                    "Content-Type": "application/json"
                  },
                  body: JSON.stringify(geoVictoriaData)
                });

                if (!upsertResponse.ok) {
                  const errorText = await upsertResponse.text();
                  console.error("Failed to sync to GeoVictoria:", upsertResponse.status, errorText);
                } else {
                  console.log("Request synced to GeoVictoria successfully");
                }
              } else {
                console.error(`TimeOff type not found for motivo: ${updatedRequest.motivo}`);
              }
            } else {
              console.error("Failed to fetch timeoff types:", typesResponse.status);
            }
          }

          // Enviar notificación al sistema de libro (manteniendo funcionalidad existente)
          const notificationData = {
            fecha: updatedRequest.fechaSolicitada,
            texto: `Solicitud #${updatedRequest.id} aceptada`,
            token: "mi-token-seguro"
          };

          console.log("ENVIANDO A LIBRO");

          const response = await fetch("https://9448701c-ba39-418d-b9a3-bffb4f899f03-00-15wveztsmtm4l.picard.replit.dev/actualizar", {
            method: "POST",
            headers: {
              "Content-Type": "application/json",
            },
            body: JSON.stringify(notificationData)
          });

          if (!response.ok) {
            console.error("Failed to send notification to external system:", response.status, response.statusText);
          } else {
            console.log("Notification sent successfully to external system");
          }
        } catch (notificationError) {
          console.error("Error sending notification to external system:", notificationError);
          // Don't fail the main request if notification fails
        }
      }
      
      res.json(updatedRequest);
    } catch (error) {
      console.error("Error updating request status:", error);
      res.status(500).json({ message: "Error updating request status" });
    }
  });

  // Get request history
  app.get("/api/requests/:id/history", async (req, res) => {
    try {
      const requestId = parseInt(req.params.id);
      const history = await storage.getRequestHistory(requestId);
      res.json(history);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch request history" });
    }
  });

  // Get user vacation balance
  app.get("/api/vacation-balance/:identificador", async (req, res) => {
    try {
      const identificador = req.params.identificador;
      const balance = await storage.getUserVacationBalance(identificador);
      
      if (!balance) {
        return res.status(404).json({ error: "User vacation balance not found" });
      }
      
      res.json(balance);
    } catch (error) {
      res.status(500).json({ error: "Failed to fetch vacation balance" });
    }
  });

  // Delete a request
  app.delete("/api/requests/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteRequest(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Request not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting request" });
    }
  });

  // Approval Schemas routes
  app.get("/api/approval-schemas", async (req, res) => {
    try {
      const schemas = await storage.getApprovalSchemas();
      res.json(schemas);
    } catch (error) {
      res.status(500).json({ message: "Error fetching approval schemas" });
    }
  });

  app.get("/api/approval-schemas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const schema = await storage.getApprovalSchema(id);
      
      if (!schema) {
        return res.status(404).json({ message: "Approval schema not found" });
      }
      
      res.json(schema);
    } catch (error) {
      res.status(500).json({ message: "Error fetching approval schema" });
    }
  });

  app.post("/api/approval-schemas", async (req, res) => {
    try {
      console.log("POST /api/approval-schemas called with body:", req.body);
      const validatedData = insertApprovalSchemaSchema.parse(req.body);
      console.log("Validated data:", validatedData);
      
      // Validar motivos duplicados para esquemas de tipo Permiso
      if (validatedData.tipoSolicitud === "Permiso" && validatedData.motivos && validatedData.motivos.length > 0) {
        const existingSchemas = await storage.getApprovalSchemas();
        const duplicateMotivos: string[] = [];
        
        console.log("Checking for duplicate motivos in:", validatedData.motivos);
        console.log("Against existing schemas:", existingSchemas.length);
        
        for (const schema of existingSchemas) {
          if (schema.tipoSolicitud === "Permiso" && schema.motivos && Array.isArray(schema.motivos)) {
            console.log(`Checking schema "${schema.nombre}" with motivos:`, schema.motivos);
            for (const motivo of validatedData.motivos) {
              if (schema.motivos.includes(motivo)) {
                console.log(`Found duplicate motivo: "${motivo}" in schema "${schema.nombre}"`);
                duplicateMotivos.push(motivo);
              }
            }
          }
        }
        
        if (duplicateMotivos.length > 0) {
          const uniqueDuplicates = [...new Set(duplicateMotivos)];
          console.log("Rejecting due to duplicate motivos:", uniqueDuplicates);
          return res.status(400).json({
            message: "Motivos duplicados detectados",
            duplicateMotivos: uniqueDuplicates,
            error: "DUPLICATE_MOTIVOS"
          });
        } else {
          console.log("No duplicates found, proceeding with creation");
        }
      }
      
      const newSchema = await storage.createApprovalSchema(validatedData);
      console.log("Created schema:", newSchema);
      res.status(201).json(newSchema);
    } catch (error) {
      console.error("Error in POST /api/approval-schemas:", error);
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating approval schema" });
    }
  });

  app.patch("/api/approval-schemas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      // Validar motivos duplicados para esquemas de tipo Permiso (solo si se están actualizando motivos)
      if (updates.motivos && Array.isArray(updates.motivos) && updates.motivos.length > 0) {
        const existingSchemas = await storage.getApprovalSchemas();
        const duplicateMotivos: string[] = [];
        
        console.log(`Checking for duplicate motivos during PATCH for schema ${id}:`, updates.motivos);
        
        for (const schema of existingSchemas) {
          // Excluir el esquema que se está editando
          if (schema.id === id) {
            console.log(`Excluding schema ${id} from duplicate validation`);
            continue;
          }
          
          if (schema.tipoSolicitud === "Permiso" && schema.motivos && Array.isArray(schema.motivos)) {
            console.log(`Checking schema "${schema.nombre}" (ID: ${schema.id}) with motivos:`, schema.motivos);
            for (const motivo of updates.motivos) {
              if (schema.motivos.includes(motivo)) {
                console.log(`Found duplicate motivo: "${motivo}" in schema "${schema.nombre}"`);
                duplicateMotivos.push(motivo);
              }
            }
          }
        }
        
        if (duplicateMotivos.length > 0) {
          const uniqueDuplicates = [...new Set(duplicateMotivos)];
          console.log("Rejecting PATCH due to duplicate motivos:", uniqueDuplicates);
          return res.status(400).json({
            message: "Motivos duplicados detectados",
            duplicateMotivos: uniqueDuplicates,
            error: "DUPLICATE_MOTIVOS"
          });
        } else {
          console.log("No duplicates found during PATCH, proceeding with update");
        }
      }
      
      const updatedSchema = await storage.updateApprovalSchema(id, updates);
      
      if (!updatedSchema) {
        return res.status(404).json({ message: "Approval schema not found" });
      }
      
      res.json(updatedSchema);
    } catch (error) {
      console.error("Error updating approval schema:", error);
      res.status(500).json({ message: "Error updating approval schema" });
    }
  });

  app.delete("/api/approval-schemas/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteApprovalSchema(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Approval schema not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting approval schema" });
    }
  });

  // Approval Steps routes
  app.get("/api/approval-schemas/:schemaId/steps", async (req, res) => {
    try {
      const schemaId = parseInt(req.params.schemaId);
      const steps = await storage.getApprovalSteps(schemaId);
      res.json(steps);
    } catch (error) {
      res.status(500).json({ message: "Error fetching approval steps" });
    }
  });

  app.post("/api/approval-steps", async (req, res) => {
    try {
      const validatedData = insertApprovalStepSchema.parse(req.body);
      const newStep = await storage.createApprovalStep(validatedData);
      res.status(201).json(newStep);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating approval step" });
    }
  });

  app.patch("/api/approval-steps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      
      const updatedStep = await storage.updateApprovalStep(id, updates);
      
      if (!updatedStep) {
        return res.status(404).json({ message: "Approval step not found" });
      }
      
      res.json(updatedStep);
    } catch (error) {
      res.status(500).json({ message: "Error updating approval step" });
    }
  });

  app.delete("/api/approval-steps/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteApprovalStep(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Approval step not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      res.status(500).json({ message: "Error deleting approval step" });
    }
  });

  // ===== MOTIVOS DE PERMISOS ROUTES =====
  
  // Get all motivos de permisos organizados por categoría
  app.get("/api/motivos-permisos", async (req, res) => {
    try {
      const motivos = await storage.getMotivosPermisos();
      res.json(motivos);
    } catch (error) {
      console.error("Error fetching motivos permisos:", error);
      res.status(500).json({ message: "Error fetching motivos permisos" });
    }
  });

  // Get motivos por categoría específica
  app.get("/api/motivos-permisos/categoria/:categoria", async (req, res) => {
    try {
      const { categoria } = req.params;
      const motivos = await storage.getMotivosPorCategoria(categoria);
      res.json(motivos);
    } catch (error) {
      console.error("Error fetching motivos by categoria:", error);
      res.status(500).json({ message: "Error fetching motivos by categoria" });
    }
  });

  // Create new motivo
  app.post("/api/motivos-permisos", async (req, res) => {
    try {
      const validatedData = insertMotivoPermisoSchema.parse(req.body);
      const newMotivo = await storage.createMotivoPermiso(validatedData);
      res.status(201).json(newMotivo);
    } catch (error) {
      console.error("Error creating motivo permiso:", error);
      res.status(400).json({ message: "Error creating motivo permiso" });
    }
  });

  // Update motivo
  app.patch("/api/motivos-permisos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const updates = req.body;
      const updatedMotivo = await storage.updateMotivoPermiso(id, updates);
      
      if (!updatedMotivo) {
        return res.status(404).json({ message: "Motivo not found" });
      }
      
      res.json(updatedMotivo);
    } catch (error) {
      console.error("Error updating motivo permiso:", error);
      res.status(400).json({ message: "Error updating motivo permiso" });
    }
  });

  // Delete motivo (soft delete)
  app.delete("/api/motivos-permisos/:id", async (req, res) => {
    try {
      const id = parseInt(req.params.id);
      const deleted = await storage.deleteMotivoPermiso(id);
      
      if (!deleted) {
        return res.status(404).json({ message: "Motivo not found" });
      }
      
      res.status(204).send();
    } catch (error) {
      console.error("Error deleting motivo permiso:", error);
      res.status(400).json({ message: "Error deleting motivo permiso" });
    }
  });

  // API endpoint para obtener usuarios reales
  app.get("/api/users", async (req, res) => {
    try {
      const url = "https://customerapi.geovictoria.com/api/v1/User/ListComplete";
      const authHeader = process.env.AUTHORIZATION_HEADER;
      
      if (!authHeader) {
        return res.status(500).json({ error: "AUTHORIZATION_HEADER not configured" });
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Extraer solo los campos necesarios y usuarios activos
      const users = data
        .filter((user: any) => user.Enabled === "1")
        .map((user: any) => ({
          id: user.Id || "",
          employee_id: user.Identifier || "",
          name: `${user.Name || ""} ${user.LastName || ""}`.trim(),
          group_name: user.GroupDescription || "",
          position_name: user.PositionDescription || ""
        }));
      
      res.json(users);
    } catch (error) {
      console.error("Error fetching users:", error);
      res.status(500).json({ error: "Failed to fetch users" });
    }
  });

  // API endpoint para obtener datos completos de usuarios (para grupos)
  app.get("/api/users-complete", async (req, res) => {
    try {
      const url = "https://customerapi.geovictoria.com/api/v1/User/ListComplete";
      const authHeader = process.env.AUTHORIZATION_HEADER;
      
      if (!authHeader) {
        return res.status(500).json({ error: "AUTHORIZATION_HEADER not configured" });
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      res.json(data);
    } catch (error) {
      console.error("Error fetching complete user data:", error);
      res.status(500).json({ error: "Failed to fetch complete user data" });
    }
  });

  // API endpoint para obtener información de la empresa
  app.get("/api/company", async (req, res) => {
    try {
      const url = "https://customerapi.geovictoria.com/api/v1/Company/TradeNameList";
      const authHeader = process.env.AUTHORIZATION_HEADER;
      
      if (!authHeader) {
        return res.status(500).json({ error: "AUTHORIZATION_HEADER not configured" });
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Buscar la empresa base (IsTradeNameBase = "1")
      const baseCompany = data.Response?.find((company: any) => company.IsTradeNameBase === "1");
      
      if (baseCompany) {
        res.json({ name: baseCompany.Name });
      } else {
        // Si no hay empresa base, tomar la primera
        const firstCompany = data.Response?.[0];
        res.json({ name: firstCompany?.Name || "Empresa" });
      }
    } catch (error) {
      console.error("Error fetching company data:", error);
      res.status(500).json({ error: "Failed to fetch company data" });
    }
  });

  // API endpoint para obtener tipos de permisos desde GeoVictoria
  app.get("/api/timeoff-types", async (req, res) => {
    try {
      const url = "https://customerapi.geovictoria.com/api/v1/TimeOff/GetTypes";
      const authHeader = process.env.AUTHORIZATION_HEADER;
      
      if (!authHeader) {
        return res.status(500).json({ error: "AUTHORIZATION_HEADER not configured" });
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Filtrar tipos habilitados y organizar por IsParcial
      const enabledTypes = data
        .filter((item: any) => item.Status === "enabled" && item.TranslatedDescription && item.TranslatedDescription.trim() !== "");
      
      const permisosCompletos = enabledTypes
        .filter((item: any) => !item.IsParcial && item.TranslatedDescription !== "Vacaciones")
        .map((item: any) => item.TranslatedDescription);
      
      const permisosParciales = enabledTypes
        .filter((item: any) => item.IsParcial && item.TranslatedDescription !== "Vacaciones")
        .map((item: any) => item.TranslatedDescription);
      
      res.json({
        permisosCompletos,
        permisosParciales
      });
    } catch (error) {
      console.error("Error fetching timeoff types:", error);
      res.status(500).json({ error: "Failed to fetch timeoff types" });
    }
  });

  // API endpoint para obtener tipos completos (con IDs) desde GeoVictoria
  app.get("/api/timeoff-types-complete", async (req, res) => {
    try {
      const url = "https://customerapi.geovictoria.com/api/v1/TimeOff/GetTypes";
      const authHeader = process.env.AUTHORIZATION_HEADER;
      
      if (!authHeader) {
        return res.status(500).json({ error: "AUTHORIZATION_HEADER not configured" });
      }
      
      const response = await fetch(url, {
        method: 'POST',
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        }
      });
      
      if (!response.ok) {
        throw new Error(`API responded with status: ${response.status}`);
      }
      
      const data = await response.json();
      
      // Retornar datos completos para mapping de IDs
      const timeOffTypes = data
        .filter((item: any) => item.Status === "enabled")
        .map((item: any) => ({
          id: item.Id,
          translatedDescription: item.TranslatedDescription,
          status: item.Status,
          isPayable: item.IsPayable,
          externalId: item.ExternalId
        }));
      
      res.json(timeOffTypes);
    } catch (error) {
      console.error("Error fetching complete timeoff types:", error);
      res.status(500).json({ error: "Failed to fetch complete timeoff types" });
    }
  });

  // API endpoint para sincronizar solicitud aprobada con GeoVictoria
  app.post("/api/sync-to-geovictoria", async (req, res) => {
    try {
      const { userIdentifier, motivo, startDate, endDate } = req.body;
      const authHeader = process.env.AUTHORIZATION_HEADER;
      
      if (!authHeader) {
        return res.status(500).json({ error: "AUTHORIZATION_HEADER not configured" });
      }

      // Obtener tipos de timeoff para mapear el motivo al ID
      const typesUrl = "https://customerapi.geovictoria.com/api/v1/TimeOff/GetTypes";
      const typesResponse = await fetch(typesUrl, {
        method: 'POST',
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        }
      });

      if (!typesResponse.ok) {
        throw new Error(`Failed to fetch timeoff types: ${typesResponse.status}`);
      }

      const timeOffTypes = await typesResponse.json();
      
      // Buscar el ID del tipo basado en el motivo
      const timeOffType = timeOffTypes.find((type: any) => 
        type.TranslatedDescription === motivo && type.Status === "enabled"
      );

      if (!timeOffType) {
        return res.status(400).json({ error: `TimeOff type not found for motivo: ${motivo}` });
      }

      // Formatear fechas para GeoVictoria (YYYYMMDDHHMMSS)
      const formatDateForGeoVictoria = (dateStr: string) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}000000`;
      };

      const formatEndDateForGeoVictoria = (dateStr: string) => {
        const date = new Date(dateStr);
        const year = date.getFullYear();
        const month = String(date.getMonth() + 1).padStart(2, '0');
        const day = String(date.getDate()).padStart(2, '0');
        return `${year}${month}${day}235959`;
      };

      // Preparar datos para GeoVictoria
      const geoVictoriaData = {
        UserIdentifier: userIdentifier,
        TimeOffTypeId: timeOffType.Id,
        StartDate: formatDateForGeoVictoria(startDate),
        EndDate: formatEndDateForGeoVictoria(endDate)
      };

      // Enviar a GeoVictoria
      const upsertUrl = "https://customerapi.geovictoria.com/api/v1/TimeOff/Upsert";
      const upsertResponse = await fetch(upsertUrl, {
        method: 'POST',
        headers: {
          "Authorization": authHeader,
          "Content-Type": "application/json"
        },
        body: JSON.stringify(geoVictoriaData)
      });

      if (!upsertResponse.ok) {
        const errorText = await upsertResponse.text();
        throw new Error(`GeoVictoria API error: ${upsertResponse.status} - ${errorText}`);
      }

      const result = await upsertResponse.json();
      
      res.json({ 
        success: true, 
        message: "Request synced to GeoVictoria successfully",
        geoVictoriaResponse: result,
        sentData: geoVictoriaData
      });

    } catch (error) {
      console.error("Error syncing to GeoVictoria:", error);
      res.status(500).json({ error: "Failed to sync to GeoVictoria", details: error });
    }
  });

  // API endpoint to get available motivos for a specific user profile
  app.get("/api/available-motivos/:userProfile", async (req, res) => {
    try {
      const { userProfile } = req.params;
      
      // Get all approval schemas
      const schemas = await storage.getApprovalSchemas();
      
      // Filter schemas that have the user's profile in visibility permissions
      const visibleSchemas = schemas.filter(schema => {
        const visibilityPermissions = schema.visibilityPermissions || [];
        return visibilityPermissions.includes(userProfile);
      });
      
      // Extract all motivos from visible schemas
      const availableMotivos: string[] = [];
      visibleSchemas.forEach(schema => {
        if (schema.motivos && schema.motivos.length > 0) {
          availableMotivos.push(...schema.motivos);
        }
      });
      
      // Remove duplicates and sort
      const uniqueMotivos = availableMotivos.filter((motivo, index, array) => array.indexOf(motivo) === index).sort();
      
      res.json({
        motivos: uniqueMotivos,
        visibleSchemas: visibleSchemas.map(s => ({ id: s.id, nombre: s.nombre, motivos: s.motivos }))
      });
    } catch (error) {
      console.error("Error fetching available motivos:", error);
      res.status(500).json({ error: "Failed to fetch available motivos" });
    }
  });

  // Error handling middleware - must be after all routes
  app.use((err: any, req: any, res: any, next: any) => {
    console.error("API Error:", err);
    const status = err.status || err.statusCode || 500;
    const message = err.message || "Internal Server Error";
    res.status(status).json({ message });
  });

  const httpServer = createServer(app);
  return httpServer;
}
