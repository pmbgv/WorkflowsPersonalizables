import type { Express } from "express";
import { createServer, type Server } from "http";
import { storage } from "./storage";
import { insertRequestSchema, insertApprovalSchemaSchema, insertApprovalStepSchema } from "@shared/schema";
import { z } from "zod";

export async function registerRoutes(app: Express): Promise<Server> {
  // Get all requests with optional filters
  app.get("/api/requests", async (req, res) => {
    try {
      const { estado, tipo, fechaInicio, fechaFin, busqueda } = req.query;
      
      const filters = {
        estado: estado as string,
        tipo: tipo as string,
        fechaInicio: fechaInicio as string,
        fechaFin: fechaFin as string,
        busqueda: busqueda as string,
      };

      const requests = await storage.getRequests(filters);
      res.json(requests);
    } catch (error) {
      res.status(500).json({ message: "Error fetching requests" });
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
      const validatedData = insertRequestSchema.parse(req.body);
      const newRequest = await storage.createRequest(validatedData);
      res.status(201).json(newRequest);
    } catch (error) {
      if (error instanceof z.ZodError) {
        return res.status(400).json({ 
          message: "Validation error", 
          errors: error.errors 
        });
      }
      res.status(500).json({ message: "Error creating request" });
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
      
      const updatedRequest = await storage.updateRequest(id, { estado });
      
      if (!updatedRequest) {
        return res.status(404).json({ message: "Request not found" });
      }

      // If status changed to "Aprobado", send notification to external system
      if (estado === "Aprobado") {
        try {
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
      
      const updatedSchema = await storage.updateApprovalSchema(id, updates);
      
      if (!updatedSchema) {
        return res.status(404).json({ message: "Approval schema not found" });
      }
      
      res.json(updatedSchema);
    } catch (error) {
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
